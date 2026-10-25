
require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes
} = require('discord.js');

const { loadCommands } = require('./handlers/commandHandler');
const { handleButton } = require('./handlers/buttonHandler');
const { handleSelectMenu } = require('./handlers/selectMenuHandler');
const { handleModal } = require('./handlers/modalHandler');
const logger = require('./utils/logger');

const TEST_GUILD_ID = '1550345798766567527';

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

client.once(Events.ClientReady, async readyClient => {
  logger.info(`Zyphor Bot conectado como ${readyClient.user.tag}`);

  readyClient.user.setPresence({
    activities: [{ name: 'Zyphor | /config', type: 3 }],
    status: 'online'
  });

  try {
    const token = process.env.DISCORD_TOKEN;

    if (!token) {
      throw new Error('DISCORD_TOKEN não configurado.');
    }

    const commands = [...readyClient.commands.values()]
      .filter(command => command.data?.name)
      .map(command =>
        typeof command.data.toJSON === 'function'
          ? command.data.toJSON()
          : command.data
      );

    const rest = new REST({ version: '10' }).setToken(token);

    await rest.put(
      Routes.applicationGuildCommands(
        readyClient.user.id,
        TEST_GUILD_ID
      ),
      { body: commands }
    );

    logger.info(
      `${commands.length} comando(s) registrado(s) no servidor de teste.`
    );
  } catch (error) {
    logger.error('Erro ao registrar comandos slash:', error);
  }

  console.log('Zyphor Bot está pronto!');
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        await interaction.reply({
          content: 'Este comando não foi encontrado.',
          ephemeral: true
        });
        return;
      }

      await command.execute(interaction, client);
      return;
    }

    if (interaction.isButton()) {
      await handleButton(interaction, client);
      return;
    }

    if (
      interaction.isStringSelectMenu() ||
      interaction.isChannelSelectMenu() ||
      interaction.isRoleSelectMenu() ||
      interaction.isUserSelectMenu() ||
      interaction.isMentionableSelectMenu()
    ) {
      await handleSelectMenu(interaction, client);
      return;
    }

    if (interaction.isModalSubmit()) {
      await handleModal(interaction, client);
    }
  } catch (error) {
    logger.error('Erro ao processar interação:', error);

    const response = {
      content: 'Ocorreu um erro ao executar essa ação.',
      ephemeral: true
    };

    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(response).catch(() => {});
      } else {
        await interaction.reply(response).catch(() => {});
      }
    }
  }
});

client.on(Events.Error, error => {
  logger.error('Erro do cliente Discord:', error);
});

if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN não foi configurado nas variáveis de ambiente.');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
  logger.error('Não foi possível conectar ao Discord:', error);
  process.exitCode = 1;
});
