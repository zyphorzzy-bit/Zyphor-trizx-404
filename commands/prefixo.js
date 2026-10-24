
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

const { getGuildConfig, updateGuildConfig } = require('../utils/storage');
const { isOwner, canAccessConfig } = require('../utils/permissions');

const PREFIXOS = ['!', '.', '?', '+', '×'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prefixo')
    .setDescription('Configura o prefixo dos comandos do Zyphor Bot'),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Use este comando dentro de um servidor.',
        ephemeral: true
      });
    }

    const config = getGuildConfig(interaction.guild.id);

    if (!canAccessConfig(interaction, config)) {
      return interaction.reply({
        content: 'Você não tem permissão para alterar o prefixo.',
        ephemeral: true
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('zyphor:prefix:choose')
      .setPlaceholder(`Prefixo atual: ${config.prefix || '!'}`)
      .addOptions(
        PREFIXOS.map(prefixo => ({
          label: `Prefixo ${prefixo}`,
          description: `Usar ${prefixo} antes dos comandos`,
          value: prefixo
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    return interaction.reply({
      content: `Prefixo atual: \`${config.prefix || '!'}\`\nEscolha o novo prefixo abaixo.`,
      components: [row],
      ephemeral: true
    });
  }
};
