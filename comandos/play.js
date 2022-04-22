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

const player = createAudioPlayer()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('song')
        .setDescription('Tocar músicas a partir do Youtube')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Toca uma música nova, ou continua a atual')
                .addStringOption(option => option.setName('link').setDescription('Link da música a ser tocada'))
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pause')
                .setDescription('Pausa a música atual')
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('resume')
                .setDescription('Continua a música, se estiver pausada')
            ),
    async execute(interaction) {
        
        fluentffmpeg.setFfmpegPath(ffmpegPath)

        if (interaction.options.getSubcommand() == 'play'){

            if (!interaction.options.getString('link')) {
                player.unpause()
                interaction.reply('Resumindo...')
            }
            else {
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
                const stream = ytdl(url, { quality: 'highestaudio', filter: form => {
                    if (form.bitrate && interaction.member.voice.channel?.bitrate) return form.bitrate <= interaction.member.voice.channel.bitrate;
                    return false
                }})
                const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary })

                connection.subscribe(player)
                player.play(resource)
            }
        }
        else if (interaction.options.getSubcommand() == 'pause') {
            console.log(player.pause())
            interaction.reply('Pausando...')
        }
        else if (interaction.options.getSubcommand() == 'resume') {
            player.unpause()
            interaction.reply('Resumindo...')
        }
        
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