
const logger = require('../utils/logger');

async function handleSelectMenu(interaction, client) {
  if (!interaction.isStringSelectMenu()) return false;

  try {
    const parts = interaction.customId.split(':');

    if (parts[0] !== 'zyphor') return false;

    const section = parts[1];
    const action = parts[2];

    logger.info(`Menu selecionado: ${interaction.customId}`, {
      userId: interaction.user.id,
      guildId: interaction.guildId,
      values: interaction.values
    });

    if (!section || !action) {
      await interaction.reply({
        content: 'Este menu possui uma configuração inválida.',
        ephemeral: true
      });

      return true;
    }

    await interaction.reply({
      content: 'Esta opção ainda está sendo preparada.',
      ephemeral: true
    });

    return true;
  } catch (error) {
    logger.error('Erro ao processar menu de seleção', error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Não foi possível processar essa seleção.',
        ephemeral: true
      }).catch(() => {});
    }

    return true;
  }
}

module.exports = { handleSelectMenu };
