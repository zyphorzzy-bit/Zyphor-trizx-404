
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'zyphor.log');

function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function writeLog(level, message, details = null) {
  ensureLogDirectory();

  const timestamp = new Date().toISOString();
  const extra = details
    ? ` | ${details instanceof Error ? details.stack || details.message : JSON.stringify(details)}`
    : '';

  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${extra}\n`;

  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (error) {
    console.error('Não foi possível salvar o log:', error.message);
  }

  console.log(line.trim());
}

module.exports = {
  info: (message, details) => writeLog('info', message, details),
  warn: (message, details) => writeLog('warn', message, details),
  error: (message, details) => writeLog('error', message, details)
};
