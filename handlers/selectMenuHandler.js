const {
  EmbedBuilder,
  MessageFlags
} = require('discord.js');

const {
  canAccessConfig
} = require('../utils/permissions');

const {
  getGuildConfig,
  updateGuildConfig
} = require('../utils/storage');

const PREFIXES = ['!', '.', '?', '+', '×'];

async function handleSelectMenu(interaction) {
  if (!interaction.isStringSelectMenu()) return false;

  const id = interaction.customId;

  if (!id.startsWith('zyphor:')) return false;

  if (!interaction.guild) {
    await interaction.reply({
      content: 'Este menu só pode ser usado dentro de um servidor.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  const guildId = interaction.guild.id;
  const config = getGuildConfig(guildId);

  if (!canAccessConfig(interaction.member, config)) {
    await interaction.reply({
      content: 'Você não tem permissão para usar este painel.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  if (id === 'zyphor:prefix:choose') {
    const prefix = interaction.values[0];

    if (!PREFIXES.includes(prefix)) {
      await interaction.reply({
        content: 'Esse prefixo não é permitido.',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }

    updateGuildConfig(guildId, {
      prefix
    });

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x242424)
          .setTitle('Prefixo atualizado')
          .setDescription(
            `O prefixo deste servidor agora é \`${prefix}\`.`
          )
          .setFooter({
            text: 'Zyphor Bot • Configuração'
          })
      ],
      components: []
    });

    return true;
  }

  if (id === 'zyphor:config:category') {
    const category = interaction.values[0];

    const categories = {
      moderation: {
        title: 'Moderação',
        description:
          'Configure punições, avisos e ferramentas de moderação.'
      },
      security: {
        title: 'Zyphor Security',
        description:
          'Configure Anti-Spam, Anti-Raid, Anti-Bots, Anti-GIF, Anti-Grief, Anti-Nuke e outras proteções.'
      },
      welcome: {
        title: 'Boas-vindas',
        description:
          'Configure mensagens de entrada, saída e cargos automáticos.'
      },
      prefix: {
        title: 'Prefixo',
        description:
          `Prefixo atual: \`${config.prefix || '!'}\`. Use o comando /prefixo para alterá-lo.`
      },
      permissions: {
        title: 'Permissões',
        description:
          'Configure os cargos autorizados a acessar os painéis e sistemas.'
      },
      ai: {
        title: 'Inteligência artificial',
        description:
          'Configure os recursos de IA e os canais autorizados.'
      },
      logs: {
        title: 'Logs e segurança',
        description:
          'Configure os canais de registro de mensagens, moderação e segurança.'
      },
      tickets: {
        title: 'Tickets',
        description:
          'Configure categorias, cargos de suporte e painéis de atendimento.'
      }
    };

    const selected = categories[category];

    if (!selected) {
      await interaction.reply({
        content: 'Categoria inválida.',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x242424)
          .setTitle(`Zyphor • ${selected.title}`)
          .setDescription(selected.description)
          .setFooter({
            text: 'Zyphor Bot • Painel de configuração'
          })
      ],
      components: []
    });

    return true;
  }

  await interaction.reply({
    content: 'Esta opção ainda está sendo configurada.',
    flags: MessageFlags.Ephemeral
  });

  return true;
}

module.exports = {
  handleSelectMenu
};
