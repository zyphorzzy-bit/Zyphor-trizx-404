const { Events, EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('../systems/securityLogs');

module.exports = {
  name: Events.MessageDelete,

  async execute(message) {
    try {
      if (!message.guild) return;
      if (message.author?.bot) return;

      const config = getGuildConfig(message.guild.id);

      if (!config.logs?.messageChannelId) return;

      const channel = await message.guild.channels
        .fetch(config.logs.messageChannelId)
        .catch(() => null);

      if (!channel || !channel.isTextBased()) return;

      const content = message.content?.trim()
        ? message.content.slice(0, 1000)
        : '*Conteúdo indisponível ou mensagem sem texto.*';

      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('🗑️ Mensagem apagada')
        .addFields(
          {
            name: 'Autor',
            value: message.author
              ? `${message.author.tag} (${message.author.id})`
              : 'Autor desconhecido',
            inline: false
          },
          {
            name: 'Canal',
            value: `${message.channel}`,
            inline: true
          },
          {
            name: 'Conteúdo',
            value: content,
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({ text: 'Zyphor Bot • Registro de mensagens' });

      await channel.send({ embeds: [embed] });

      await sendSecurityLog(message.guild, {
        title: 'Mensagem apagada',
        description: `Uma mensagem foi apagada em ${message.channel}.`,
        type: 'warning',
        user: message.author || null,
        channel: message.channel
      });
    } catch (error) {
      console.error('[Zyphor] Erro ao registrar mensagem apagada:', error);
    }
  }
};
