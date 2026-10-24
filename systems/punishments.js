const { EmbedBuilder } = require('discord.js');
const { readData, writeData } = require('../utils/storage');
const { sendSecurityLog } = require('./securityLogs');

function getPunishments(guildId, userId) {
  const data = readData();
  const all = data.punishments || {};
  return all[guildId]?.[userId] || [];
}

async function addWarning(guild, moderator, target, reason = 'Não informado') {
  if (!guild || !moderator || !target) {
    return { success: false, message: 'Dados insuficientes para registrar a advertência.' };
  }

  const data = readData();

  if (!data.punishments) data.punishments = {};
  if (!data.punishments[guild.id]) data.punishments[guild.id] = {};
  if (!data.punishments[guild.id][target.id]) {
    data.punishments[guild.id][target.id] = [];
  }

  const warnings = data.punishments[guild.id][target.id];

  const warning = {
    id: `${Date.now()}`,
    type: 'warn',
    moderatorId: moderator.id,
    reason: String(reason).slice(0, 1000),
    createdAt: new Date().toISOString()
  };

  warnings.push(warning);
  writeData(data);

  await target.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle('Advertência • Zyphor Bot')
        .setDescription(`Você recebeu uma advertência em **${guild.name}**.`)
        .addFields({
          name: 'Motivo',
          value: warning.reason
        })
        .setTimestamp()
    ]
  }).catch(() => null);

  await sendSecurityLog(guild, {
    title: 'Advertência registrada',
    description: `Uma advertência foi registrada para ${target.user.tag}.`,
    type: 'warning',
    user: moderator,
    target: `${target.user.tag} (${target.id})`,
    reason: warning.reason,
    fields: [
      {
        name: 'Total de advertências',
        value: String(warnings.length),
        inline: true
      }
    ]
  });

  return {
    success: true,
    count: warnings.length,
    warning
  };
}

async function clearWarnings(guildId, userId) {
  const data = readData();

  if (!data.punishments?.[guildId]?.[userId]) {
    return { success: false, message: 'Esse membro não possui advertências registradas.' };
  }

  delete data.punishments[guildId][userId];
  writeData(data);

  return { success: true, message: 'Advertências removidas do histórico.' };
}

module.exports = {
  getPunishments,
  addWarning,
  clearWarnings
};
