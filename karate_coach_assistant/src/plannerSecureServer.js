import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(projectRoot, '..');
const plannerRoot = path.resolve(workspaceRoot, 'tools', 'training_planner_web');
const plannerDataRoot = path.join(plannerRoot, 'data');

dotenv.config({ path: path.join(projectRoot, '.env') });

const plannerUsername = (process.env.PLANNER_AUTH_USERNAME || '').trim();
const plannerPassword = (process.env.PLANNER_AUTH_PASSWORD || '').trim();
const plannerPasswordHash = (process.env.PLANNER_AUTH_PASSWORD_HASH || '').trim();
const sessionSecret = (process.env.PLANNER_SESSION_SECRET || '').trim();

if (!plannerUsername) {
  throw new Error('Chybí PLANNER_AUTH_USERNAME v .env.');
}

if (!plannerPassword && !plannerPasswordHash) {
  throw new Error('Chybí PLANNER_AUTH_PASSWORD nebo PLANNER_AUTH_PASSWORD_HASH v .env.');
}

if (!sessionSecret) {
  throw new Error('Chybí PLANNER_SESSION_SECRET v .env.');
}

const app = express();
const host = process.env.PLANNER_HOST || '0.0.0.0';
const port = Number(process.env.PLANNER_PORT || process.env.PORT || 4180);
const sessionTtlHours = Number(process.env.PLANNER_SESSION_TTL_HOURS || 168);
const sessionCookieName = 'karate_planner_session';
const loginAttempts = new Map();

app.set('trust proxy', true);
app.use(express.json({ limit: '200kb' }));

function cleanEnv(value) {
  return (value || '').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
}

function getSessionTtlSeconds() {
  return Number.isFinite(sessionTtlHours) && sessionTtlHours > 0 ? Math.round(sessionTtlHours * 60 * 60) : 604800;
}

function deriveKey(secret) {
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

function b64urlEncode(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + padding, 'base64').toString('utf8');
}

function signPayload(payloadB64) {
  return b64urlEncode(crypto.createHmac('sha256', deriveKey(sessionSecret)).update(payloadB64, 'utf8').digest());
}

function createSessionToken(username) {
  const payload = {
    username,
    exp: Math.floor(Date.now() / 1000) + getSessionTtlSeconds()
  };
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  return `${payloadB64}.${signPayload(payloadB64)}`;
}

function parseSessionToken(token) {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [payloadB64, signature] = token.split('.');
  const expectedSignature = signPayload(payloadB64);
  const actualBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(b64urlDecode(payloadB64));
    if (parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header.split(';').map((part) => {
      const [name, ...valueParts] = part.trim().split('=');
      return [name, decodeURIComponent(valueParts.join('='))];
    })
  );
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const current = loginAttempts.get(ip);
  if (!current || current.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }

  current.count += 1;
  loginAttempts.set(ip, current);
}

function clearFailedAttempts(ip) {
  loginAttempts.delete(ip);
}

function isBlockedIp(ip) {
  const item = loginAttempts.get(ip);
  if (!item) {
    return false;
  }
  if (item.resetAt < Date.now()) {
    loginAttempts.delete(ip);
    return false;
  }
  return item.count >= 5;
}

async function verifyPassword(inputPassword) {
  if (plannerPasswordHash) {
    return bcrypt.compare(inputPassword, plannerPasswordHash);
  }

  const provided = Buffer.from(inputPassword, 'utf8');
  const configured = Buffer.from(plannerPassword, 'utf8');
  if (provided.length !== configured.length) {
    return false;
  }
  return crypto.timingSafeEqual(provided, configured);
}

function createTransporter() {
  const hostValue = cleanEnv(process.env.SMTP_HOST);
  const portValue = Number(cleanEnv(process.env.SMTP_PORT));
  const user = cleanEnv(process.env.SMTP_USER);
  const pass = cleanEnv(process.env.SMTP_PASS).replace(/\s+/g, '');

  if (!hostValue || !portValue || !user || !pass) {
    return null;
  }

  const secureRaw = cleanEnv(process.env.SMTP_SECURE).toLowerCase();
  const secure = secureRaw ? ['1', 'true', 'yes'].includes(secureRaw) : portValue === 465;

  return nodemailer.createTransport({
    host: hostValue,
    port: portValue,
    secure,
    auth: { user, pass }
  });
}

