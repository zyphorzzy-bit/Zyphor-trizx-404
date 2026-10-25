
const { Events, EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('../systems/securityLogs');
const { sendWelcome } = require('../systems/welcome');
const { assignAutoRoles } = require('../systems/autorole');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member) {
    try {
      if (!member?.guild || !member.user) return;

      const guild = member.guild;
      const config = getGuildConfig(guild.id);

      // Registrar a entrada do membro.
      const memberChannelId = config.logs?.memberChannelId;

      if (memberChannelId) {
        const channel = await guild.channels
          .fetch(memberChannelId)
          .catch(() => null);

        if (channel?.isTextBased() && channel.send) {
          const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('Novo membro')
            .setDescription(`${member.user.tag} entrou no servidor.`)
            .addFields(
              {
                name: 'Conta',
                value: `${member.user}`,
                inline: true
              },
              {
                name: 'ID do Discord',
                value: member.id,
                inline: true
              }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

          await channel.send({ embeds: [embed] });
        }
      }

      // Alertar a equipe quando outro bot entrar.
      if (member.user.bot) {
        if (config.security?.antiBots?.enabled) {
          await sendSecurityLog(guild, {
            title: 'Novo bot detectado',
            description: `O bot ${member.user.tag} entrou no servidor.`,
            type: 'warning',
            user: member.user,
            target: `${member.user.tag} (${member.id})`,
            fields: [
              {
                name: 'Ação',
                value: 'Alerta enviado. Nenhuma punição automática foi aplicada.'
              }
            ]
          });
        }

        return;
      }

      // Aplicar cargos automáticos a membros humanos.
      await assignAutoRoles(member);

      // Enviar boas-vindas.
      await sendWelcome(member);
    } catch (error) {
      logger.error(
        'Erro ao processar entrada de membro',
        error.message || error
      );
    }
  }
};
