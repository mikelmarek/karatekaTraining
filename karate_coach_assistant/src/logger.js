import fs from 'node:fs/promises';

function formatLine(level, message, data) {
  const timestamp = new Date().toISOString();
  const payload = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] ${level.toUpperCase()} ${message}${payload}\n`;
}

export async function writeLog(logFile, level, message, data = null) {
  const line = formatLine(level, message, data);
  await fs.appendFile(logFile, line, 'utf8');
}

export async function logInfo(logFile, message, data = null) {
  await writeLog(logFile, 'info', message, data);
}

export async function logError(logFile, message, data = null) {
  await writeLog(logFile, 'error', message, data);
}