const { PermissionFlagsBits } = require('discord.js');

function isOwner(member) {
  if (!member || !member.guild) return false;

  return member.id === member.guild.ownerId;
}

function hasRole(member, roleIds = []) {
  if (!member || !member.roles || !Array.isArray(roleIds)) {
    return false;
  }

  return roleIds.some(roleId => member.roles.cache.has(roleId));
}

function canAccessConfig(member, config) {
  if (!member || !member.guild || !config) return false;

  // O dono configura o próprio servidor.
  if (isOwner(member)) return true;

  // Administradores do servidor também podem acessar.
  if (
    member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return true;
  }

  // Outros membros precisam de um cargo autorizado.
  const roleIds = config.permissions?.configRoleIds || [];

  return hasRole(member, roleIds);
}

function canModerate(member, config) {
  if (!member || !member.guild || !config) return false;

  if (isOwner(member)) return true;

  if (
    member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return true;
  }

  const roleIds = config.permissions?.moderationRoleIds || [];

  return hasRole(member, roleIds);
}

function canManageSecurity(member, config) {
  if (!member || !member.guild || !config) return false;

  if (isOwner(member)) return true;

  if (
    member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return true;
  }

  const roleIds = config.permissions?.securityRoleIds || [];

  return hasRole(member, roleIds);
}

function canManageTickets(member, config) {
  if (!member || !member.guild || !config) return false;

  if (isOwner(member)) return true;

  if (
    member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return true;
  }

  const roleIds = config.permissions?.supportRoleIds || [];

  return hasRole(member, roleIds);
}

function canAccessSection(member, config, section) {
  if (!member || !member.guild || !config || !section) {
    return false;
  }

  if (isOwner(member)) return true;

  if (
    member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return true;
  }

  const roles = config.permissions?.roles || {};
  const allowedRoleIds = Object.entries(roles)
    .filter(([, sections]) => {
      return Array.isArray(sections) && sections.includes(section);
    })
    .map(([roleId]) => roleId);

  return hasRole(member, allowedRoleIds);
}

module.exports = {
  isOwner,
  hasRole,
  canAccessConfig,
  canModerate,
  canManageSecurity,
  canManageTickets,
  canAccessSection
};
