const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Responde com informações de quem chamou o comando'),
    async execute(interaction) {
        interaction.reply(`Usuario: ${interaction.user.tag}\nÉ um bot? ${interaction.user.bot? 'Sim' : 'Não'}`)
    },
};