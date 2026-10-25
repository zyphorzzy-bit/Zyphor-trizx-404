
const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const { updateBotStatus } = require('../systems/liveStatus');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    try {
      logger.success(`Zyphor Bot conectado como ${client.user.tag}`);

      await updateBotStatus(client);

      logger.info(
        `Servidores conectados: ${client.guilds.cache.size}`
      );
    } catch (error) {
      logger.error('Erro durante a inicialização do bot', error.message);

      client.user.setPresence({
        activities: [
          {
            name: 'Zyphor | /config',
            type: ActivityType.Watching
          }
        ],
        status: 'online'
      });
    }
  }
};
