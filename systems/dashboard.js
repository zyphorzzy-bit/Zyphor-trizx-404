const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/storage');

function getDashboardData(guild) {
  if (!guild) {
    return {
      success: false,
      message: 'Não foi possível identificar o servidor.'
    };
  }

  const config = getGuildConfig(guild.id);

  const enabledSystems = [
    ['Segurança', config.security?.enabled],
    ['Moderação', config.moderation?.enabled],
    ['Boas-vindas', config.welcome?.enabled],
    ['Tickets', config.tickets?.enabled],
    ['IA', config.ai?.enabled],
    ['Cargos automáticos', config.autorole?.enabled]
  ];

  return {
    success: true,
    server: {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ size: 256 }),
      memberCount: guild.memberCount,
      channelCount: guild.channels.cache.size,
      roleCount: guild.roles.cache.size
    },
    prefix: config.prefix,
    systems: enabledSystems.map(([name, enabled]) => ({
      name,
      enabled: Boolean(enabled)
    })),
    logs: {
      security: Boolean(config.logs?.securityChannelId),
      messages: Boolean(config.logs?.messageChannelId),
      members: Boolean(config.logs?.memberChannelId),
      moderation: Boolean(config.logs?.moderationChannelId)
    }
  };
}

function createDashboardEmbed(guild) {
  const data = getDashboardData(guild);

  if (!data.success) {
    return new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('ZYPhor • Painel')
      .setDescription(data.message);
  }

  const systemsText = data.systems
    .map(system =>
      `${system.enabled ? '🟢' : '⚫'} **${system.name}:** ` +
      `${system.enabled ? 'Ativado' : 'Desativado'}`
    )
    .join('\n');

  const logsText = [
    `Segurança: ${data.logs.security ? 'Configurado' : 'Não configurado'}`,
    `Mensagens: ${data.logs.messages ? 'Configurado' : 'Não configurado'}`,
    `Membros: ${data.logs.members ? 'Configurado' : 'Não configurado'}`,
    `Moderação: ${data.logs.moderation ? 'Configurado' : 'Não configurado'}`
  ].join('\n');

  return new EmbedBuilder()
    .setColor(0x242424)
    .setTitle('ZYPhor • Painel do servidor')
    .setDescription(
      `Visão geral de **${data.server.name}**.\n\n` +
      `**Prefixo atual:** \`${data.prefix}\``
    )
    .setThumbnail(data.server.icon)
    .addFields(
      {
        name: 'Servidor',
        value:
          `Membros: **${data.server.memberCount}**\n` +
          `Canais: **${data.server.channelCount}**\n` +
          `Cargos: **${data.server.roleCount}**`,
        inline: true
      },
      {
        name: 'Registros',
        value: logsText,
        inline: true
      },
      {
        name: 'Sistemas',
        value: systemsText
      }
    )
    .setTimestamp()
    .setFooter({ text: 'Zyphor Bot • Dashboard' });
}

module.exports = {
  getDashboardData,
  createDashboardEmbed
};
