const { EmbedBuilder } = require('discord.js');
const { readData, writeData } = require('../utils/storage');
const { sendSecurityLog } = require('./securityLogs');

function getPartnerships(guildId, limit = 10) {
  const data = readData();
  const entries = data.partnerships || {};
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));

  return (entries[guildId] || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, safeLimit);
}

async function createPartnership(guild, user, options = {}) {
  if (!guild || !user) {
    return {
      success: false,
      message: 'Não foi possível identificar o servidor ou usuário.'
    };
  }

  const channelId = options.channelId;
  const partnerName = String(options.partnerName || '').trim();
  const description = String(options.description || '').trim();
  const inviteUrl = String(options.inviteUrl || '').trim();

  if (!channelId || !partnerName || !description || !inviteUrl) {
    return {
      success: false,
      message: 'Preencha o canal, o nome do parceiro, a descrição e o convite.'
    };
  }

  let parsedInvite;

  try {
    parsedInvite = new URL(inviteUrl);
  } catch (_) {
    return { success: false, message: 'O link do convite é inválido.' };
  }

  if (
    parsedInvite.protocol !== 'https:' ||
    !['discord.gg', 'www.discord.gg', 'discord.com', 'www.discord.com'].includes(parsedInvite.hostname)
  ) {
    return {
      success: false,
      message: 'Use um convite HTTPS válido do Discord.'
    };
  }

  const channel = await guild.channels.fetch(channelId).catch(() => null);

  if (!channel?.isTextBased() || !channel.send) {
    return {
      success: false,
      message: 'O canal selecionado não é um canal de texto válido.'
    };
  }

  const embed = new EmbedBuilder()
    .setColor(0x242424)
    .setTitle(`🤝 Parceria • ${partnerName.slice(0, 200)}`)
    .setDescription(description.slice(0, 4000))
    .addFields({
      name: 'Convite',
      value: inviteUrl
    })
    .setFooter({ text: `Publicado por ${user.tag || user.username}` })
    .setTimestamp();

  try {
    const sentMessage = await channel.send({ embeds: [embed] });

    const data = readData();

    if (!data.partnerships) data.partnerships = {};
    if (!data.partnerships[guild.id]) data.partnerships[guild.id] = [];

    const record = {
      id: sentMessage.id,
      guildId: guild.id,
      channelId: channel.id,
      messageId: sentMessage.id,
      partnerName: partnerName.slice(0, 200),
      description: description.slice(0, 4000),
      inviteUrl,
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };

    data.partnerships[guild.id].push(record);
    writeData(data);

    await sendSecurityLog(guild, {
      title: 'Parceria publicada',
      description: `Uma parceria com **${record.partnerName}** foi publicada em ${channel}.`,
      type: 'success',
      user,
      target: record.partnerName
    });

    return {
      success: true,
      partnership: record,
      message: 'Parceria publicada com sucesso.'
    };
  } catch (error) {
    console.error('[Zyphor Partnerships] Erro:', error);

    return {
      success: false,
      message: 'Não foi possível publicar a parceria. Confira as permissões do bot.'
    };
  }
}

module.exports = {
  getPartnerships,
  createPartnership
};
