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
fluentffmpeg.setFfmpegPath(ffmpegPath)
const tempo = {}
const fila = []
let connection, player;

// Grenciador da fila de músicas:


// Caso o user insira um link inválido, o bot irá procurar por nome com a função abaixo
async function searchByName(search) {
    let query = search.replace(' ', '+')

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().headless().windowSize({ width: 1280, height: 720}))
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
        .setName('skip')
        .setDescription('(INOPERANTE) pula a música atual')
        )
    .addSubcommand(subcommand =>
        subcommand
        .setName('seek')
        .setDescription('Adianta a música para um tempo')
        .addStringOption(option => option.setName('tempo').setDescription('Timestamp da música'))
        ),

    async execute(interaction) {

        
           
        // play command
        if (interaction.options.getSubcommand() == 'play') {    
            // user não está conectado em nenhuma call -> não fazer nada
            if (!interaction.member.voice.channelId) {
                await interaction.reply('Você não está em um canal de voz!')
                return
            }
            // user está em call mas o bot não (do servidor) -> conectar na call do user
            else if (!(interaction.client.voice.adapters.has(interaction.guildId))) {
                connection = joinVoiceChannel({
                    channelId: interaction.member.voice.channelId,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                    })
                player = createAudioPlayer()
                await interaction.reply(`Conectado em ${interaction.member.voice.channel}`)      
            }
            else if (!interaction.member.voice.channelId) {
                await interaction.reply('Você não está em um canal de voz!')
                return
            }
            else if (!(interaction.member.voice.channel.members.has(interaction.client.user.id))) {
                await interaction.reply('Já estou em um canal de voz!')
                return
            }
            // Ambos estão na mesma call, mas não foi fornecido um link -> despausar música, caso tenha alguma tocando
            else if (!(interaction.options.getString('link'))) {
                await interaction.reply('Resumindo...')
                player.unpause()
                return
            }
            // Ambos estão na mesma call e foi fornecido um input: tocar a música fornecida          
            search = await interaction.options.getString('link')
        
                
            // caso search não seja um link válido do youtube, procurar no youtube e retornar o link do primeiro video da busca
            if (!ytdl.validateURL(search)) {
                interaction.channel.send(`Procurando por **${search}**`)
                url = await searchByName(search).then(content => {return content})
            } else {
                url = search
            }
                
            const stream = ytdl(url, { filter: 'audioonly' })
            const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary })
            connection.subscribe(player)
            player.play(resource)
                    
            console.log('Contando tempo de execução...')
            tempo['start'] = Math.round(performance.now())
        }
        else if (interaction.options.getSubcommand() == 'resume') {
            if (!interaction.member.voice.channelId) {
                await interaction.reply('Você não está em um canal de voz!')
                return
            }
            else if (!(interaction.member.voice.channel.members.has(interaction.client.user.id))) {
                await interaction.reply('Já estou em um canal de voz!')
                return
            }

            player.unpause()
            await interaction.reply('Resumindo...')
        }
        else if (interaction.options.getSubcommand() == 'pause') {
            if (!interaction.member.voice.channelId) {
                await interaction.reply('Você não está em um canal de voz!')
                return
            }
            else if (!(interaction.member.voice.channel.members.has(interaction.client.user.id))) {
                await interaction.reply('Já estou em um canal de voz!')
                return
            }

            console.log(player.pause())
            await interaction.reply('Pausando...')
        }
        else if (interaction.options.getSubcommand() == 'stop') {
            if (!interaction.member.voice.channelId) {
                await interaction.reply('Você não está em um canal de voz!')
                return
            }
            else if (!(interaction.member.voice.channel.members.has(interaction.client.user.id))) {
                await interaction.reply('Já estou em um canal de voz!')
                return
            }

            player.stop(true)
            connection.disconnect()
            await interaction.reply('Encerrando player...')
        }
        else if (interaction.options.getSubcommand() == 'seek') {
            if (!interaction.member.voice.channelId) {
                await interaction.reply('Você não está em um canal de voz!')
                return
            }
            else if (!(interaction.member.voice.channel.members.has(interaction.client.user.id))) {
                await interaction.reply('Já estou em um canal de voz!')
                return
            }

            let position = interaction.options.getString('tempo')

            const seeksong = ytdl(url, { filter: 'audioonly' })
            const seekretry = fluentffmpeg({source: seeksong}).toFormat('mp3').setStartTime(position)
            const seekresource = createAudioResource(seekretry, { inputType: StreamType.Arbitrary })

            player.play(seekresource)
        }


        // Eventos

        player.on(AudioPlayerStatus.Playing, () => {
            
            ytdl.getInfo(url).then(info => {
                interaction.channel.send(`Tocando agora: [${info.videoDetails.title}](${url})`)
            })
        })      
        
        player.on(AudioPlayerStatus.Idle, () => {
            if (fila[0]) {
                
            }
        })

        player.on('error', error => {
            tempo['end'] = Math.round(performance.now())
            console.error(`${error} - Tentando reconectar...`)
            let elapsed = tempo['end'] - tempo['start']

            const song = ytdl(url, { highWaterMark: 64, filter: 'audioonly' })
            const retry = fluentffmpeg({source: song}).toFormat('mp3').setStartTime(Math.ceil(elapsed/1000))
            const resourceretry = createAudioResource(retry, { inputType: StreamType.Arbitrary })
            
            player.play(resourceretry)
        })

    },

};