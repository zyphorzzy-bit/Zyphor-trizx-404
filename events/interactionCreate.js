
const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    try {
      // As interações são processadas pelo index.js.
      // Este evento existe apenas para documentar essa responsabilidade.
      // Não adicione outro listener aqui, para evitar processamento duplicado.

      if (!interaction || !client) {
        logger.warn('Interação recebida sem os dados necessários.');
      }
    } catch (error) {
      logger.error(
        'Erro no evento InteractionCreate',
        error.message
      );
    }
  }
};
