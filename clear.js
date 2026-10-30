const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const CLIENT_ID = process.env.CLIENT_ID || '1565501078001426432';
const GUILD_ID = 'SEU_SERVER_ID_AQUI'; // Opcional, caso queira limpar de um servidor específico

async function clearCommands() {
    try {
        console.log('Removendo comandos globais...');
        // Limpa todos os comandos globais
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: [] },
        );
        console.log('Comandos globais removidos com sucesso!');

        /* 
        // Descomente abaixo se os comandos estiverem registrados em um servidor específico (Guild)
        console.log('Removendo comandos da guilda...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: [] },
        );
        console.log('Comandos da guilda removidos com sucesso!');
        */
    } catch (error) {
        console.error('Erro ao remover comandos:', error);
    }
}

clearCommands();
