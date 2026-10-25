
const { Events } = require('discord.js');

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

  if (hasCommandCooldown(message, command)) {
    await message.reply('Aguarde um pouco antes de usar esse comando novamente.')
      .catch(() => {});
    return true;
  }

  if (command === 'saldo') {
    const 
