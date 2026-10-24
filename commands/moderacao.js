
const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const { isOwner } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moderacao')
    .setDescription('Comandos de moderação do Zyphor Bot')
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Banir um membro')
        .addUserOption(opt =>
          opt.setName('membro')
            .setDescription('Membro que será banido')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('motivo')
            .setDescription('Motivo do banimento')
            .setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Expulsar um membro')
        .addUserOption(opt =>
          opt.setName('membro')
            .setDescription('Membro que será expulso')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('motivo')
            .setDescription('Motivo da expulsão')
            .setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('timeout')
        .setDescription('Aplicar timeout em um membro')
        .addUserOption(opt =>
          opt.setName('membro')
            .setDescription('Membro que receberá timeout')
            .setRequired(true))
        .addIntegerOption(opt =>
          opt.setName('minutos')
            .setDescription('Duração em minutos (1 a 40320)')
            .setMinValue(1)
            .setMaxValue(40320)
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('motivo')
            .setDescription('Motivo do timeout')
            .setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('warn')
        .setDescription('Advertir um membro')
        .addUserOption(opt =>
          opt.setName('membro')
            .setDescription('Membro que receberá o aviso')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('motivo')
            .setDescription('Motivo do aviso')
            .setRequired(true))),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Use este comando dentro de um servidor.',
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('membro');
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo informado.';
    const moderator = interaction.member;
    const botMember = interaction.guild.members.me;

    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: 'Você não pode aplicar esta ação em si mesmo.',
        ephemeral: true
      });
    }

    if (target.id === interaction.client.user.id) {
      return interaction.reply({
        content: 'Não posso aplicar esta ação em mim mesmo.',
        ephemeral: true
      });
    }

    // O dono do bot não ignora a hierarquia de cargos do Discord.
    const owner = isOwner(interaction.user.id);
    const requiredPermission = {
      ban: PermissionFlagsBits.BanMembers,
      kick: PermissionFlagsBits.KickMembers,
      timeout: PermissionFlagsBits.ModerateMembers,
      warn: null
    }[subcommand];

    if (!owner && requiredPermission &&
        !interaction.memberPermissions?.has(requiredPermission)) {
      return interaction.reply({
        content: 'Você não tem a permissão necessária para esta ação.',
        ephemeral: true
      });
    }

    if (!owner && subcommand === 'warn' &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        content: 'Você precisa da permissão de moderar membros para advertir.',
        ephemeral: true
      });
    }

    const targetMember = await interaction.guild.members
      .fetch(target.id).catch(() => null);

    if (subcommand !== 'ban' && !targetMember) {
      return interaction.reply({
        content: 'Esse membro não está mais no servidor.',
        ephemeral: true
      });
    }

    if (targetMember && targetMember.id === interaction.guild.ownerId) {
      return interaction.reply({
        content: 'Não é possível aplicar esta ação ao dono do servidor.',
        ephemeral: true
      });
    }

    if (targetMember && !owner &&
        moderator.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
      return interaction.reply({
        content: 'Seu cargo precisa estar acima do cargo do membro.',
        ephemeral: true
      });
    }

    if (targetMember && botMember &&
        !botMember.permissions.has(requiredPermission || PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        content: 'O Zyphor Bot não tem a permissão necessária.',
        ephemeral: true
      });
    }

    if (targetMember && botMember &&
        botMember.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
      return interaction.reply({
        content: 'Meu cargo precisa estar acima do cargo do membro.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      if (subcommand === 'ban') {
        await target.send(
          `Você foi banido do servidor **${interaction.guild.name}**.\nMotivo: ${reason}`
        ).catch(() => null);

        await interaction.guild.members.ban(target.id, {
          reason: `${reason} | Moderador: ${interaction.user.tag}`
        });

      } else if (subcommand === 'kick') {
        await target.send(
          `Você foi expulso do servidor **${interaction.guild.name}**.\nMotivo: ${reason}`
        ).catch(() => null);

        await targetMember.kick(`${reason} | Moderador: ${interaction.user.tag}`);

      } else if (subcommand === 'timeout') {
        const minutes = interaction.options.getInteger('minutos');

        await target.send(
          `Você recebeu timeout no servidor **${interaction.guild.name}** por ${minutes} minuto(s).\nMotivo: ${reason}`
        ).catch(() => null);

        await targetMember.timeout(
          minutes * 60 * 1000,
          `${reason} | Moderador: ${interaction.user.tag}`
        );

      } else if (subcommand === 'warn') {
        await target.send(
          `Você recebeu uma advertência no servidor **${interaction.guild.name}**.\nMotivo: ${reason}\nModerador: ${interaction.user.tag}`
        ).catch(() => null);
      }

      await interaction.editReply(
        `Ação \`${subcommand}\` concluída para **${target.tag}**.\nMotivo: ${reason}`
      );

    } catch (error) {
      console.error('Erro na moderação:', error);

      await interaction.editReply(
        'Não foi possível concluir a ação. Verifique as permissões e a hierarquia dos cargos.'
      );
    }
  }
};
