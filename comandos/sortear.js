const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sortear')
        .setDescription('Sorteia entre os itens enviados')
        .addStringOption(option => 
            option.setName('itens')
                .setDescription('O que você quer sortear (separe por vírgulas)')
                .setRequired(true)),
    async execute(interaction) {
        itens = interaction.options.getString('itens');
        await interaction.reply(`Sorteando entre ${itens}...`)

        array = itens.split(', ');
        escolhido = Math.floor(Math.random() * array.length);

        await interaction.channel.sendTyping();
        await setTimeout(() => {
            interaction.followUp(`Escolhido: ${array[escolhido]}`);
        }, 3000);
    },
};