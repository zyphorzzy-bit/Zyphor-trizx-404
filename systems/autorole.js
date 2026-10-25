
const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('./securityLogs');
const logger = require('../utils/logger');

async function assignAutoRoles(member) {
  try {
    if (!member?.guild || !member.user || member.user.bot) {
      return { success: false, message: 'Membro inválido.' };
    }

    const config = getGuildConfig(member.guild.id);
    const autorole = config.autorole;

    if (!autorole?.enabled) {
      return { success: false, message: 'Sistema de cargos automáticos desativado.' };
    }

    if (!Array.isArray(autorole.roleIds) || autorole.roleIds.length === 0) {
      return { success: false, message: 'Nenhum cargo automático foi configurado.' };
    }

    const botMember = member.guild.members.me;

    if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return { success: false, message: 'O bot não possui a permissão Gerenciar Cargos.' };
    }

    const assigned = [];
    const skipped = [];

    for (const roleId of autorole.roleIds) {
      const role = await member.guild.roles.fetch(roleId).catch(() => null);

      if (!role || role.id === member.guild.id || role.managed) {
        skipped.push(roleId);
        continue;
      }

      if (role.position >= botMember.roles.highest.position) {
        skipped.push(role.name);
        continue;
      }

      if (member.roles.cache.has(role.id)) continue;

      try {
        await member.roles.add(role, 'Cargo automático configurado pelo Zyphor Bot');
        assigned.push(role.name);
      } catch (error) {
        logger.error(`Não foi possível atribuir o cargo ${role.name}`, error.message);
        skipped.push(role.name);
      }
    }

    if (assigned.length > 0) {
      await sendSecurityLog(member.guild, {
        title: 'Cargos automáticos atribuídos',
        description: `Cargos automáticos foram atribuídos a ${member.user.tag}.`,
        type: 'success',
        target: `${member.user.tag} (${member.id})`,
        fields: [
          {
            name: 'Cargos atribuídos',
            value: assigned.join(', ').slice(0, 1024)
          }
        ]
      });
    }

    return { success: true, assigned, skipped };
  } catch (error) {
    logger.error('Erro ao processar cargos automáticos', error.message);
    return { success: false, message: 'Erro ao processar os cargos automáticos.' };
  }
}

module.exports = { assignAutoRoles };
