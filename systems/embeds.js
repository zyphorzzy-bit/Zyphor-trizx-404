const { EmbedBuilder } = require('discord.js');

const DEFAULT_COLOR = 0x242424;

function limitText(value, maxLength) {
  return String(value ?? '').slice(0, maxLength);
}

function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color ?? DEFAULT_COLOR)
    .setTimestamp();

  if (options.title) {
    embed.setTitle(limitText(options.title, 256));
  }

  if (options.description) {
    embed.setDescription(limitText(options.description, 4000));
  }

  if (options.url) {
    try {
      const parsed = new URL(options.url);

      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        embed.setURL(parsed.toString());
      }
    } catch (_) {}
  }

  if (options.thumbnail) {
    try {
      const url = new URL(options.thumbnail);

      if (url.protocol === 'https:' || url.protocol === 'http:') {
        embed.setThumbnail(url.toString());
      }
    } catch (_) {}
  }

  if (options.image) {
    try {
      const url = new URL(options.image);

      if (url.protocol === 'https:' || url.protocol === 'http:') {
        embed.setImage(url.toString());
      }
    } catch (_) {}
  }

  if (options.author?.name) {
    const author = {
      name: limitText(options.author.name, 256)
    };

    if (options.author.iconURL) {
      author.iconURL = options.author.iconURL;
    }

    embed.setAuthor(author);
  }

  if (options.footer?.text) {
    const footer = {
      text: limitText(options.footer.text, 2048)
    };

    if (options.footer.iconURL) {
      footer.iconURL = options.footer.iconURL;
    }

    embed.setFooter(footer);
  }

  if (Array.isArray(options.fields)) {
    const fields = options.fields
      .filter(field => field?.name && field?.value !== undefined)
      .slice(0, 25)
      .map(field => ({
        name: limitText(field.name, 256) || '\u200B',
        value: limitText(field.value, 1024) || '\u200B',
        inline: Boolean(field.inline)
      }));

    if (fields.length) {
      embed.addFields(fields);
    }
  }

  return embed;
}

function validateEmbed(options = {}) {
  const errors = [];

  if (options.title && String(options.title).length > 256) {
    errors.push('O título deve ter no máximo 256 caracteres.');
  }

  if (options.description && String(options.description).length > 4000) {
    errors.push('A descrição deve ter no máximo 4.000 caracteres.');
  }

  if (Array.isArray(options.fields) && options.fields.length > 25) {
    errors.push('Uma mensagem pode ter no máximo 25 campos.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  createEmbed,
  validateEmbed,
  DEFAULT_COLOR
};
