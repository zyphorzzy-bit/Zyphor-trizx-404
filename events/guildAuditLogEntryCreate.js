const { Events, AuditLogEvent } = require('discord.js');

const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('../systems/securityLogs');

module.exports = {
  name: Events.GuildAuditLogEntryCreate,

  async execute(entry, guild) {
    try {
      const config = getGuildConfig(guild.id);
      const security = config.security;

      if (!security?.enabled) return;

      const destructiveActions = [
        AuditLogEvent.ChannelDelete,
        AuditLogEvent.RoleDelete,
        AuditLogEvent.MemberBanAdd,
        AuditLogEvent.WebhookCreate,
        AuditLogEvent.WebhookDelete,
        AuditLogEvent.BotAdd
      ];

      if (!destructiveActions.includes(entry.action)) return;

      const executorId = entry.executorId;
      const executor = entry.executor;
      const target = entry.target;

      const actionNames = {
        [AuditLogEvent.ChannelDelete]: 'Canal excluído',
        [AuditLogEvent.RoleDelete]: 'Cargo excluído',
        [AuditLogEvent.MemberBanAdd]: 'Membro banido',
        [AuditLogEvent.WebhookCreate]: 'Webhook criado',
        [AuditLogEvent.WebhookDelete]: 'Webhook excluído',
        [AuditLogEvent.BotAdd]: 'Bot adicionado'
      };

      const actionName =
        actionNames[entry.action] || 'Ação administrativa';

      const isDestructive =
        entry.action === AuditLogEvent.ChannelDelete ||
        entry.action === AuditLogEvent.RoleDelete ||
        entry.action === AuditLogEvent.MemberBanAdd ||
        entry.action === AuditLogEvent.WebhookDelete;

      await sendSecurityLog(guild, {
        title: `🛡️ ${actionName}`,
        description:
          `Uma ação administrativa foi registrada no servidor **${guild.name}**.`,
        type: isDestructive ? 'warning' : 'info',
        user: executor || null,
        target: target?.name || target?.tag || target?.id || 'Não identificado',
        fields: [
          {
            name: 'Ação registrada',
            value: actionName,
            inline: true
          },
          {
            name: 'Identificação do registro',
            value: String(entry.id),
            inline: true
          }
        ]
      });

      // A detecção de eventos não aplica punições automaticamente.
      // Isso evita punir administradores por ações legítimas.
      void executorId;
    } catch (error) {
      console.error(
        '[Zyphor Security] Erro ao analisar registro de auditoria:',
        error
      );
    }
  }
};
