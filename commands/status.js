
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const emojis = require('../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Mostra o status do Zyphor Bot'),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor(0x181818)
      .setTitle(`${emojis.online} Zyphor Bot — Status`)
      .setDescription('Informações atuais do sistema.')
      .addFields(
        {
          name: '🤖 Bot',
          value: client.user.tag,
          inline: true
        },
        {
          name: '⏱️ Latência',
          value: `${client.ws.ping} ms`,
          inline: true
        },
        {
          name: '🟢 Estado',
          value: client.isReady() ? 'Online' : 'Inicializando',
          inline: true
        },
        {
          name: '🏠 Servidores',
          value: `${client.guilds.cache.size}`,
          inline: true
        },
        {
          name: '👥 Usuários em cache',
          value: `${client.guilds.cache.reduce(
            (total, guild) => total + guild.memberCount,
            0
          )}`,
          inline: true
        }
      )
      .setFooter({ text: 'Zyphor Bot • Sistema de status' })
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
