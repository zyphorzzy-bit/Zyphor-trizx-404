const { EmbedBuilder, MessageFlags } = require('discord.js');
const { canAccessConfig } = require('../utils/permissions');
const { getGuildConfig } = require('../utils/storage');

async function handleButton(interaction) {
  if (!interaction.isButton()) return false;

  const id = interaction.customId;

  if (!id.startsWith('zyphor:')) return false;

  if (!interaction.guild) {
    await interaction.reply({
      content: 'Este botão só pode ser usado dentro de um servidor.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  const config = getGuildConfig(interaction.guild.id);

  if (!canAccessConfig(interaction.member, config)) {
    await interaction.reply({
      content: 'Você não tem permissão para usar este painel.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  if (id === 'zyphor:config:home') {
    const embed = new EmbedBuilder()
      .setColor(0x242424)
      .setTitle('ZYPhor • Painel de configuração')
      .setDescription(
        'Selecione uma categoria no menu abaixo para configurar o bot.'
      )
      .setFooter({ text: 'Zyphor Bot • Sistema de configuração' });

    await interaction.update({ embeds: [embed] });
    return true;
  }

  await interaction.reply({
    content: 'Esta função ainda está sendo configurada.',
    flags: MessageFlags.Ephemeral
  });

  return true;
}

module.exports = { handleButton };
