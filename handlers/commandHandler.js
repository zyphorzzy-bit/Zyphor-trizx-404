
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');

  if (!fs.existsSync(commandsPath)) {
    logger.warn('A pasta commands não foi encontrada.');
    return;
  }

  const files = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of files) {
    const filePath = path.join(commandsPath, file);

    try {
      delete require.cache[require.resolve(filePath)];

      const command = require(filePath);

      if (!command.data || !command.execute) {
        logger.warn(`Comando ignorado: ${file}`);
        continue;
      }

      client.commands.set(command.data.name, command);
      logger.info(`Comando carregado: ${command.data.name}`);
    } catch (error) {
      logger.error(`Erro ao carregar ${file}`, error);
    }
  }
}

module.exports = { loadCommands };
