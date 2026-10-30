const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder,
    ChannelType,
    StringSelectMenuBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

const dataFilePath = path.join(__dirname, 'data.json');

// Gerenciamento do data.json unificado
function loadDatabase() {
    if (!fs.existsSync(dataFilePath)) {
        const initialData = { guilds: {} };
        fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    try {
        const raw = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        console.error("Erro ao ler o data.json:", error);
        return { guilds: {} };
    }
}

function saveDatabase(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error("Erro ao salvar o data.json:", error);
        return false;
    }
}

function getGuildConfig(guildId) {
    const db = loadDatabase();
    if (!db.guilds[guildId]) {
        db.guilds[guildId] = {
            config: {
                honeypotChannel: null,
                ticketMode: 'threads', // 'threads' ou 'channels'
                ticketCategory: null
            },
            tickets: [],
            products: [],
            feedbacks: [],
            moderation: [],
            securityLogs: []
        };
        saveDatabase(db);
    }
    return db.guilds[guildId];
}

function updateGuildConfig(guildId, updateFn) {
    const db = loadDatabase();
    if (!db.guilds[guildId]) {
        db.guilds[guildId] = {
            config: {},
            tickets: [],
            products: [],
            feedbacks: [],
            moderation: [],
            securityLogs: []
        };
    }
    updateFn(db.guilds[guildId]);
    saveDatabase(db);
}

// Evento: Bot pronto & Registro de Comandos Slash
client.once('ready', async () => {
    console.log(`[ZYPhor Bot] Conectado com sucesso como ${client.user.tag}!`);

    const commands = [
        new SlashCommandBuilder()
            .setName('config')
            .setDescription('Painel central de configuração do ZYPhor Bot'),
        new SlashCommandBuilder()
            .setName('feedbacks')
            .setDescription('Consulta os feedbacks registrados no servidor')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('[ZYPhor Bot] Comandos Slash registrados com sucesso!');
    } catch (error) {
        console.error(error);
    }
});

// Evento: Interações (Slash Commands, Botões e Menus)
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'config') {
            const isOwner = interaction.user.id === process.env.OWNER_ID;
            if (!isOwner && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ 
                    content: 'Apenas o proprietário principal ou administradores podem acessar o `/config`.', 
                    ephemeral: true 
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('⚙️ ZYPhor Bot — Painel de Configuração')
                .setDescription('Selecione abaixo o módulo que deseja gerenciar.')
                .setColor(0x2b2d31);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('config_security')
                    .setLabel('Segurança & Honeypot')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🛡️'),
                new ButtonBuilder()
                    .setCustomId('config_tickets')
                    .setLabel('Tickets')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎫'),
                new ButtonBuilder()
                    .setCustomId('config_store')
                    .setLabel('Loja / Produtos')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🛒')
            );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        } 
        else if (commandName === 'feedbacks') {
            const guildData = getGuildConfig(interaction.guild.id);
            if (!guildData.feedbacks || guildData.feedbacks.length === 0) {
                return interaction.reply({ content: 'Não há feedbacks registrados neste servidor.', ephemeral: true });
            }

            const summary = guildData.feedbacks.map((f, i) => `**#${i+1}** - Nota: ${f.rating}⭐ | Por: <@${f.userId}>`).slice(0, 10).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('💬 Consulta de Feedbacks')
                .setDescription(summary)
                .setColor(0x57F287);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    } 
    else if (interaction.isButton()) {
        const id = interaction.customId;

        if (id === 'config_security') {
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Configuração de Segurança & Honeypot')
                .setDescription('O sistema Honeypot captura mensagens enviadas em canais monitorados, aplicando castigo automático (Timeout de 7 dias) e registrando logs.')
                .setColor(0xED4245);

            await interaction.update({ embeds: [embed], components: [], ephemeral: true });
        } 
        else if (id === 'config_tickets') {
            const embed = new EmbedBuilder()
                .setTitle('🎫 Configuração de Tickets')
                .setDescription('Gerencie as preferências de atendimento, criadores de painéis e permissões da equipe.')
                .setColor(0x5865F2);

            await interaction.update({ embeds: [embed], components: [], ephemeral: true });
        }
        else if (id === 'config_store') {
            const embed = new EmbedBuilder()
                .setTitle('🛒 Configuração de Produtos')
                .setDescription('Cadastre produtos, associe cargos e gerencie o fluxo de atendimento por ticket.')
                .setColor(0xFEE75C);

            await interaction.update({ embeds: [embed], components: [], ephemeral: true });
        }
    }
});

// Evento: Monitoramento de Segurança & Honeypot em Mensagens
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const guildData = getGuildConfig(message.guild.id);
    
    // Verificação do canal Honeypot
    if (guildData.config.honeypotChannel && message.channel.id === guildData.config.honeypotChannel) {
        try {
            await message.delete();

            if (message.member && message.member.moderatable) {
                await message.member.timeout(7 * 24 * 60 * 60 * 1000, 'Violação de segurança: Canal Honeypot.');
            }

            updateGuildConfig(message.guild.id, (data) => {
                if (!data.securityLogs) data.securityLogs = [];
                data.securityLogs.push({
                    userId: message.author.id,
                    username: message.author.tag,
                    content: message.content || '[Mídia/Anexo]',
                    timestamp: new Date().toISOString()
                });
            });

            console.log(`[Honeypot Acionado] Usuário ${message.author.tag} punido em ${message.guild.name}.`);
        } catch (error) {
            console.error('Erro ao processar ativação do Honeypot:', error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
