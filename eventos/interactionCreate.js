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

        // Registrar o comando requisitado no console
        hora = interaction.createdAt.getHours().toLocaleString(undefined, {minimumIntegerDigits: 2});
        min = interaction.createdAt.getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2});
        dia = interaction.createdAt.getDate().toLocaleString(undefined, {minimumIntegerDigits: 2});
        mes = (interaction.createdAt.getMonth()+1).toLocaleString(undefined, {minimumIntegerDigits: 2});
        ano = interaction.createdAt.getFullYear();
        console.log(`${hora}:${min} ${dia}/${mes}/${ano} -  ${interaction.user.tag} utilizou /${interaction.commandName} ${interaction.options.getSubcommand()} no canal #${interaction.channel.name}, servidor '${interaction.guild.name}'`);
    }
}