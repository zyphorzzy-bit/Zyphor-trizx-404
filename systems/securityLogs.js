const {
  EmbedBuilder,
  AuditLogEvent
} = require('discord.js');

const { getGuildConfig } = require('../utils/storage');

const COLORS = {
  info: 0x5865F2,
  success: 0x57F287,
  warning: 0xFEE75C,
  danger: 0xED4245
};

async function sendSecurityLog(guild, {
  title = 'Alerta de segurança',
  description = 'Um evento de segurança foi registrado.',
  type = 'warning',
  user = null,
  target = null,
  channel = null,
  reason = null,
  fields = []
} = {}) {
  if (!guild) return false;

  const config = getGuildConfig(guild.id);
  const channelId = config.logs?.securityChannelId;

  if (!channelId) return false;

  const logChannel = await guild.channels
    .fetch(channelId)
    .catch(() => null);

  if (!logChannel || !logChannel.isTextBased()) {
    return false;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS[type] || COLORS.warning)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter({
      text: `Zyphor Security • ${guild.name}`
    });

  if (user) {
    embed.addFields({
      name: 'Usuário responsável',
      value: `${user.tag || user.username || user.id}`,
      inline: true
    });
  }

  if (target) {
    embed.addFields({
      name: 'Alvo',
      value: String(target).slice(0, 1024),
      inline: true
    });
  }

  if (channel) {
    embed.addFields({
      name: 'Canal',
      value: `${channel}`,
      inline: true
    });
  }

  if (reason) {
    embed.addFields({
      name: 'Motivo',
      value: String(reason).slice(0, 1024),
      inline: false
    });
  }

  for (const field of fields) {
    if (!field?.name || field.value === undefined) continue;

    embed.addFields({
      name: String(field.name).slice(0, 256),
      value: String(field.value).slice(0, 1024),
      inline: Boolean(field.inline)
    });
  }

  try {
    await logChannel.send({ embeds: [embed] });
    return true;
  } catch (error) {
    console.error(
      '[Zyphor Security] Não foi possível enviar o log:',
      error.message
    );

    return false;
  }
}

async function logSecurityEvent(guild, event) {
  return sendSecurityLog(guild, event);
}

module.exports = {
  sendSecurityLog,
  logSecurityEvent,
  AuditLogEvent
};
