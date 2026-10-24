const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags
} = require('discord.js');

const { canAccessConfig } = require('../utils/permissions');
const { getGuildConfig } = require('../utils/storage');

const categories = [
  {
    label: 'Zyphor Security',
    value: 'security',
    description: 'Anti-spam, Anti-bots, Anti-GIF, Anti-raid e Anti-nuke',
    emoji: '🛡️'
  },
  {
    label: 'Moderação',
    value: 'moderation',
    description: 'Banimentos, expulsões, castigos e avisos',
    emoji: '🔨'
  },
  {
    label: 'Logs e segurança',
    value: 'logs',
    description: 'Escolha os canais de registros do servidor',
    emoji: '📋'
  },
  {
    label: 'Boas-vindas',
    value: 'welcome',
    description: 'Mensagens de entrada, saída e cargos automáticos',
    emoji: '👋'
  },
  {
    label: 'Permissões',
    value: 'permissions',
    description: 'Configure os cargos autorizados',
    emoji: '🔐'
  },
  {
    label: 'Tickets',
    value: 'tickets',
    description: 'Painéis, categorias e equipe de atendimento',
    emoji: '🎫'
  },
  {
    label: 'Inteligência artificial',
    value: 'ai',
    description: 'Configure os recursos de IA do bot',
    emoji: '🤖'
  },
  {
    label: 'Prefixo',
    value: 'prefix',
    description: 'Escolha o prefixo dos comandos tradicionais',
    emoji: '⚙️'
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Abre o painel de configuração do Zyphor Bot'),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Use este comando dentro de um servidor.',
        flags: MessageFlags.Ephemeral
      });
    }

    const config = getGuildConfig(interaction.guild.id);

    if (!canAccessConfig(interaction.member, config)) {
      return interaction.reply({
        content: 'Você não tem permissão para abrir este painel.',
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x242424)
      .setTitle('ZYPhor • Central de configuração')
      .setDescription(
        [
          'Configure os sistemas do seu servidor em um só lugar.',
          '',
          '🛡️ **Segurança:** filtros, proteções e alertas.',
          '🔨 **Moderação:** ferramentas para a equipe.',
          '📋 **Logs:** registros organizados.',
          '🎫 **Tickets:** atendimento personalizado.',
          '',
          'Selecione uma categoria no menu abaixo.'
        ].join('\n')
      )
      .setFooter({
        text: `Zyphor Bot • ${interaction.guild.name}`
      });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('zyphor:config:category')
      .setPlaceholder('Selecione uma categoria...')
      .addOptions(categories);

    const row = new ActionRowBuilder().addComponents(menu);

    return interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
};
