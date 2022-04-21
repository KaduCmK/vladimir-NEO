const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const fs = require('node:fs');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
    console.log('Pronto!');
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./comandos/${file}`);
    client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Ocorreu um erro executando esse comando.', ephemeral: true });
    }
});

client.login(token);