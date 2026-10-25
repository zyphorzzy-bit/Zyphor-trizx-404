
const fs = require('node:fs');
const path = require('node:path');

const logger = require('../utils/logger');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');

  if (!fs.existsSync(commandsPath)) {
    logger.warn('A pasta commands não foi encontrada.');
    return;
  }

  const files = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  let loaded = 0;

  for (const file of files) {
    const filePath = path.join(commandsPath, file);

    try {
      delete require.cache[require.resolve(filePath)];

      const command = require(filePath);

      if (
        !command.data ||
        typeof command.data.name !== 'string' ||
        typeof command.execute !== 'function'
      ) {
        logger.warn(`Comando ignorado por formato inválido: ${file}`);
        continue;
      }

      const commandName = command.data.name;

      if (client.commands.has(commandName)) {
        logger.warn(`Comando duplicado ignorado: ${commandName}`);
        continue;
      }

      client.commands.set(commandName, command);
      loaded++;

      logger.success(`Comando preparado: /${commandName}`);
    } catch (error) {
      logger.error(
        `Erro ao carregar o comando ${file}`,
        error.message
      );
    }
  }

  logger.info(`${loaded} comando(s) preparado(s).`);
}

module.exports = { loadCommands };
