const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('limpar')
        .setDescription('limpa as mensagens deste canal de texto')
        .addNumberOption(option => option.setName('quantidade').setDescription('número de mensagens a serem excluídas')),
    async execute(interaction) {
        const qtd = await interaction.options.getNumber('quantidade')
        const channel = await interaction.channel

        await channel.bulkDelete(qtd)

        console.log(`${interaction.user.tag} excluiu ${qtd} mensagens do canal ${interaction.channel.name}`)
        await interaction.reply({ content: `${qtd} mensagens excluidas`, ephemeral: true })
    },
};