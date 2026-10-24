const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/storage');

function formatMessage(template, member) {
  return String(template || '')
    .replaceAll('{user}', `${member.user}`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{count}', String(member.guild.memberCount));
}

async function sendWelcome(member) {
  try {
    const config = getGuildConfig(member.guild.id);
    const welcome = config.welcome;

    if (!welcome?.enabled || !welcome.channelId) return false;

    const channel = await member.guild.channels
      .fetch(welcome.channelId)
      .catch(() => null);

    if (!channel?.isTextBased() || !channel.send) return false;

    const message = formatMessage(
      welcome.message || 'Bem-vindo(a), {user}, ao servidor {server}!',
      member
    );

    const embed = new EmbedBuilder()
      .setColor(0x242424)
      .setTitle('Bem-vindo(a)!')
      .setDescription(message)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields({
        name: 'Membro nº',
        value: String(member.guild.memberCount),
        inline: true
      })
      .setTimestamp()
      .setFooter({ text: 'Zyphor Bot • Boas-vindas' });

    await channel.send({
      embeds: [embed],
      allowedMentions: {
        users: [member.id]
      }
    });

    return true;
  } catch (error) {
    console.error('[Zyphor Welcome] Erro ao enviar boas-vindas:', error);
    return false;
  }
}

async function sendGoodbye(member) {
  try {
    const config = getGuildConfig(member.guild.id);
    const goodbye = config.goodbye;

    if (!goodbye?.enabled || !goodbye.channelId) return false;

    const channel = await member.guild.channels
      .fetch(goodbye.channelId)
      .catch(() => null);

    if (!channel?.isTextBased() || !channel.send) return false;

    const message = formatMessage(
      goodbye.message || 'Até mais, {username}! Você saiu de {server}.',
      member
    );

    const embed = new EmbedBuilder()
      .setColor(0x424242)
      .setTitle('Até mais!')
      .setDescription(message)
      .setTimestamp()
      .setFooter({ text: 'Zyphor Bot • Saída de membros' });

    await channel.send({ embeds: [embed] });
    return true;
  } catch (error) {
    console.error('[Zyphor Welcome] Erro ao enviar despedida:', error);
    return false;
  }
}

module.exports = {
  sendWelcome,
  sendGoodbye,
  formatMessage
};
