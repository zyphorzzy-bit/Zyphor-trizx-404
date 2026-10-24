
const OWNER_ID = '1533306874513068093';

function isOwner(userId) {
  return userId === OWNER_ID;
}

function getConfigRoleIds(guildConfig) {
  return guildConfig?.permissions?.configRoleIds || [];
}

function getAllowedSections(guildConfig, roleIds) {
  const permissions = guildConfig?.permissions?.roles || {};

  const allowed = new Set();

  for (const roleId of roleIds) {
    const sections = permissions[roleId];

    if (Array.isArray(sections)) {
      sections.forEach(section => allowed.add(section));
    }
  }

  return [...allowed];
}

function canAccessConfig(interaction, guildConfig) {
  if (isOwner(interaction.user.id)) return true;

  if (!interaction.guild || !interaction.member) return false;

  const roleIds = getConfigRoleIds(guildConfig);

  const memberRoleIds = interaction.member.roles?.cache
    ? [...interaction.member.roles.cache.keys()]
    : [];

  return roleIds.some(roleId => memberRoleIds.includes(roleId));
}

function canAccessSection(interaction, guildConfig, section) {
  if (isOwner(interaction.user.id)) return true;

  if (!canAccessConfig(interaction, guildConfig)) return false;

  const memberRoleIds = interaction.member.roles?.cache
    ? [...interaction.member.roles.cache.keys()]
    : [];

  const allowed = getAllowedSections(guildConfig, memberRoleIds);

  return allowed.includes('*') || allowed.includes(section);
}

module.exports = {
  OWNER_ID,
  isOwner,
  canAccessConfig,
  canAccessSection,
  getAllowedSections
};
