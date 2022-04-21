const { SlashCommandBuilder } = require('@discordjs/builders');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde com pong'),
    async execute(interaction) {
        await interaction.deferReply();
        await wait(2000);
        await interaction.editReply('pong carai')
    },
};