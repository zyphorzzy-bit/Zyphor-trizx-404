
const logger = require('../utils/logger');

async function handleButton(interaction, client) {
  if (!interaction.isButton()) return false;

  try {
    // Os botões do painel serão tratados aqui.
    // O formato dos IDs será: zyphor:secao:acao
    const parts = interaction.customId.split(':');

    if (parts[0] !== 'zyphor') return false;

    const section = parts[1];
    const action = parts[2];

    logger.info(
      `Botão acionado: ${interaction.customId}`,
      {
        userId: interaction.user.id,
        guildId: interaction.guildId
      }
    );

    // As ações reais serão adicionadas junto com o painel /config.
    if (!section || !action) {
      await interaction.reply({
        content: 'Este botão possui uma configuração inválida.',
        ephemeral: true
      });

      return true;
    }

    await interaction.reply({
      content: 'Esta função ainda está sendo preparada.',
      ephemeral: true
    });

    return true;
  } catch (error) {
    logger.error('Erro ao processar botão', error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Não foi possível processar esse botão.',
        ephemeral: true
      }).catch(() => {});
    }

    return true;
  }
}

module.exports = { handleButton };
