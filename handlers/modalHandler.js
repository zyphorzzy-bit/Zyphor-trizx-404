
const { getGuildConfig, updateGuildConfig } = require('../utils/storage');
const { canAccessConfig } = require('../utils/permissions');
const emojis = require('../utils/emojis');
const logger = require('../utils/logger');

async function handleModal(interaction, client) {
  if (!interaction.isModalSubmit()) return false;
  if (!interaction.customId.startsWith('zyphor:')) return false;

  try {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'Use este formulário dentro de um servidor.',
        ephemeral: true
      });
      return true;
    }

    const config = getGuildConfig(interaction.guild.id);

    // Revalidar as permissões ao enviar o formulário.
    if (!canAccessConfig(interaction, config)) {
      await interaction.reply({
        content: `${emojis.negative} Você não tem permissão para alterar estas configurações.`,
        ephemeral: true
      });
      return true;
    }

    const [, section, action] = interaction.customId.split(':');

    if (section === 'config' && action === 'prefix') {
      const prefix = interaction.fields.getTextInputValue('prefix').trim();
      const allowedPrefixes = ['!', '.', '?', '+', '×'];

      if (!allowedPrefixes.includes(prefix)) {
        await interaction.reply({
          content: 'Prefixo inválido. Escolha: !, ., ?, + ou ×.',
          ephemeral: true
        });
        return true;
      }

      updateGuildConfig(interaction.guild.id, { prefix });

      await interaction.reply({
        content: `${emojis.positive} Prefixo salvo: \`${prefix}\``,
        ephemeral: true
      });

      logger.info('Prefixo atualizado por formulário', {
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        prefix
      });

      return true;
    }

    await interaction.reply({
      content: 'Este formulário ainda não está implementado.',
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
