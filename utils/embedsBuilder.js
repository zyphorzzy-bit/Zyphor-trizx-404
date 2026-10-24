const {
  EmbedBuilder,
  Colors
} = require('discord.js');

const COLORS = {
  dark: 0x242424,
  white: 0xFFFFFF,
  success: 0x57F287,
  warning: 0xFEE75C,
  danger: 0xED4245,
  info: 0x5865F2
};

function createBaseEmbed({
  title = 'ZYPhor',
  description = '',
  color = COLORS.dark,
  footer = 'Zyphor Bot'
} = {}) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTimestamp();

  if (title) {
    embed.setTitle(String(title).slice(0, 256));
  }

  if (description) {
    embed.setDescription(String(description).slice(0, 4000));
  }

  if (footer) {
    embed.setFooter({
      text: String(footer).slice(0, 2048)
    });
  }

  return embed;
}

function successEmbed(title, description) {
  return createBaseEmbed({
    title: `✓ ${title}`,
    description,
    color: COLORS.success
  });
}

function warningEmbed(title, description) {
  return createBaseEmbed({
    title: `! ${title}`,
    description,
    color: COLORS.warning
  });
}

function errorEmbed(title, description) {
  return createBaseEmbed({
    title: `× ${title}`,
    description,
    color: COLORS.danger
  });
}

function infoEmbed(title, description) {
  return createBaseEmbed({
    title,
    description,
    color: COLORS.info
  });
}

function addSafeFields(embed, fields = []) {
  if (!Array.isArray(fields)) return embed;

  const safeFields = fields
    .filter(field => field?.name && field?.value !== undefined)
    .slice(0, 25)
    .map(field => ({
      name: String(field.name).slice(0, 256),
      value: String(field.value).slice(0, 1024) || '\u200B',
      inline: Boolean(field.inline)
    }));

  if (safeFields.length) {
    embed.addFields(safeFields);
  }

  return embed;
}

module.exports = {
  COLORS,
  createBaseEmbed,
  successEmbed,
  warningEmbed,
  errorEmbed,
  infoEmbed,
  addSafeFields
};
