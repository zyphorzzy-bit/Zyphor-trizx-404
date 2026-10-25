
const { Events, EmbedBuilder } = require('discord.js');

const { getGuildConfig } = require('../utils/storage');
const { sendSecurityLog } = require('../systems/securityLogs');
const { sendGoodbye } = require('../systems/welcome');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberRemove,

  async execute(member) {
    try {
      if (!member.guild) return;

      const guild = member.guild;
      const config = getGuildConfig(guild.id);
      const user = member.user;

      // 1. Registro de saída.
      const channelId = config.logs?.memberChannelId;

      if (channelId) {
        const channel = await guild.channels
          .fetch(channelId)
          .catch(() => null);

        if (channel?.isTextBased()) {
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

      // 2. Log de segurança.
      await sendSecurityLog(guild, {
        title: 'Membro saiu do servidor',
        description: `${user?.tag || 'Um membro'} saiu do servidor.`,
        type: 'info',
        user: user || null
      });

      // 3. Mensagem de despedida, se configurada.
      try {
        await sendGoodbye(member);
      } catch (error) {
        logger.error('Erro ao enviar mensagem de despedida', error.message);
      }
    } catch (error) {
      logger.error('Erro ao registrar saída de membro', error.message);
    }
  }
};
