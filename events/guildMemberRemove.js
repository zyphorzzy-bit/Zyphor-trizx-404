const { Events, EmbedBuilder } = require('discord.js');

const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('../systems/securityLogs');

module.exports = {
  name: Events.GuildMemberRemove,

  async execute(member) {
    try {
      const guild = member.guild;
      const config = getGuildConfig(guild.id);

      const channelId = config.logs?.memberChannelId;

      if (channelId) {
        const channel = await guild.channels
          .fetch(channelId)
          .catch(() => null);

        if (channel?.isTextBased()) {
          const user = member.user;

          const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('📤 Membro saiu')
            .setDescription(
              `${user?.tag || 'Usuário desconhecido'} saiu do servidor.`
            )
            .addFields({
              name: 'Conta',
              value: user ? `${user}` : 'Não disponível',
              inline: true
            })
            .setTimestamp()
            .setFooter({
              text: 'Zyphor Bot • Registro de membros'
            });

          await channel.send({ embeds: [embed] });
        }
      }

      await sendSecurityLog(guild, {
        title: 'Membro saiu do servidor',
        description: `${member.user?.tag || 'Um membro'} saiu do servidor.`,
        type: 'info',
        user: member.user || null
      });
    } catch (error) {
      console.error(
        '[Zyphor] Erro ao registrar saída de membro:',
        error
      );
    }
  }
};
