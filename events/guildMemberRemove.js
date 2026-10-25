
const { Events, EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('../systems/securityLogs');
const { sendGoodbye } = require('../systems/welcome');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberRemove,

  async execute(member) {
    try {
      if (!member?.guild || !member.user) return;

      const guild = member.guild;
      const config = getGuildConfig(guild.id);
      const channelId = config.logs?.memberChannelId;

      // Registrar a saída do membro.
      if (channelId) {
        const channel = await guild.channels
          .fetch(channelId)
          .catch(() => null);

        if (channel?.isTextBased() && channel.send) {
          const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('Membro saiu')
            .setDescription(`${member.user.tag} saiu do servidor.`)
            .addFields({
              name: 'ID do Discord',
              value: member.id
            })
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

          await channel.send({ embeds: [embed] });
        }
      }

      // Registrar a saída nos logs de segurança.
      await sendSecurityLog(guild, {
        title: 'Saída de membro',
        description: `${member.user.tag} saiu do servidor.`,
        type: 'warning',
        target: `${member.user.tag} (${member.id})`
      });

      // Enviar despedida, se estiver configurada.
      if (!member.user.bot) {
        await sendGoodbye(member);
      }
    } catch (error) {
      logger.error(
        'Erro ao processar saída de membro',
        error.message || error
      );
    }
  }
};
