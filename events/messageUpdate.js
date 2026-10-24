const { Events, EmbedBuilder } = require('discord.js');

const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('../systems/securityLogs');

module.exports = {
  name: Events.MessageUpdate,

  async execute(oldMessage, newMessage) {
    try {
      if (!newMessage.guild) return;

      if (newMessage.author?.bot) return;

      // Mensagens parciais precisam ser carregadas quando possível.
      if (oldMessage.partial) {
        oldMessage = await oldMessage.fetch().catch(() => null);
      }

      if (!oldMessage) return;

      if (newMessage.partial) {
        newMessage = await newMessage.fetch().catch(() => null);
      }

      if (!newMessage) return;

      const before = oldMessage.content || '';
      const after = newMessage.content || '';

      // Ignora atualizações que não alteraram o texto.
      if (before === after) return;

      const config = getGuildConfig(newMessage.guild.id);

      if (!config.logs?.messageChannelId) return;

      const logChannel = await newMessage.guild.channels
        .fetch(config.logs.messageChannelId)
        .catch(() => null);

      if (!logChannel || !logChannel.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle('✏️ Mensagem editada')
        .setDescription(
          `Uma mensagem foi editada em ${newMessage.channel}.`
        )
        .addFields(
          {
            name: 'Autor',
            value: newMessage.author
              ? `${newMessage.author.tag}`
              : 'Autor desconhecido',
            inline: false
          },
          {
            name: 'Antes',
            value: before.slice(0, 1000) || '*Sem texto*',
            inline: false
          },
          {
            name: 'Depois',
            value: after.slice(0, 1000) || '*Sem texto*',
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: 'Zyphor Bot • Registro de mensagens'
        });

      await logChannel.send({ embeds: [embed] });

      await sendSecurityLog(newMessage.guild, {
        title: 'Mensagem editada',
        description: `Uma mensagem foi editada em ${newMessage.channel}.`,
        type: 'warning',
        user: newMessage.author || null,
        channel: newMessage.channel
      });
    } catch (error) {
      console.error(
        '[Zyphor] Erro ao registrar mensagem editada:',
        error
      );
    }
  }
};
