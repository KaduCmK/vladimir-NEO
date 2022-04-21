const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [];
const commandFiles = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./comandos/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Comandos registrados com sucesso'))
    .catch(console.error);