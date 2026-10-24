
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  Events
} = require('discord.js');
const fs = require('fs');
const path = require('path');

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
client.configPath = path.join(__dirname, 'data.json');

const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(commandsPath, file));

    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.once(Events.ClientReady, readyClient => {
  console.log(`Zyphor Bot online: ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (command) {
        await command.execute(interaction, client);
      }
    }
  } catch (error) {
    console.error('Erro na interação:', error);

    const message = {
      content: 'Ocorreu um erro ao executar essa função.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(message).catch(() => {});
    } else {
      await interaction.reply(message).catch(() => {});
    }
  }
});

if (!process.env.DISCORD_TOKEN) {
  console.error('Configure DISCORD_TOKEN nas variáveis de ambiente.');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
