const TelegramBot = require( `node-telegram-bot-api` )
const state = require('./robots/state.js')
const token = require('./credentials/telegram.json')
const OutputRobot = require('./robots/output.js')
const TextRobot = require('./robots/text.js')
const ImageRobot = require('./robots/image.js');
const VideoRobot = require('./robots/video.js');

function robot(){

    var robots = {
        input: require('./robots/input.js'),
        text: new TextRobot('text-robot'),
        state: require('./robots/state.js'),
        image: new ImageRobot('image-robot'),
        video: new VideoRobot('video-robot'),
        youtube: require('./robots/youtube.js'),
        utils: require('./robots/utils.js'),
        queue: require('./robots/queue.js'),
        output: new OutputRobot('output-robot'),
        telegram: new TelegramBot( token.token, { polling: true } )
    }
    robots.queue.queueText.push('> [telegram-robot] Starting...')

    var content = {}

    async function makeVideo(){
        try{
            await robots.text.run()
            await robots.image.run()
            await robots.video.run()
            return true
        }
        catch(e)
        {   
            robots.queue.queueText.push('> [telegram-robot] ***** [makeVideo][ERROR] Objeto exception:')
            robots.utils.printaJson(e)
            robots.queue.queueText.push('> [telegram-robot] *****')
            return e
        }
    }

    async function onBotMake(msg, match){
        const chatId = msg.chat.id
        const searchTerm = match[1].trim()
        const videoFilePath = './content/output.mp4'

        if(!searchTerm){
            robots.telegram.sendMessage(chatId, 'Input inválido, digite /help para ajuda')
            return
        }
        content.searchTerm = searchTerm
        content.queryId = robots.utils.uuidv4()
        state.save(content)
        robots.telegram.sendMessage(chatId, 'Certo, vou fazer um vídeo a respeito de: ' + searchTerm)
        makeVideoStatus = await makeVideo()
        if(makeVideoStatus === true)
            robots.telegram.sendMessage(chatId, 'Vídeo pronto')
        else{
            robots.telegram.sendMessage(chatId, 'Erro ao gerar vídeo, encerrando operação')
            robots.telegram.sendMessage(chatId, makeVideoStatus.toString())
            return
        }
        robots.telegram.sendMessage(chatId, 'Segue o video:')

        robots.telegram.sendDocument(chatId, videoFilePath)
    }

    async function onBotHelp(msg, match){
        const chatId = msg.chat.id
        robots.telegram.sendMessage(chatId, 'Video Maker para telegram, programa código aberto disponibilizado em https://github.com/FabioNevesRezende/video-maker')
        robots.telegram.sendMessage(chatId, 'Comandos disponiveis: ')

        robots.telegram.sendMessage(chatId, '/help - mostra esta mensagem de ajuda ')
        robots.telegram.sendMessage(chatId, '/make <tema> - faz um vídeo sobre o <tema> escolhido ')

    }

    robots.telegram.onText(/\/make(.+)/, onBotMake)
    robots.telegram.onText(/\/help/, onBotHelp)


}

robot()
