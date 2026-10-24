
require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events
} = require('discord.js');

const { loadCommands } = require('./handlers/commandHandler');
const { handleButton } = require('./handlers/buttonHandler');
const { handleSelectMenu } = require('./handlers/selectMenuHandler');
const { handleModal } = require('./handlers/modalHandler');
const logger = require('./utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
});

client.commands = new Collection();

loadCommands(client);

client.once(Events.ClientReady, readyClient => {
  logger.info(`Zyphor Bot online como ${readyClient.user.tag}`);

  readyClient.user.setPresence({
    activities: [
      {
        name: 'Zyphor | /config',
        type: 3
      }
    ],
    status: 'online'
  });

  console.log('Zyphor Bot está pronto!');
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (command) {
        await command.execute(interaction, client);
      }

      return;
    }

    if (interaction.isButton()) {
      const handled = await handleButton(interaction, client);
      if (handled) return;
    }

    if (
      interaction.isStringSelectMenu()
    ) {
      const handled = await handleSelectMenu(interaction, client);
      if (handled) return;
    }

    if (interaction.isModalSubmit()) {
      const handled = await handleModal(interaction, client);
      if (handled) return;
    }
  } catch (error) {
    logger.error('Erro ao processar interação', error);

    const response = {
      content: 'Ocorreu um erro ao executar essa ação.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response).catch(() => {});
    } else {
      await interaction.reply(response).catch(() => {});
    }
  }
});

client.on(Events.Error, error => {
  logger.error('Erro do cliente Discord', error);
});

if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN não foi configurado nas variáveis de ambiente.');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
  logger.error('Não foi possível conectar o bot ao Discord', error);
  process.exitCode = 1;
});
