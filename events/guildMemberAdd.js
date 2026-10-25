
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
      if (!member.guild) return;

      const config = getGuildConfig(member.guild.id);

      // 1. Registrar a entrada do membro.
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

      // 2. Alertar sobre a entrada de outro bot.
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
              value: 'Alerta enviado à equipe. Nenhuma punição automática foi aplicada.'
            }
          ]
        });
      }

      // 3. Aplicar cargos automáticos apenas a membros humanos.
      if (!member.user.bot) {
        try {
          await assignAutoRoles(member);
        } catch (error) {
          logger.error('Erro ao atribuir cargos automáticos', error.message);
        }

        // 4. Enviar a mensagem de boas-vindas.
        try {
          await sendWelcome(member);
        } catch (error) {
          logger.error('Erro ao enviar boas-vindas', error.message);
        }
      }
    } catch (error) {
      logger.error(
        'Erro ao processar entrada de membro',
        error.message
      );
    }
  }
};
