
const {
  EmbedBuilder,
  MessageFlags
} = require('discord.js');

const {
  canAccessConfig
} = require('../utils/permissions');

const {
  getGuildConfig,
  updateGuildConfig
} = require('../utils/storage');

const logger = require('../utils/logger');

async function handleSelectMenu(interaction, client) {
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

  try {
    const config = getGuildConfig(interaction.guild.id);

    if (!canAccessConfig(interaction.member, config)) {
      await interaction.reply({
        content: 'Você não tem permissão para alterar estas configurações.',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }

    const id = interaction.customId;
    const selected = interaction.values?.[0];

    // Seleção de categoria no painel.
    if (id === 'zyphor:config:category') {
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

      const category = categories[selected];

      if (!category) {
        await interaction.reply({
          content: 'Categoria inválida.',
          flags: MessageFlags.Ephemeral
        });
        return true;
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x242424)
            .setTitle(`Configuração • ${category}`)
            .setDescription(
              'A categoria foi selecionada. As opções específicas desta seção precisam ser configuradas no painel.'
            )
        ],
        flags: MessageFlags.Ephemeral
      });

      return true;
    }

    // Seleção do canal de logs de segurança.
    if (id === 'zyphor:logs:security-channel') {
      const channel = interaction.channels?.first();

      if (!channel || !channel.isTextBased()) {
        await interaction.reply({
          content: 'Selecione um canal de texto válido.',
          flags: MessageFlags.Ephemeral
        });
        return true;
      }

      updateGuildConfig(interaction.guild.id, {
        logs: {
          securityChannelId: channel.id
        }
      });

      await interaction.reply({
        content: `Canal de logs de segurança definido para ${channel}.`,
        flags: MessageFlags.Ephemeral
      });

      return true;
    }

    // Seleção do prefixo.
    if (id === 'zyphor:prefix:choose') {
      const allowedPrefixes = ['!', '.', '?', '+', '×'];

      if (!allowedPrefixes.includes(selected)) {
        await interaction.reply({
          content: 'Prefixo inválido. Escolha !, ., ?, + ou ×.',
          flags: MessageFlags.Ephemeral
        });
        return true;
      }

      updateGuildConfig(interaction.guild.id, {
        prefix: selected
      });

      await interaction.reply({
        content: `Prefixo atualizado para \`${selected}\`.`,
        flags: MessageFlags.Ephemeral
      });

      return true;
    }

    // Seleção de cargos autorizados a configurar o bot.
    if (id === 'zyphor:permissions:config-roles') {
      const roleIds = interaction.values || [];

      updateGuildConfig(interaction.guild.id, {
        permissions: {
          configRoleIds: roleIds
        }
      });

      await interaction.reply({
        content: 'Cargos autorizados para configuração atualizados.',
        flags: MessageFlags.Ephemeral
      });

      return true;
    }

    logger.info(`Menu ainda não implementado: ${id}`);

    await interaction.reply({
      content: 'Esta opção ainda não está configurada.',
      flags: MessageFlags.Ephemeral
    });

    return true;
  } catch (error) {
    logger.error(
      'Erro ao processar menu de seleção',
      error.message
    );

    const response = {
      content: 'Não foi possível processar essa seleção.',
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