async function sendLoginEmail({ username, req }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Planner login email nebyl odeslán: SMTP není nastavené.');
    return;
  }

  const to = cleanEnv(process.env.LOGIN_NOTIFY_TO) || cleanEnv(process.env.SMTP_USER);
  const from = cleanEnv(process.env.SMTP_FROM) || cleanEnv(process.env.SMTP_USER) || 'no-reply@localhost';
  const when = new Date().toISOString();

  await transporter.sendMail({
    to,
    from,
    subject: `Planner login: ${username} ${when}`,
    text: [
      'Planner login detected',
      '',
      `Username: ${username}`,
      `Time: ${when}`,
      `Host: ${req.headers.host || 'unknown'}`,
      `IP: ${getClientIp(req)}`,
      `User-Agent: ${req.headers['user-agent'] || 'unknown'}`
    ].join('\n')
  });
}

function setSessionCookie(req, res, username) {
  const token = createSessionToken(username);
  const parts = [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${getSessionTtlSeconds()}`
  ];

  const forwardedProto = req.headers['x-forwarded-proto'];
  const isHttps = req.secure || forwardedProto === 'https';
  if (isHttps) {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function requireAuth(req, res, next) {
  const session = parseSessionToken(parseCookies(req)[sessionCookieName]);
  if (!session?.username) {
    res.status(401).json({ error: 'Přihlášení je povinné.' });
    return;
  }

  req.auth = session;
  next();
}

async function readPlannerDataFile(filename) {
  const content = await fs.readFile(path.join(plannerDataRoot, filename), 'utf8');
  return JSON.parse(content);
}

app.post('/api/planner/auth/login', async (req, res) => {
  const ip = getClientIp(req);
  if (isBlockedIp(ip)) {
    res.status(429).json({ error: 'Příliš mnoho neúspěšných pokusů. Zkus to za 15 minut.' });
    return;
  }

  const username = (req.body?.username || '').trim();
  const password = req.body?.password || '';
  if (!username || !password) {
    res.status(400).json({ error: 'Vyplň jméno i heslo.' });
    return;
  }

  const usernameMatches = username === plannerUsername;
  const passwordMatches = await verifyPassword(password);
  if (!usernameMatches || !passwordMatches) {
    recordFailedAttempt(ip);
    res.status(401).json({ error: 'Neplatné přihlašovací údaje.' });
    return;
  }

  clearFailedAttempts(ip);
  setSessionCookie(req, res, username);

  try {
    await sendLoginEmail({ username, req });
  } catch (error) {
    console.warn('Nepodařilo se odeslat planner login email.', error.message);
  }

  res.json({ ok: true, username });
});

app.get('/api/planner/auth/session', (req, res) => {
  const session = parseSessionToken(parseCookies(req)[sessionCookieName]);
  if (!session?.username) {
    res.status(401).json({ error: 'Nejsi přihlášený.' });
    return;
  }

  res.json({ ok: true, username: session.username });
});

app.post('/api/planner/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/planner/data', requireAuth, async (_req, res, next) => {
  try {
    res.json(await readPlannerDataFile('planner-data.json'));
  } catch (error) {
    next(error);
  }
});

app.get('/api/planner/shared-state', requireAuth, async (_req, res, next) => {
  try {
    res.json(await readPlannerDataFile('shared-state.json'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Sdílený JSON zatím neexistuje.' });
      return;
    }
    next(error);
  }
});

app.use('/data', requireAuth, express.static(plannerDataRoot, { fallthrough: false }));
app.use(express.static(plannerRoot, { index: 'index.html' }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(plannerRoot, 'index.html'));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Interní chyba planner serveru.' });
});

app.listen(port, host, () => {
  console.log(`Secure planner běží na http://${host}:${port}`);
  console.log('Pro telefon na stejné Wi-Fi použij IP adresu tohoto Macu a stejný port.');
});