const { Events, EmbedBuilder } = require('discord.js');

const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('../systems/securityLogs');

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member) {
    try {
      const config = getGuildConfig(member.guild.id);

      // Registro de entrada de membros.
      const memberChannelId = config.logs?.memberChannelId;

      if (memberChannelId) {
        const channel = await member.guild.channels
          .fetch(memberChannelId)
          .catch(() => null);

        if (channel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('📥 Novo membro')
            .setDescription(`${member.user.tag} entrou no servidor.`)
            .addFields(
              {
                name: 'Conta',
                value: `${member.user}`,
                inline: true
              },
              {
                name: 'ID interno do Discord',
                value: member.id,
                inline: true
              }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

          await channel.send({ embeds: [embed] });
        }
      }

      // Alerta do Anti-Bots.
      if (member.user.bot && config.security?.antiBots?.enabled) {
        await sendSecurityLog(member.guild, {
          title: '🤖 Novo bot detectado',
          description: `O bot ${member.user.tag} entrou no servidor.`,
          type: 'warning',
          user: member.user,
          target: member.user.tag,
          fields: [
            {
              name: 'Ação automática',
              value: 'Alerta enviado para a equipe. Nenhuma punição automática foi aplicada.'
            }
          ]
        });
      }

      // Futuramente: sistema de boas-vindas e cargos automáticos.
    } catch (error) {
      console.error(
        '[Zyphor] Erro ao processar entrada de membro:',
        error
      );
    }
  }
};
