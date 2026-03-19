import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const REMINDER_WINDOW_DEFINITIONS = {
  '24h': {
    type: '24h',
    mode: 'range',
    minHours: 0,
    maxHours: 24,
    defaultToleranceMinutes: 20
  },
  '30h': {
    type: '30h',
    mode: 'target',
    targetHours: 30,
    defaultToleranceMinutes: 20
  },
  '6h': {
    type: '6h',
    mode: 'target',
    targetHours: 6,
    defaultToleranceMinutes: 20
  }
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Chybí povinná proměnná prostředí: ${name}`);
  }
  return value;
}

function requireEnvWhen(condition, name) {
  if (!condition) {
    return process.env[name] || null;
  }
  return requireEnv(name);
}

function resolveFromProject(relativeOrAbsolutePath) {
  if (!relativeOrAbsolutePath) {
    return null;
  }
  return path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.resolve(projectRoot, relativeOrAbsolutePath);
}

function parseReminderTypes(value) {
  const rawTypes = (value || '24h')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const uniqueTypes = [...new Set(rawTypes)].filter((type) => REMINDER_WINDOW_DEFINITIONS[type]);
  return uniqueTypes.length ? uniqueTypes : ['24h'];
}

function parseToleranceMinutes(type) {
  const envName = `REMINDER_TOLERANCE_MINUTES_${type.toUpperCase()}`;
  const rawValue = process.env[envName];
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : REMINDER_WINDOW_DEFINITIONS[type].defaultToleranceMinutes;
}

function buildReminderWindows() {
  return parseReminderTypes(process.env.REMINDER_TYPES).map((type) => {
    const definition = REMINDER_WINDOW_DEFINITIONS[type];
    return {
      type,
      mode: definition.mode || 'target',
      minHours: definition.minHours ?? null,
      maxHours: definition.maxHours ?? null,
      targetHours: definition.targetHours ?? null,
      toleranceMinutes: parseToleranceMinutes(type)
    };
  });
}

export const config = {
  projectRoot,
  timezone: process.env.TIMEZONE || 'Europe/Prague',
  checkCron: process.env.CHECK_CRON || '0 */12 * * *',
  trainingGroup: process.env.TRAINING_GROUP || null,
  reminderWindows: buildReminderWindows(),
  stateBackend: process.env.STATE_BACKEND || 'local',
  logFile: resolveFromProject(process.env.LOG_FILE || './runtime/job.log'),
  trainingEventQuery: (process.env.TRAINING_EVENT_QUERY || 'karate').toLowerCase(),
  telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  telegramChatId: requireEnv('TELEGRAM_CHAT_ID'),
  googleClientId: requireEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
  googleRefreshToken: requireEnv('GOOGLE_REFRESH_TOKEN'),
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  githubStateGistId: requireEnvWhen((process.env.STATE_BACKEND || 'local') === 'github-gist', 'GITHUB_STATE_GIST_ID'),
  githubStateFilename: process.env.GITHUB_STATE_FILENAME || 'state.json',
  githubStateToken: requireEnvWhen((process.env.STATE_BACKEND || 'local') === 'github-gist', 'GITHUB_STATE_TOKEN'),
  manualFile: resolveFromProject(process.env.MANUAL_FILE || '../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md'),
  advancedManualFile: resolveFromProject(process.env.ADVANCED_MANUAL_FILE || '../content/kompletni_trenersky_manual_shorin_ryu_pokrocili_8_6_kyu_v1.md'),
  stateFile: resolveFromProject(process.env.STATE_FILE || './runtime/state.json'),
  preferencesFile: resolveFromProject(process.env.PREFERENCES_FILE || './config/preferences.md'),
  agentRoleFile: resolveFromProject(process.env.AGENT_ROLE_FILE || './config/agent_role.md')
};
