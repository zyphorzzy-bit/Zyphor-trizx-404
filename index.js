
const {
  Client,
  GatewayIntentBits,
  Partials
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// DONO PRINCIPAL DO ZYPHOR BOT
const BOT_OWNER_ID = "1533306874513068093";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

// Identificação do proprietário
client.botOwnerId = BOT_OWNER_ID;

// Verificação de proprietário
client.isBotOwner = (userId) => {
  return userId === client.botOwnerId;
};

// Pastas de armazenamento JSON
const folders = [
  "data/configs",
  "data/tickets",
  "data/products",
  "data/feedbacks",
  "data/moderation",
  "data/security",
  "data/logs"
];

for (const folder of folders) {
  fs.mkdirSync(path.join(__dirname, folder), {
    recursive: true
  });
}

// Preparação dos comandos
client.commands = new Map();

// Preparação dos eventos
client.once("ready", () => {
  console.log("--------------------------------");
  console.log("       ZYPHOR BOT ONLINE");
  console.log("--------------------------------");
  console.log(`Bot: ${client.user.tag}`);
  console.log(`Dono: ${BOT_OWNER_ID}`);
  console.log("Armazenamento: JSON");
  console.log("Banco de dados: Desativado");
  console.log("--------------------------------");
});

// Conexão
if (!process.env.DISCORD_TOKEN) {
  console.error("ERRO: DISCORD_TOKEN não configurado!");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
