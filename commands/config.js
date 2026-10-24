
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

const { getGuildConfig } = require('../utils/storage');
const { isOwner, canAccessConfig } = require('../utils/permissions');
const emojis = require('../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Abre o painel de configuração do Zyphor Bot'),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Use este comando dentro de um servidor.',
        ephemeral: true
      });
    }

    const config = getGuildConfig(interaction.guild.id);

    if (!canAccessConfig(interaction, config)) {
      return interaction.reply({
        content: `${emojis.negative} Você não tem permissão para acessar este painel.`,
        ephemeral: true
      });
    }

    const owner = isOwner(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0x181818)
      .setTitle(`${emojis.config} Zyphor Bot — Configurações`)
      .setDescription(
        `Bem-vindo ao painel de configuração do **Zyphor Bot**!\n\n` +
        `${emojis.online} **Servidor:** ${interaction.guild.name}\n` +
        `${emojis.document} **Prefixo atual:** \`${config.prefix || '!'}\`\n` +
        `${emojis.security} **Acesso:** ${owner ? 'Proprietário' : 'Administrador autorizado'}\n\n` +
        'Selecione abaixo a categoria que deseja configurar.'
      )
      .setFooter({ text: 'Zyphor Bot • Painel de controle' })
      .setTimestamp();

    const menu = new StringSelectMenuBuilder()
      .setCustomId('zyphor:config:category')
      .setPlaceholder('Selecione uma categoria...')
      .addOptions(
        {
          label: 'Moderação',
          description: 'Banimentos, expulsões, avisos e timeout',
          value: 'moderation',
          emoji: '🛡️'
        },
        {
          label: 'Logs e segurança',
          description: 'Eventos e registros do servidor',
          value: 'logs',
          emoji: '📋'
        },
        {
          label: 'Boas-vindas',
          description: 'Mensagens de entrada e saída',
          value: 'welcome',
          emoji: '👋'
        },
        {
          label: 'Prefixo',
          description: 'Escolher o prefixo dos comandos',
          value: 'prefix',
          emoji: '⌨️'
        },
        {
          label: 'Permissões',
          description: 'Configurar quem acessa o painel',
          value: 'permissions',
          emoji: '🔐'
        },
        {
          label: 'Inteligência artificial',
          description: 'Preparar as funções de IA',
          value: 'ai',
          emoji: '🤖'
        }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
};
