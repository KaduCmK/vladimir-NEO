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
const { Builder, By } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')


// Criação de assets utilizados ao longo do ciclo de vida do bot
let player = createAudioPlayer()
fluentffmpeg.setFfmpegPath(ffmpegPath)
const tempo = {}

// Caso o user insira um link inválido, o bot irá procurar por nome com a função abaixo
async function searchByName(search) {
    let query = search.replace(' ', '+')

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().headless().windowSize({width: 1280, height: 720 }))
        .build()

    await driver.get(`https://www.youtube.com/results?search_query=${query}`)
    driver.manage().setTimeouts({implicit: 1})

    let link = await driver.findElement(By.id('video-title')).getAttribute('href')
    
    await driver.close()
    return link
}


// Comandos
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
        )
    .addSubcommand(subcommand =>
        subcommand
        .setName('stop')
        .setDescription('Para toda as músicas e desconecta o player')
        )
    .addSubcommand(subcommand =>
        subcommand
        .setName('test')
        .setDescription('test command')
        ),

    async execute(interaction) {
                        
        var connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            })

        // play command
        if (interaction.options.getSubcommand() == 'play') {
                            
            // Caso não seja fornecido um link o comando chama player.unpause()
            if (!interaction.options.getString('link')) {
                player.unpause()
                await interaction.reply('Resumindo...')
            }
            else {
                if (interaction.member.voice.channel) {
                    await interaction.reply(`Conectado em ${interaction.member.voice.channel}`)
                    search = interaction.options.getString('link')

                    if (!ytdl.validateURL(search)) {
                        await interaction.editReply(`Conectado em ${interaction.member.voice.channel}\nProcurando por **${search}**...`)
                        url = await searchByName(search).then(content => {return content})
                    }
                
                    player = createAudioPlayer()
                    const stream = ytdl(url, { quality: 'highestaudio', filter: form => {
                        if (form.bitrate && interaction.member.voice.channel?.bitrate) return form.bitrate <= interaction.member.voice.channel.bitrate;
                        return false
                    }})
                    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary })
                    connection.subscribe(player)
                    player.play(resource)
                        
                    console.log('Contando tempo de execução...')
                    tempo['start'] = Math.round(performance.now())
                    
                } 
                else {
                    await interaction.reply('Você não está em nenhum canal de voz!')
                }
            }
        }
        else if (interaction.options.getSubcommand() == 'resume') {
            player.unpause()
            await interaction.reply('Resumindo...')
        }
        else if (interaction.options.getSubcommand() == 'pause') {
            console.log(player.pause())
            await interaction.reply('Pausando...')
        }
        else if (interaction.options.getSubcommand() == 'stop') {
            player.stop(true)
            await interaction.reply('Encerrando player...')
        }
        else if (interaction.options.getSubcommand() == 'test') {
            
        }


        // Eventos

        player.on(AudioPlayerStatus.Playing, () => {
            
            ytdl.getInfo(url).then(info => {
                interaction.followUp(`Tocando agora: [${info.videoDetails.title}](${url})`)
            })
        })      
        
        player.on(AudioPlayerStatus.Idle, () => connection.destroy())

        player.on('error', error => {
            tempo['end'] = Math.round(performance.now())
            console.error(`${error} - Tentando reconectar...`)
            let elapsed = tempo['end'] - tempo['start']

            const song = ytdl(url, { quality: 'lowestaudio', highWaterMark: 64, filter: form => {
                if (form.bitrate && interaction.member.voice.channel?.bitrate) return form.bitrate <= interaction.member.voice.channel.bitrate;
                return false
            }})
            const retry = fluentffmpeg({source: song}).toFormat('mp3').setStartTime(Math.ceil(elapsed/1000))
            const resourceretry = createAudioResource(retry, { inputType: StreamType.Arbitrary })
            
            player.play(resourceretry)
        })

    },

};