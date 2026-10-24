
const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    logger.info(`Zyphor Bot online como ${client.user.tag}`);

    client.user.setPresence({
      activities: [
        {
          name: 'Zyphor | /config',
          type: ActivityType.Watching
        }
      ],
      status: 'online'
    });

    console.log('Zyphor Bot está pronto para receber comandos!');
  }
};
