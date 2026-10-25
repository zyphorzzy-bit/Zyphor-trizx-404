
const { EmbedBuilder, MessageFlags } = require('discord.js');

const { canAccessConfig } = require('../utils/permissions');
const {
  getGuildConfig,
  updateGuildConfig
} = require('../utils/storage');
const logger = require('../utils/logger');

async function handleModal(interaction) {
  if (!interaction.isModalSubmit()) return false;

  const id = interaction.customId;

  if (!id.startsWith('zyphor:')) return false;

  if (!interaction.guild) {
    await interaction.reply({
      content: 'Este formulário só pode ser usado dentro de um servidor.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  try {
    const guildId = interaction.guild.id;
    const config = getGuildConfig(guildId);

    if (!canAccessConfig(interaction.member, config)) {
      await interaction.reply({
        content: 'Você não tem permissão para alterar esta configuração.',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }

    // Alteração de prefixo.
    if (id === 'zyphor:config:prefix') {
      const prefix = interaction.fields
        .getTextInputValue('prefix')
        .trim();

      const allowedPrefixes = ['!', '.', '?', '+', '×'];

      if (!allowedPrefixes.includes(prefix)) {
        await interaction.reply({
          content: 'Prefixo inválido. Escolha: ! . ? + ou ×.',
          flags: MessageFlags.Ephemeral
        });
        return true;
      }

      updateGuildConfig(guildId, { prefix });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x242424)
            .setTitle('Prefixo atualizado')
            .setDescription(`O prefixo agora é \`${prefix}\`.`)
            .setFooter({ text: 'Zyphor Bot • Configuração' })
        ],
        flags: MessageFlags.Ephemeral
      });

      return true;
    }

    // Texto de boas-vindas.
    if (id === 'zyphor:welcome:message') {
      const message = interaction.fields
        .getTextInputValue('message')
        .trim();

      if (!message || message.length > 1800) {
        await interaction.reply({
          content: 'A mensagem deve ter entre 1 e 1800 caracteres.',
          flags: MessageFlags.Ephemeral
        });
        return true;
      }

      updateGuildConfig(guildId, {
        welcome: {
          message
        }
      });

      await interaction.reply({
        content: 'Mensagem de boas-vindas salva.',
        flags: MessageFlags.Ephemeral
      });

      return true;
    }

    // Texto do painel de tickets.
    if (id === 'zyphor:tickets:panel') {
      const message = interaction.fields
        .getTextInputValue('message')
        .trim();

      if (!message || message.length > 1800) {
        await interaction.reply({
          content: 'O texto deve ter entre 1 e 1800 caracteres.',
          flags: MessageFlags.Ephemeral
        });
        return true;
      }

      updateGuildConfig(guildId, {
        tickets: {
          panelMessage: message
        }
      });

      await interaction.reply({
        content: 'Texto do painel de tickets salvo.',
        flags: MessageFlags.Ephemeral
      });

      return true;
    }

    await interaction.reply({
      content: 'Este formulário ainda não está configurado.',
      flags: MessageFlags.Ephemeral
    });

    return true;
  } catch (error) {
    logger.error('Erro ao processar formulário', error.message);

    const response = {
      content: 'Não foi possível salvar as alterações.',
      flags: MessageFlags.Ephemeral
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response).catch(() => {});
    } else {
      await interaction.reply(response).catch(() => {});
    }

    return true;
  }
}

module.exports = { handleModal };
