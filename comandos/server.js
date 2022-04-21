const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Responde com algumas informações do servidor'),
    async execute(interaction) {
        await interaction.reply(`Nome do servidor: ${interaction.guild.name}\nQuantidade de membros: ${interaction.guild.memberCount}`)
    },
};