
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data.json');

function readData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(
        DATA_PATH,
        JSON.stringify({ guilds: {} }, null, 2),
        'utf8'
      );
    }

    const content = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(content);

    if (!data.guilds || typeof data.guilds !== 'object') {
      data.guilds = {};
    }

    return data;
  } catch (error) {
    console.error('Erro ao ler data.json:', error.message);
    throw error;
  }
}

function writeData(data) {
  try {
    const temporaryPath = `${DATA_PATH}.tmp`;

    fs.writeFileSync(
      temporaryPath,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    fs.renameSync(temporaryPath, DATA_PATH);
  } catch (error) {
    console.error('Erro ao salvar data.json:', error.message);
    throw error;
  }
}

function getGuildConfig(guildId) {
  const data = readData();

  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      prefix: '!',
      welcome: { enabled: false },
      logs: { enabled: false },
      moderation: { enabled: true },
      ai: { enabled: false }
    };

    writeData(data);
  }

  return data.guilds[guildId];
}

function updateGuildConfig(guildId, updates) {
  const data = readData();
  const current = data.guilds[guildId] || {};

  data.guilds[guildId] = {
    ...current,
    ...updates
  };

  writeData(data);
  return data.guilds[guildId];
}

module.exports = {
  readData,
  writeData,
  getGuildConfig,
  updateGuildConfig
};
