import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Chybí povinná proměnná prostředí: ${name}`);
  }
  return value;
}

function resolveFromProject(relativeOrAbsolutePath) {
  if (!relativeOrAbsolutePath) {
    return null;
  }
  return path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.resolve(projectRoot, relativeOrAbsolutePath);
}

export const config = {
  projectRoot,
  timezone: process.env.TIMEZONE || 'Europe/Prague',
  checkCron: process.env.CHECK_CRON || '*/15 * * * *',
  logFile: resolveFromProject(process.env.LOG_FILE || './runtime/job.log'),
  trainingEventQuery: (process.env.TRAINING_EVENT_QUERY || 'karate').toLowerCase(),
  telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  telegramChatId: requireEnv('TELEGRAM_CHAT_ID'),
  googleClientId: requireEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
  googleRefreshToken: requireEnv('GOOGLE_REFRESH_TOKEN'),
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  manualFile: resolveFromProject(process.env.MANUAL_FILE || '../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md'),
  advancedManualFile: resolveFromProject(process.env.ADVANCED_MANUAL_FILE || '../content/kompletni_trenersky_manual_shorin_ryu_pokrocili_8_6_kyu_v1.md'),
  stateFile: resolveFromProject(process.env.STATE_FILE || './runtime/state.json'),
  preferencesFile: resolveFromProject(process.env.PREFERENCES_FILE || './config/preferences.md'),
  agentRoleFile: resolveFromProject(process.env.AGENT_ROLE_FILE || './config/agent_role.md')
};
