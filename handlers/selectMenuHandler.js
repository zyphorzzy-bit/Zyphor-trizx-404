
const { EmbedBuilder, MessageFlags } = require('discord.js');
const {
  canAccessConfig
} = require('../utils/permissions');
const {
  getGuildConfig,
  updateGuildConfig
} = require('../utils/storage');
const logger = require('../utils/logger');

async function handleSelectMenu(interaction) {
  const isSelectMenu =
    interaction.isStringSelectMenu() ||
    interaction.isChannelSelectMenu() ||
    interaction.isRoleSelectMenu() ||
    interaction.isUserSelectMenu() ||
    interaction.isMentionableSelectMenu();

  if (!isSelectMenu) return false;

  if (!interaction.customId.startsWith('zyphor:')) {
    return false;
  }

  if (!interaction.guild) {
    await interaction.reply({
      content: 'Este menu só pode ser usado dentro de um servidor.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  const config = getGuildConfig(interaction.guild.id);

  if (!canAccessConfig(interaction.member, config)) {
    await interaction.reply({
      content: 'Você não tem permissão para usar este painel.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  try {
    const id = interaction.customId;

    // Seleção do canal de logs de segurança.
    if (id === 'zyphor:logs:security-channel') {
      const channel = interaction.channels.first();

      if (!channel || !channel.isTextBased()) {
        await interaction.reply({
          content: 'Selecione um canal de texto válido.',
          flags: MessageFlags.Ephemeral
        });
        return true;
      }

      updateGuildConfig(interaction.guild.id, {
        logs: { securityChannelId: channel.id }
      });

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0x242424)
            .setTitle('🛡️ Logs de segurança')
            .setDescription(
              `Canal de logs configurado para ${channel}.`
            )
            .setFooter({ text: 'Zyphor Bot • Configurações' })
        ],
        components: []
      });

      return true;
    }

    // Seleção do prefixo.
    if (id === 'zyphor:prefix:choose') {
      const prefix = interaction.values[0];
      const allowedPrefixes = ['!', '.', '?', '+', '×'];

      if (!allowedPrefixes.includes(prefix)) {
        await interaction.reply({
          content: 'Esse prefixo não é permitido.',
          flags: MessageFlags.Ephemeral
        });
        return true;
      }

      updateGuildConfig(interaction.guild.id, { prefix });

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0x242424)
            .setTitle('Prefixo atualizado')
            .setDescription(`O prefixo agora é \`${prefix}\`.`)
        ],
        components: []
      });

      return true;
    }

    // Seleção da categoria de configuração.
    if (id === 'zyphor:config:category') {
      const category = interaction.values[0];

      const categories = {
        security: 'Segurança',
        moderation: 'Moderação',
        logs: 'Logs',
        welcome: 'Boas-vindas',
        permissions: 'Permissões',
        tickets: 'Tickets',
        ai: 'Inteligência artificial',
        prefix: 'Prefixo'
      };

      if (!categories[category]) {
        await interaction.reply({
          content: 'Categoria desconhecida.',
          flags: MessageFlags.Ephemeral
        });
        return true;
      }

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0x242424)
            .setTitle(`Configuração • ${categories[category]}`)
            .setDescription(
              'Esta categoria foi selecionada. Os controles específicos serão adicionados ao painel.'
            )
            .setFooter({ text: 'Zyphor Bot • Configurações' })
        ],
        components: []
      });

      return true;
    }

    // Seleção de cargos autorizados a acessar a configuração.
    if (id === 'zyphor:permissions:config-roles') {
      const roleIds = interaction.values;

      updateGuildConfig(interaction.guild.id, {
        permissions: { configRoleIds: roleIds }
      });

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0x242424)
            .setTitle('Permissões atualizadas')
            .setDescription(
              roleIds.length
                ? `Foram autorizados ${roleIds.length} cargo(s).`
                : 'A lista de cargos autorizados foi limpa.'
            )
        ],
        components: []
      });

      return true;
    }

    logger.info(`Menu ainda não implementado: ${id}`);

    await interaction.reply({
      content: 'Esta opção ainda está sendo configurada.',
      flags: MessageFlags.Ephemeral
    });

    return true;
  } catch (error) {
    logger.error('Erro ao processar menu de seleção', error.message);

    const response = {
      content: 'Não foi possível salvar essa configuração.',
      flags: MessageFlags.Ephemeral
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response).catch(() => {});
    } else {
      await interaction.reply(response).catch(() => {});
    }

    return true;
  }
}

module.exports = { handleSelectMenu };
