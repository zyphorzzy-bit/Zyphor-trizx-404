const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

const { getGuildConfig, readData, writeData } = require('../utils/storage');
const { canManageTickets } = require('../utils/permissions');
const { sendSecurityLog } = require('./securityLogs');

function getOpenTickets(guildId, userId) {
  const data = readData();
  const tickets = data.tickets || {};

  return Object.values(tickets).filter(ticket =>
    ticket.guildId === guildId &&
    ticket.userId === userId &&
    ticket.status === 'open'
  );
}

async function createTicket(guild, user, subject = 'Suporte') {
  const config = getGuildConfig(guild.id);
  const ticketConfig = config.tickets;

  if (!ticketConfig?.enabled) {
    return { success: false, message: 'O sistema de tickets está desativado.' };
  }

  const limit = Math.max(1, Number(ticketConfig.maxOpenPerUser) || 2);
  const openTickets = getOpenTickets(guild.id, user.id);

  if (openTickets.length >= limit) {
    return {
      success: false,
      message: `Você já atingiu o limite de ${limit} tickets abertos.`
    };
  }

  const botMember = guild.members.me;

  if (!botMember?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return {
      success: false,
      message: 'O bot precisa da permissão Gerenciar Canais.'
    };
  }

  const safeName = `ticket-${user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 80);

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    },
    {
      id: botMember.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels
      ]
    }
  ];

  for (const roleId of ticketConfig.supportRoleIds || []) {
    const role = await guild.roles.fetch(roleId).catch(() => null);

    if (role) {
      permissionOverwrites.push({
        id: role.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      });
    }
  }

  let parent = null;

  if (ticketConfig.categoryId) {
    const category = await guild.channels
      .fetch(ticketConfig.categoryId)
      .catch(() => null);

    if (category?.type === ChannelType.GuildCategory) {
      parent = category.id;
    }
  }

  try {
    const channel = await guild.channels.create({
      name: safeName || 'ticket-suporte',
      type: ChannelType.GuildText,
      parent,
      permissionOverwrites,
      reason: `Ticket aberto por ${user.tag || user.id}`
    });

    const data = readData();

    if (!data.tickets) data.tickets = {};

    data.tickets[channel.id] = {
      channelId: channel.id,
      guildId: guild.id,
      userId: user.id,
      subject: String(subject).slice(0, 100),
      status: 'open',
      claimedBy: null,
      createdAt: new Date().toISOString()
    };

    writeData(data);

    const embed = new EmbedBuilder()
      .setColor(0x242424)
      .setTitle('ZYPhor • Central de suporte')
      .setDescription(
        `Olá, <@${user.id}>! Seu ticket foi criado.\n\n` +
        `**Assunto:** ${String(subject).slice(0, 100)}\n` +
        'Explique o que aconteceu para a equipe de suporte poder ajudar.'
      )
      .setTimestamp()
      .setFooter({ text: 'Zyphor Bot • Tickets' });

    await channel.send({
      content: `<@${user.id}>`,
      embeds: [embed],
      allowedMentions: { users: [user.id] }
    });

    await sendSecurityLog(guild, {
      title: 'Ticket criado',
      description: `Um novo ticket foi criado em ${channel}.`,
      type: 'info',
      user,
      target: channel.name
    });

    return {
      success: true,
      channel,
      message: `Seu ticket foi criado: ${channel}`
    };
  } catch (error) {
    console.error('[Zyphor Tickets] Erro ao criar ticket:', error);

    return {
      success: false,
      message: 'Não foi possível criar o ticket. Verifique as permissões do bot.'
    };
  }
}

async function closeTicket(interaction) {
  const guild = interaction.guild;

  if (!guild || !interaction.channel) {
    return { success: false, message: 'Este comando só funciona em um servidor.' };
  }

  const data = readData();
  const ticket = data.tickets?.[interaction.channel.id];

  if (!ticket || ticket.status !== 'open') {
    return { success: false, message: 'Este canal não é um ticket aberto.' };
  }

  const config = getGuildConfig(guild.id);
  const isTicketOwner = ticket.userId === interaction.user.id;
  const isSupport = canManageTickets(interaction.member, config);

  if (!isTicketOwner && !isSupport) {
    return { success: false, message: 'Você não tem permissão para fechar este ticket.' };
  }

  ticket.status = 'closed';
  ticket.closedAt = new Date().toISOString();
  ticket.closedBy = interaction.user.id;

  writeData(data);

  await sendSecurityLog(guild, {
    title: 'Ticket fechado',
    description: `O ticket ${interaction.channel.name} foi fechado.`,
    type: 'info',
    user: interaction.user,
    target: interaction.channel.name
  });

  return {
    success: true,
    message: 'Ticket marcado como fechado. O canal ainda não foi bloqueado ou arquivado.'
  };
}

module.exports = {
  createTicket,
  closeTicket,
  getOpenTickets
};
