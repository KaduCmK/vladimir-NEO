const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require('ytdl-core');
const {
    AudioPlayerStatus,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
} = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('toca música a partir de um link do Youtube')
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Insira o link do vídeo')
                .setRequired(true)
        ),
    async execute(interaction) {

        if (interaction.member.voice.channel) {
            var connection = joinVoiceChannel({
                channelId: interaction.member.voice.channelId,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            })
            interaction.reply(`Conectado em ${interaction.member.voice.channel}`)
        } else {
            interaction.reply('Você não está em nenhum canal de voz!')
        }

        url = interaction.options.getString('link')
        const stream = ytdl(url, { filter: 'audioonly'})
        const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary })
        const player = createAudioPlayer()

        player.play(resource)
        connection.subscribe(player)

        player.on(AudioPlayerStatus.Idle, () => connection.destroy())

        interaction.client.on('error', error => {
            console.error(`Ocorreu um erro: ${error}`)
            console.log(`Ocorreu um erro: ${error}`)
        })
    },
};