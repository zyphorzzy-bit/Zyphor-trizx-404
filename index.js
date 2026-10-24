
require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  ActivityType,
  MessageFlags
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

function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');

  if (!fs.existsSync(eventsPath)) {
    logger.warn('A pasta events não foi encontrada.');
    return;
  }

  const files = fs.readdirSync(eventsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of files) {
    try {
      const filePath = path.join(eventsPath, file);
      delete require.cache[require.resolve(filePath)];

      const event = require(filePath);

      if (!event.name || typeof event.execute !== 'function') {
        logger.warn(`Evento ignorado por formato inválido: ${file}`);
        continue;
      }

      // Estes dois eventos são tratados neste arquivo.
      if (
        event.name === Events.ClientReady ||
        event.name === Events.InteractionCreate
      ) {
        logger.info(`Evento tratado pelo index.js: ${file}`);
        continue;
      }

      const execute = (...args) =>
        event.execute(...args, client);

      if (event.once) {
        client.once(event.name, execute);
      } else {
        client.on(event.name, execute);
      }

      logger.success(`Evento carregado: ${file}`);
    } catch (error) {
      logger.error(`Erro ao carregar o evento ${file}`, error.message);
    }
  }
}

try {
  loadCommands(client);
  loadEvents();
} catch (error) {
  logger.error('Erro ao preparar comandos ou eventos', error.message);
}

client.once(Events.ClientReady, readyClient => {
  logger.success(`Zyphor Bot conectado como ${readyClient.user.tag}`);

  readyClient.user.setPresence({
    activities: [
      {
        name: 'Zyphor | /config',
        type: ActivityType.Watching
      }
    ],
    status: 'online'
  });

  logger.info('Inicialização concluída.');
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        await interaction.reply({
          content: 'Este comando não foi carregado.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await command.execute(interaction, client);
      return;
    }

    if (interaction.isButton()) {
      const handled = await handleButton(interaction, client);
      if (handled) return;
    }

    const isSelectMenu =
      interaction.isStringSelectMenu() ||
      interaction.isChannelSelectMenu() ||
      interaction.isRoleSelectMenu() ||
      interaction.isUserSelectMenu() ||
      interaction.isMentionableSelectMenu();

    if (isSelectMenu) {
      const handled = await handleSelectMenu(interaction, client);
      if (handled) return;
    }

    if (interaction.isModalSubmit()) {
      const handled = await handleModal(interaction, client);
      if (handled) return;
    }
  } catch (error) {
    logger.error('Erro ao processar interação', error.message);

    const response = {
      content: 'Ocorreu um erro ao executar essa ação.',
      flags: MessageFlags.Ephemeral
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response).catch(() => {});
    } else {
      await interaction.reply(response).catch(() => {});
    }
  }
});

client.on(Events.Error, error => {
  logger.error('Erro do cliente Discord', error.message);
});

process.on('unhandledRejection', error => {
  logger.error(
    'Promessa rejeitada sem tratamento',
    error?.message || String(error)
  );
});

process.on('uncaughtException', error => {
  logger.error('Erro inesperado no processo', error.message);
});

if (!process.env.DISCORD_TOKEN) {
  logger.error(
    'DISCORD_TOKEN não configurado. O bot não será iniciado.'
  );
} else {
  client.login(process.env.DISCORD_TOKEN).catch(error => {
    logger.error('Não foi possível conectar ao Discord', error.message);
  });
}
