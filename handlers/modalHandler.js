
const logger = require('../utils/logger');

async function handleModal(interaction, client) {
  if (!interaction.isModalSubmit()) return false;

  try {
    const parts = interaction.customId.split(':');

    if (parts[0] !== 'zyphor') return false;

    const section = parts[1];
    const action = parts[2];

    logger.info(`Formulário enviado: ${interaction.customId}`, {
      userId: interaction.user.id,
      guildId: interaction.guildId
    });

    if (!section || !action) {
      await interaction.reply({
        content: 'Este formulário possui uma configuração inválida.',
        ephemeral: true
      });

      return true;
    }

    await interaction.reply({
      content: 'Este formulário ainda está sendo preparado.',
      ephemeral: true
    });

    return true;
  } catch (error) {
    logger.error('Erro ao processar formulário', error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Não foi possível processar esse formulário.',
        ephemeral: true
      }).catch(() => {});
    }

    return true;
  }
}

module.exports = { handleModal };
