const {
  EmbedBuilder,
  MessageFlags
} = require('discord.js');

const { canAccessConfig } = require('../utils/permissions');
const { getGuildConfig, updateGuildConfig } = require('../utils/storage');

const PREFIXES = ['!', '.', '?', '+', '×'];

async function handleSelectMenu(interaction) {
  if (
    !interaction.isStringSelectMenu() &&
    !interaction.isChannelSelectMenu() &&
    !interaction.isRoleSelectMenu()
  ) {
    return false;
  }

  const id = interaction.customId;

  if (!id.startsWith('zyphor:')) return false;

  if (!interaction.guild) {
    await interaction.reply({
      content: 'Este menu só pode ser usado dentro de um servidor.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  const guildId = interaction.guild.id;
  const config = getGuildConfig(guildId);

  if (!canAccessConfig(interaction.member, config)) {
    await interaction.reply({
      content: 'Você não tem permissão para alterar esta configuração.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  // Seleção de canal de Logs de Segurança
  if (id === 'zyphor:logs:security-channel') {
    const channel = interaction.channels.first();

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        content: 'Selecione um canal de texto válido.',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }

    updateGuildConfig(guildId, {
      logs: {
        ...config.logs,
        securityChannelId: channel.id
      }
    });

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x242424)
          .setTitle('🛡️ Logs de Segurança')
          .setDescription(
            `Canal configurado: ${channel}\n\nOs sistemas poderão usar este canal para registrar alertas de segurança.`
          )
          .setFooter({ text: 'Zyphor Bot • Configuração' })
      ],
      components: []
    });

    return true;
  }

  // Seleção de prefixo
  if (id === 'zyphor:prefix:choose' && interaction.isStringSelectMenu()) {
    const prefix = interaction.values[0];

    if (!PREFIXES.includes(prefix)) {
      await interaction.reply({
        content: 'Esse prefixo não é permitido.',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }

    updateGuildConfig(guildId, { prefix });

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x242424)
          .setTitle('Prefixo atualizado')
          .setDescription(`O prefixo agora é \`${prefix}\`.`)
          .setFooter({ text: 'Zyphor Bot • Configuração' })
      ],
      components: []
    });

    return true;
  }

  // Menu principal de categorias
  if (id === 'zyphor:config:category' && interaction.isStringSelectMenu()) {
    const category = interaction.values[0];

    const categories = {
      security: {
        title: 'Zyphor Security',
        description: 'Configure as proteções contra spam, raids, bots, GIFs e ações destrutivas.'
      },
      moderation: {
        title: 'Moderação',
        description: 'Configure as ferramentas de moderação do servidor.'
      },
      logs: {
        title: 'Logs e segurança',
        description: 'Selecione o canal onde serão enviados os registros.'
      },
      welcome: {
        title: 'Boas-vindas',
        description: 'Configure mensagens de entrada e saída.'
      },
      permissions: {
        title: 'Permissões',
        description: 'Configure os cargos autorizados a usar os painéis.'
      },
      tickets: {
        title: 'Tickets',
        description: 'Configure o sistema de atendimento.'
      },
      ai: {
        title: 'Inteligência artificial',
        description: 'Configure os recursos de IA.'
      },
      prefix: {
        title: 'Prefixo',
        description: `Prefixo atual: \`${config.prefix || '!'}\`.`
      }
    };

    const selected = categories[category];

    if (!selected) {
      await interaction.reply({
        content: 'Categoria inválida.',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }

    const components = [];

    if (category === 'logs') {
      const { ChannelSelectMenuBuilder, ChannelType, ActionRowBuilder } = require('discord.js');

      const channelMenu = new ChannelSelectMenuBuilder()
        .setCustomId('zyphor:logs:security-channel')
        .setPlaceholder('Escolha o canal de Logs de Segurança')
        .setChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(1);

      components.push(
        new ActionRowBuilder().addComponents(channelMenu)
      );
    }

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x242424)
          .setTitle(`Zyphor • ${selected.title}`)
          .setDescription(selected.description)
          .setFooter({ text: 'Zyphor Bot • Configuração' })
      ],
      components
    });

    return true;
  }

  // Seleção de cargos autorizados para configuração
  if (id === 'zyphor:permissions:config-roles' && interaction.isRoleSelectMenu()) {
    const roleIds = interaction.roles.map(role => role.id);

    updateGuildConfig(guildId, {
      permissions: {
        ...config.permissions,
        configRoleIds: roleIds
      }
    });

    await interaction.reply({
      content: 'Cargos autorizados para configuração atualizados.',
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  await interaction.reply({
    content: 'Esta opção ainda está sendo configurada.',
    flags: MessageFlags.Ephemeral
  });

  return true;
}

module.exports = { handleSelectMenu };
