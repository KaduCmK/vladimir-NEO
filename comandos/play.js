const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require('ytdl-core');
const {
    AudioPlayerStatus,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
} = require('@discordjs/voice');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const fluentffmpeg = require('fluent-ffmpeg')

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

        fluentffmpeg.setFfmpegPath(ffmpegPath)

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
        const stream = ytdl(url, { quality: 'lowestaudio', filter: form => {
            if (form.bitrate && interaction.member.voice.channel?.bitrate) return form.bitrate <= interaction.member.voice.channel.bitrate;
            return false
        }})
        const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary })
        const player = createAudioPlayer()

        player.play(resource)
        connection.subscribe(player)
        
        const tempo = {}
        player.on(AudioPlayerStatus.Playing, () => {
            console.log('Contando tempo de execução...')
            tempo['start'] = Math.round(performance.now())

            ytdl.getInfo(url).then(info => {
                interaction.editReply(`Conectado em ${interaction.member.voice.channel}\n\nTocando agora: ${info.videoDetails.title}`)
            })
        })
        
        player.on('error', error => {
            tempo['end'] = Math.round(performance.now())
            console.error(`Ocorreu um erro: ${error} - Tentando reconectar...`)
            let elapsed = tempo['end'] - tempo['start']

            const song = ytdl(url, { quality: 'lowestaudio', highWaterMark: 64, filter: form => {
                if (form.bitrate && interaction.member.voice.channel?.bitrate) return form.bitrate <= interaction.member.voice.channel.bitrate;
                return false
            }})
            const retry = fluentffmpeg({source: song}).toFormat('mp3').setStartTime(Math.ceil(elapsed/1000))
            const resourceretry = createAudioResource(retry, { inputType: StreamType.Arbitrary })
            
            player.play(resourceretry)
        })

        player.on(AudioPlayerStatus.Idle, () => connection.destroy())

    },
};