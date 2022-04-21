module.exports = {
    name: 'interactionCreate',
    execute(interaction) {
        if (!interaction.isCommand()) return;

        const client = interaction.client;
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            command.execute(interaction);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'Ocorreu um erro executando esse comando.', ephemeral: true });
        }

        // const { commandName } = interaction;
        console.log(`${interaction.user.tag} utilizou o comando /${interaction.commandName} no canal #${interaction.channel.name}`);
    }
}