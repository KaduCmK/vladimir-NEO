const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const fs = require('node:fs');

const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES)

const client = new Client({ intents: myIntents });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./comandos').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./comandos/${file}`);
    client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync('./eventos').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./eventos/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args))
    }
}

client.login(token);