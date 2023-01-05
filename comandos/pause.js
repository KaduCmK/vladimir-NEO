const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require('ytdl-core');
const { players } = require('../main.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('test command'),

    async execute(interaction) {
        console.log(players);
    }
}