
const { Events } = require('discord.js');

const { getGuildConfig } = require('../utils/storage');
const { rememberMessage } = require('../systems/deletedMessages');
const { sendSecurityLog } = require('../systems/securityLogs');
const { askAI } = require('../systems/ai');
const { canModerate } = require('../utils/permissions');
const { moderateMember } = require('../systems/moderation');
const logger = require('../utils/logger');

const spamTracker = new Map();
const commandCooldowns = new Map();

const MODERATION_COMMANDS = new Set([
  'warn',
  'timeout',
  'kick',
  'ban'
]);

function checkSpam(message, config) {
  const antiSpam = config.security?.antiSpam;

  if (!config.security?.enabled || !antiSpam?.enabled) {
    return false;
  }

  const now = Date.now();
  const key = `${message.guild.id}:${message.author.id}`;
  const interval = Math.max(1, antiSpam.intervalSeconds || 5) * 1000;
  const maxMessages = Math.max(2, antiSpam.maxMessages || 5);

  const recent = (spamTracker.get(key) || [])
    .filter(timestamp => now - timestamp < interval);

  recent.push(now);
  spamTracker.set(key, recent);

  return recent.length > maxMessages;
}

function hasCommandCooldown(message, command, cooldownMs = 3000) {
  const key = `${message.guild.id}:${message.author.id}:${command}`;
  const now = Date.now();
  const lastUsed = commandCooldowns.get(key) || 0;

  if (now - lastUsed < cooldownMs) {
    return true;
  }

  commandCooldowns.set(key, now);
  return false;
}

async function handlePrefixCommand(message, config) {
  const prefix = config.prefix || '!';

  if (!message.content.startsWith(prefix)) return false;

  const content = message.content.slice(prefix.length).trim();
  if (!content) return false;

  const args = content.split(/\s+/);
  const command = args.shift().toLowerCase();

  if (!MODERATION_COMMANDS.has(command)) return false;

  if (hasCommandCooldown(message, command)) {
    await message.reply(
      'Aguarde um pouco antes de usar esse comando novamente.'
    ).catch(() => {});
    return true;
  }

  if (!canModerate(message.member, config)) {
    await message.reply(
      'Você não tem permissão para usar esse comando.'
    ).catch(() => {});
    return true;
  }

  const target = message.mentions.members.first();

  if (!target) {
    await message.reply(
      `Uso: \`${prefix}${command} @membro [motivo]\``
    ).catch(() => {});
    return true;
  }

  const reason = args.slice(1).join(' ') || 'Não informado';

  const result = await moderateMember(
    message,
    command,
    target,
    reason
  );

  await message.reply(
    result.success
      ? `✅ ${result.message}`
      : `❌ ${result.message}`
  ).catch(() => {});

  return true;
}

async function handleSecurity(message, config) {
  if (!config.security?.enabled || message.author.bot) return;

  const antiSpam = config.security.antiSpam;

  if (checkSpam(message, config)) {
    if (['delete', 'delete_warn'].includes(antiSpam.action)) {
      await message.delete().catch(() => {});
    }

    await sendSecurityLog(message.guild, {
      title: 'Possível spam detectado',
      description: `${message.author.tag} enviou mensagens em sequência.`,
      type: 'warning',
      user: message.author,
      channel: message.channel,
      reason: `Ação configurada: ${antiSpam.action || 'alert'}`
    });
  }

  const antiLinks = config.security?.antiLinks;

  if (
    antiLinks?.enabled &&
    /https?:\/\/\S+/i.test(message.content)
  ) {
    const allowedDomains = antiLinks.allowedDomains || [];
    const urls = message.content.match(/https?:\/\/\S+/gi) || [];

    const hasInvite =
      /discord(?:\.gg|\.com\/invite)\/[a-z0-9-]+/i.test(message.content);

    const allAllowed = urls.every(url => {
      try {
        const hostname = new URL(url).hostname.toLowerCase();

        return allowedDomains.some(domain => {
          const normalized = domain.toLowerCase().trim();

          return normalized &&
            (hostname === normalized ||
             hostname.endsWith(`.${normalized}`));
        });
      } catch {
        return false;
      }
    });

    const inviteOnly = urls.every(url =>
      /^(https?:\/\/)?(www\.)?(discord\.gg\/|discord\.com\/invite\/)/i.test(url)
    );

    const linksAllowed =
      allAllowed || (antiLinks.allowInvites && hasInvite && inviteOnly);

    if (!linksAllowed) {
      if (['delete', 'delete_warn'].includes(antiLinks.action)) {
        await message.delete().catch(() => {});
      }

      await sendSecurityLog(message.guild, {
        title: 'Link detectado',
        description: `Um link foi detectado em uma mensagem de ${message.author.tag}.`,
        type: 'warning',
        user: message.author,
        channel: message.channel
      });
    }
  }
}

module.exports = {
  name: Events.MessageCreate,

  async execute(message) {
    try {
      if (!message.guild || message.author.bot) return;

      const config = getGuildConfig(message.guild.id);

      rememberMessage(message);

      await handleSecurity(message, config);

      if (await handlePrefixCommand(message, config)) {
        return;
      }

      if (
        config.ai?.enabled &&
        Array.isArray(config.ai.channelIds) &&
        config.ai.channelIds.includes(message.channel.id)
      ) {
        const result = await askAI({
          guildId: message.guild.id,
          userId: message.author.id,
          channelId: message.channel.id,
          question: message.content
        });

        if (result?.success && result.answer) {
          await message.reply(result.answer).catch(() => {});
        } else if (result?.message) {
          logger.warn('A IA não respondeu', result.message);
        }
      }
    } catch (error) {
      logger.error(
        'Erro no evento MessageCreate',
        error.message || error
      );
    }
  }
};
