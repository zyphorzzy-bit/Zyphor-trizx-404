
const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/storage');
const logger = require('../utils/logger');

function formatMessage(template, member) {
  return String(template || '')
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{memberCount}', String(member.guild.memberCount));
}

async function sendWelcome(member) {
  try {
    const config = getGuildConfig(member.guild.id);
    const welcome = config.welcome;

    if (!welcome?.enabled || !welcome.channelId) return;

    const channel = await member.guild.channels
      .fetch(welcome.channelId)
      .catch(() => null);

    if (!channel || !channel.isTextBased() || !channel.send) {
      logger.warn('Canal de boas-vindas não encontrado ou inválido.');
      return;
    }

    const message = formatMessage(
      welcome.message || 'Bem-vindo(a), {user}, ao servidor {server}!',
      member
    );

    const embed = new EmbedBuilder()
      .setColor(0xFFFFFF)
      .setTitle('Bem-vindo(a)!')
      .setDescription(message)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setFooter({ text: `Membro nº ${member.guild.memberCount}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (error) {
    logger.error('Erro ao enviar boas-vindas:', error.message || error);
  }
}

async function sendGoodbye(member) {
  try {
    const config = getGuildConfig(member.guild.id);
    const goodbye = config.goodbye;

    if (!goodbye?.enabled || !goodbye.channelId) return;

    const channel = await member.guild.channels
      .fetch(goodbye.channelId)
      .catch(() => null);

    if (!channel || !channel.isTextBased() || !channel.send) {
      logger.warn('Canal de despedida não encontrado ou inválido.');
      return;
    }

    const message = formatMessage(
      goodbye.message || 'Até logo, {user}! Obrigado por participar de {server}.',
      member
    );

    const embed = new EmbedBuilder()
      .setColor(0x808080)
      .setTitle('Membro saiu')
      .setDescription(message)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (error) {
    logger.error('Erro ao enviar despedida:', error.message || error);
  }
}

module.exports = {
  sendWelcome,
  sendGoodbye
};
