
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'zyphor.log');

function ensureLogFile() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    if (!fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '', 'utf8');
    }
  } catch (error) {
    console.error('[Zyphor Logger] Não foi possível preparar o arquivo de logs:', error.message);
  }
}

function writeLog(level, message, details = null) {
  const timestamp = new Date().toISOString();
  const detailText = details
    ? ` | ${typeof details === 'string' ? details : JSON.stringify(details)}`
    : '';

  const line = `[${timestamp}] [${String(level).toUpperCase()}] ${String(message)}${detailText}`;

  console.log(line);

  try {
    ensureLogFile();
    fs.appendFileSync(LOG_FILE, `${line}\n`, 'utf8');
  } catch (error) {
    console.error('[Zyphor Logger] Erro ao salvar log:', error.message);
  }
}

function info(message, details = null) {
  writeLog('INFO', message, details);
}

function success(message, details = null) {
  writeLog('SUCCESS', message, details);
}

function warn(message, details = null) {
  writeLog('WARN', message, details);
}

function error(message, details = null) {
  writeLog('ERROR', message, details);
}

function debug(message, details = null) {
  if (process.env.NODE_ENV === 'development') {
    writeLog('DEBUG', message, details);
  }
}

module.exports = {
  info,
  success,
  warn,
  error,
  debug
};
