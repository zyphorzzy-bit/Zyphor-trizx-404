
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { canModerate } = require('../utils/permissions');
const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('./securityLogs');

async function moderateMember(source, action, target, reason = 'Não informado') {
  const isInteraction = typeof source?.isChatInputCommand === 'function';
  const guild = source?.guild;
  const executor = isInteraction ? source.user : source?.author;
  const executorMember = isInteraction ? source.member : source?.member;

  if (!guild || !executor || !executorMember || !target) {
    return { success: false, message: 'Não foi possível identificar o servidor ou membro.' };
  }

  const config = getGuildConfig(guild.id);

  if (!canModerate(executorMember, config)) {
    return { success: false, message: 'Você não tem permissão para moderar membros.' };
  }

  if (target.id === executor.id) {
    return { success: false, message: 'Você não pode aplicar essa ação em si mesmo.' };
  }

  if (target.id === guild.ownerId) {
    return { success: false, message: 'Não é possível moderar o proprietário do servidor.' };
  }

  const botMember = guild.members.me;

  if (!botMember) {
    return { success: false, message: 'Não consegui verificar as permissões do bot.' };
  }

  if (target.roles.highest.position >= botMember.roles.highest.position) {
    return { success: false, message: 'O cargo do membro é igual ou superior ao cargo mais alto do bot.' };
  }

  if (
    executor.id !== guild.ownerId &&
    target.roles.highest.position >= executorMember.roles.highest.position
  ) {
    return { success: false, message: 'O cargo desse membro é igual ou superior ao seu.' };
  }

  const actions = {
    warn: {
      label: 'Advertência',
      permission: null,
      execute: async () => {
        const embed = new EmbedBuilder()
          .setColor(0xFEE75C)
          .setTitle('Advertência • Zyphor Bot')
          .setDescription(`Você recebeu uma advertência no servidor **${guild.name}**.`)
          .addFields({ name: 'Motivo', value: String(reason).slice(0, 1024) })
          .setTimestamp();

        await target.send({ embeds: [embed] }).catch(() => {});
      }
    },

    timeout: {
      label: 'Timeout',
      permission: PermissionFlagsBits.ModerateMembers,
      execute: async () => {
        const minutes = Math.max(1, Number(config.moderation?.timeoutMinutes) || 10);
        await target.timeout(minutes * 60 * 1000, reason);
      }
    },

    kick: {
      label: 'Expulsão',
      permission: PermissionFlagsBits.KickMembers,
      execute: async () => target.kick(reason)
    },

    ban: {
      label: 'Banimento',
      permission: PermissionFlagsBits.BanMembers,
      execute: async () => target.ban({ reason })
    }
  };

  const selected = actions[action];

  if (!selected) {
    return { success: false, message: 'Ação de moderação desconhecida.' };
  }

  if (selected.permission && !botMember.permissions.has(selected.permission)) {
    return {
      success: false,
      message: `O bot não possui a permissão necessária para ${selected.label.toLowerCase()}.`
    };
  }

  try {
    await selected.execute();

    await sendSecurityLog(guild, {
      title: `Moderação • ${selected.label}`,
      description: 'Uma ação de moderação foi aplicada.',
      type: action === 'ban' ? 'danger' : 'warning',
      user: executor,
      target: `${target.user.tag} (${target.id})`,
      reason,
      fields: [{ name: 'Ação', value: selected.label, inline: true }]
    });

    return {
      success: true,
      message: `${selected.label} aplicada a ${target.user.tag}.`
    };
  } catch (error) {
    console.error('[Zyphor Moderation] Erro:', error);

    return {
      success: false,
      message: 'Não foi possível aplicar a ação. Confira as permissões e a hierarquia dos cargos.'
    };
  }
}

module.exports = { moderateMember };
