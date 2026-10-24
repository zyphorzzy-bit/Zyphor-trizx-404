const {
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

const { canModerate } = require('../utils/permissions');
const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('./securityLogs');

async function moderateMember(interaction, action, target, reason = 'Não informado') {
  if (!interaction.guild || !interaction.member || !target) {
    return { success: false, message: 'Não foi possível identificar o servidor ou membro.' };
  }

  const guild = interaction.guild;
  const config = getGuildConfig(guild.id);

  if (!canModerate(interaction.member, config)) {
    return { success: false, message: 'Você não tem permissão para moderar membros.' };
  }

  if (target.id === interaction.user.id) {
    return { success: false, message: 'Você não pode aplicar essa ação em si mesmo.' };
  }

  if (target.id === guild.ownerId) {
    return { success: false, message: 'Não é possível moderar o proprietário do servidor.' };
  }

  const botMember = guild.members.me;

  if (!botMember) {
    return { success: false, message: 'Não consegui verificar as permissões do Zyphor Bot.' };
  }

  if (target.roles.highest.position >= botMember.roles.highest.position) {
    return { success: false, message: 'O cargo desse membro é igual ou superior ao cargo mais alto do bot.' };
  }

  if (
    interaction.member.id !== guild.ownerId &&
    target.roles.highest.position >= interaction.member.roles.highest.position
  ) {
    return { success: false, message: 'O cargo desse membro é igual ou superior ao seu.' };
  }

  const actions = {
    warn: {
      permission: null,
      execute: async () => null,
      label: 'Advertência'
    },
    timeout: {
      permission: PermissionFlagsBits.ModerateMembers,
      execute: async () => target.timeout(
        config.moderation.timeoutMinutes * 60 * 1000,
        reason
      ),
      label: 'Timeout'
    },
    kick: {
      permission: PermissionFlagsBits.KickMembers,
      execute: async () => target.kick(reason),
      label: 'Expulsão'
    },
    ban: {
      permission: PermissionFlagsBits.BanMembers,
      execute: async () => target.ban({ reason }),
      label: 'Banimento'
    }
  };

  const selected = actions[action];

  if (!selected) {
    return { success: false, message: 'Ação de moderação desconhecida.' };
  }

  if (selected.permission && !botMember.permissions.has(selected.permission)) {
    return { success: false, message: `O bot não possui a permissão necessária para ${selected.label.toLowerCase()}.` };
  }

  if (action === 'warn') {
    try {
      await target.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle('Advertência • Zyphor Bot')
            .setDescription(`Você recebeu uma advertência no servidor **${guild.name}**.`)
            .addFields({ name: 'Motivo', value: String(reason).slice(0, 1024) })
            .setTimestamp()
        ]
      }).catch(() => null);
    } catch (_) {}
  }

  try {
    if (action !== 'warn') {
      await selected.execute();
    }

    await sendSecurityLog(guild, {
      title: `Moderação • ${selected.label}`,
      description: `Uma ação de moderação foi aplicada.`,
      type: action === 'ban' ? 'danger' : 'warning',
      user: interaction.user,
      target: `${target.user.tag} (${target.id})`,
      reason,
      fields: [
        {
          name: 'Ação',
          value: selected.label,
          inline: true
        }
      ]
    });

    return {
      success: true,
      message: `${selected.label} aplicada a ${target.user.tag}.`
    };
  } catch (error) {
    console.error('[Zyphor Moderation] Erro:', error);

    return {
      success: false,
      message: 'Não foi possível aplicar a punição. Confira as permissões e a hierarquia dos cargos.'
    };
  }
}

module.exports = { moderateMember };
