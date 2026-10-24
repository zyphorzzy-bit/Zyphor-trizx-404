
const { EmbedBuilder } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../utils/storage');
const { isOwner, canAccessConfig } = require('../utils/permissions');
const emojis = require('../utils/emojis');
const logger = require('../utils/logger');

async function handleSelectMenu(interaction, client) {
  if (!interaction.isStringSelectMenu()) return false;
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

    // Validar a permissão novamente a cada interação.
    if (!canAccessConfig(interaction, config)) {
      await interaction.reply({
        content: `${emojis.negative} Você não tem permissão para alterar estas configurações.`,
        ephemeral: true
      });
      return true;
    }

    const [, section, action] = interaction.customId.split(':');
    const value = interaction.values[0];

    if (section === 'config' && action === 'category') {
      const categories = {
        moderation: ['Moderação', 'Configurações de banimento, expulsão, timeout e avisos.'],
        logs: ['Logs e segurança', 'Configurações dos registros de segurança.'],
        welcome: ['Boas-vindas', 'Configurações das mensagens de entrada e saída.'],
        prefix: ['Prefixo', 'Escolha o prefixo dos comandos.'],
        permissions: ['Permissões', 'Configuração de acesso ao painel.'],
        ai: ['Inteligência artificial', 'Configurações das funções de IA.']
      };

      const category = categories[value];

      if (!category) {
        await interaction.reply({
          content: 'Categoria inválida.',
          ephemeral: true
        });
        return true;
      }

      const embed = new EmbedBuilder()
        .setColor(0x181818)
        .setTitle(`${emojis.config} ${category[0]}`)
        .setDescription(
          `${category[1]}\n\n` +
          'Esta seção está sendo preparada. As opções serão habilitadas à medida que os sistemas forem implementados.'
        )
        .setFooter({ text: 'Zyphor Bot • Configurações' });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      return true;
    }

    if (section === 'prefix' && action === 'choose') {
      const allowedPrefixes = ['!', '.', '?', '+', '×'];

      if (!allowedPrefixes.includes(value)) {
        await interaction.reply({
          content: 'Esse prefixo não é permitido.',
          ephemeral: true
        });
        return true;
      }

      const updated = updateGuildConfig(interaction.guild.id, {
        prefix: value
      });

      await interaction.update({
        content: `${emojis.positive} Prefixo salvo: \`${updated.prefix}\``,
        components: [],
        embeds: []
      });

      logger.info('Prefixo atualizado', {
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        prefix: value
      });

      return true;
    }

    await interaction.reply({
      content: 'Esta opção ainda não está implementada.',
      ephemeral: true
    });

    return true;
  } catch (error) {
    logger.error('Erro no menu de seleção', error);

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
