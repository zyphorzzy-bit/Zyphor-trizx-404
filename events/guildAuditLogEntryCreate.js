
const { Events, AuditLogEvent } = require('discord.js');

const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('../systems/securityLogs');
const logger = require('../utils/logger');

const ACTION_NAMES = {
  [AuditLogEvent.ChannelDelete]: 'Canal excluído',
  [AuditLogEvent.RoleDelete]: 'Cargo excluído',
  [AuditLogEvent.MemberBanAdd]: 'Membro banido',
  [AuditLogEvent.WebhookCreate]: 'Webhook criado',
  [AuditLogEvent.WebhookDelete]: 'Webhook excluído',
  [AuditLogEvent.BotAdd]: 'Bot adicionado'
};

const DESTRUCTIVE_ACTIONS = new Set([
  AuditLogEvent.ChannelDelete,
  AuditLogEvent.RoleDelete,
  AuditLogEvent.MemberBanAdd,
  AuditLogEvent.WebhookDelete
]);

module.exports = {
  name: Events.GuildAuditLogEntryCreate,

  async execute(entry, client) {
    try {
      const guild = entry.guild;
      if (!guild) return;

      const config = getGuildConfig(guild.id);

      if (!config.security?.enabled) return;

      const actionName = ACTION_NAMES[entry.action];
      if (!actionName) return;

      const executor = entry.executor;
      const target = entry.target;

      const targetName =
        target?.name ||
        target?.tag ||
        target?.username ||
        target?.id ||
        'Não identificado';

      await sendSecurityLog(guild, {
        title: `🛡️ ${actionName}`,
        description:
          `Uma ação administrativa foi registrada no servidor **${guild.name}**.`,
        type: DESTRUCTIVE_ACTIONS.has(entry.action)
          ? 'warning'
          : 'info',
        user: executor || null,
        target: targetName,
        fields: [
          {
            name: 'Ação registrada',
            value: actionName,
            inline: true
          },
          {
            name: 'Responsável',
            value: executor
              ? `${executor.tag || executor.username} (${executor.id})`
              : 'Não identificado',
            inline: false
          },
          {
            name: 'ID do registro',
            value: String(entry.id),
            inline: false
          },
          {
            name: 'Proteção',
            value:
              'Ação registrada para auditoria. Nenhuma punição automática foi aplicada.',
            inline: false
          }
        ]
      });

      logger.info('Ação de auditoria registrada', {
        guildId: guild.id,
        action: actionName,
        executorId: entry.executorId || null,
        auditEntryId: entry.id
      });
    } catch (error) {
      logger.error(
        'Erro ao analisar registro de auditoria',
        error.message
      );
    }
  }
};
