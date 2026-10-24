const { EmbedBuilder, MessageFlags } = require('discord.js');
const { canAccessConfig } = require('../utils/permissions');
const { getGuildConfig, updateGuildConfig } = require('../utils/storage');

async function handleModal(interaction) {
  if (!interaction.isModalSubmit()) return false;

  const id = interaction.customId;

  if (!id.startsWith('zyphor:')) return false;

  if (!interaction.guild) {
    await interaction.reply({
      content: 'Este formulário só pode ser usado dentro de um servidor.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  const guildId = interaction.guild.id;
  const config = getGuildConfig(guildId);

  if (!canAccessConfig(interaction.member, config)) {
    await interaction.reply({
      content: 'Você não tem permissão para alterar esta configuração.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  if (id === 'zyphor:config:prefix') {
    const prefix = interaction.fields
      .getTextInputValue('prefix')
      .trim();

    const allowedPrefixes = ['!', '.', '?', '+', '×'];

    if (!allowedPrefixes.includes(prefix)) {
      await interaction.reply({
        content: 'Prefixo inválido. Escolha: ! . ? + ou ×',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }

    updateGuildConfig(guildId, { prefix });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x242424)
          .setTitle('Prefixo atualizado')
          .setDescription(`O prefixo agora é \`${prefix}\`.`)
          .setFooter({ text: 'Zyphor Bot • Configuração' })
      ],
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  await interaction.reply({
    content: 'Este formulário ainda não está configurado.',
    flags: MessageFlags.Ephemeral
  });

  return true;
}

module.exports = { handleModal };
