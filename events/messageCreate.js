
const { Events, PermissionFlagsBits } = require('discord.js');

const { getGuildConfig } = require('../utils/storage');
const { rememberMessage } = require('../systems/deletedMessages');
const { sendSecurityLog } = require('../systems/securityLogs');
const { askAI } = require('../systems/ai');
const { getBalance, claimDaily, work } = require('../systems/economy');
const { canModerate } = require('../utils/permissions');
const { moderateMember } = require('../systems/moderation');
const logger = require('../utils/logger');

const spamTracker = new Map();
const commandCooldowns = new Map();

const PREFIX_COMMANDS = new Set([
  'saldo',
  'daily',
  'trabalhar',
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

  if (now - lastUsed < cooldownMs) return true;

  commandCooldowns.set(key, now);
  return false;
}

async function handlePrefixCommand(message, config, client) {
  const prefix = config.prefix || '!';
  if (!message.content.startsWith(prefix)) return false;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = (args.shift() || '').toLowerCase();

  if (!PREFIX_COMMANDS.has(command)) return false;
  if (hasCommandCooldown(message, command)) return true;

  if (command === 'saldo') {
    const balance = getBalance(message.guild.id, message.author.id);
    await message.reply(`💰 Seu saldo é de **${balance} moedas**.`);
    return true;
  }

  if (command === 'daily') {
    const result = claimDaily(message.guild.id, message.author.id);

    await message.reply(
      result.success
        ? `🎁 Você recebeu **${result.amount} moedas** hoje!`
        : `Você já resgatou sua recompensa diária. Tente novamente em ${result.remaining || '24 horas'}.`
    );
    return true;
  }

  if (command === 'trabalhar') {
    const result = work(message.guild.id, message.author.id);

    await message.reply(
      result.success
        ? `🛠️ Você ganhou **${result.amount} moedas** trabalhando!`
        : 'Você já trabalhou recentemente. Tente novamente mais tarde.'
    );
    return true;
  }

  if (!canModerate(message.member, config)) {
    await message.reply('Você não tem permissão para usar esse comando.').catch(() => {});
    return true;
  }

  const target = message.mentions.members.first();

  if (!target) {
    await message.reply(`Uso: \`${prefix}${command} @membro [motivo]\``);
    return true;
  }

  const reason = args.slice(1).join(' ') || 'Não informado';

  const actions = {
    warn: 'warn',
    timeout: 'timeout',
    kick: 'kick',
    ban: 'ban'
  };

  const action = actions[command];

  if (action) {
    await moderateMember(message, action, target, reason);
  }

  return true;
}

async function handleSecurity(message, config, client) {
  if (!config.security?.enabled || message.author.bot) return;

  if (checkSpam(message, config)) {
    const antiSpam = config.security.antiSpam;

    if (antiSpam.action === 'delete' || antiSpam.action === 'delete_warn') {
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

  const antiLinks = config.security.antiLinks;

  if (antiLinks?.enabled && /https?:\/\/\S+/i.test(message.content)) {
    const allowedDomains = antiLinks.allowedDomains || [];
    const urls = message.content.match(/https?:\/\/\S+/gi) || [];

    const containsAllowedDomain = urls.every(url => {
      try {
        const hostname = new URL(url).hostname.toLowerCase();
        return allowedDomains.some(domain =>
          hostname === domain.toLowerCase() ||
          hostname.endsWith(`.${domain.toLowerCase()}`)
        );
      } catch {
        return false;
      }
    });

    const hasInvite = /discord(?:\.gg|\.com\/invite)\/[a-z0-9-]+/i.test(message.content);

    if (
      !containsAllowedDomain &&
      !(antiLinks.allowInvites && hasInvite)
    ) {
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

  async execute(message, client) {
    try {
      if (!message.guild || message.author.bot) return;

      const config = getGuildConfig(message.guild.id);

      rememberMessage(message);

      await handleSecurity(message, config, client);

      // Os comandos por prefixo são opcionais.
      if (await handlePrefixCommand(message, config, client)) return;

      // A IA só responde se estiver ativada e configurada para este canal.
      if (
        config.ai?.enabled &&
        Array.isArray(config.ai.channelIds) &&
        config.ai.channelIds.includes(message.channel.id)
      ) {
        const answer = await askAI({
          guildId: message.guild.id,
          userId: message.author.id,
          channelId: message.channel.id,
          question: message.content
        });

        if (answer) {
          await message.reply(answer).catch(() => {});
        }
      }
    } catch (error) {
      logger.error('Erro no evento MessageCreate', error.message);
    }
  }
};
