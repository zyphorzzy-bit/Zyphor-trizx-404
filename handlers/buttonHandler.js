
const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/storage');
const { canAccessConfig } = require('../utils/permissions');
const emojis = require('../utils/emojis');
const logger = require('../utils/logger');

async function handleButton(interaction, client) {
  if (!interaction.isButton()) return false;
  if (!interaction.customId.startsWith('zyphor:')) return false;

  try {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'Use este painel dentro de um servidor.',
        ephemeral: true
      });
      return true;
    }

    const config = getGuildConfig(interaction.guild.id);

    // Conferir acesso novamente no momento do clique.
    if (!canAccessConfig(interaction, config)) {
      await interaction.reply({
        content: `${emojis.negative} Você não tem permissão para usar este botão.`,
        ephemeral: true
      });
      return true;
    }

    const [, section, action] = interaction.customId.split(':');

    if (section === 'config' && action === 'home') {
      const embed = new EmbedBuilder()
        .setColor(0x181818)
        .setTitle(`${emojis.dashboard} Zyphor Bot`)
        .setDescription(
          'Painel principal de configurações.\n\n' +
          `**Prefixo atual:** \`${config.prefix || '!'}\`\n` +
          'Use o comando `/config` para abrir as categorias.'
        )
        .setFooter({ text: 'Zyphor Bot • Painel de controle' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      return true;
    }

    await interaction.reply({
      content: 'Esta ação ainda está sendo preparada.',
      ephemeral: true
    });

    logger.info('Botão do Zyphor acionado', {
      customId: interaction.customId,
      userId: interaction.user.id,
      guildId: interaction.guild.id
    });

    return true;
  } catch (error) {
    logger.error('Erro no botão', error);

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
