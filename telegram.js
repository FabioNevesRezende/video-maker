const TelegramBot = require( `node-telegram-bot-api` )
const state = require('./robots/state.js')
const token = require('./credentials/telegram.json')

function robot(){
    console.log('> [telegram-robot] Starting...')

    const robots = {
        input: require('./robots/input.js'),
        text: require('./robots/text.js'),
        state: require('./robots/state.js'),
        image: require('./robots/image.js'),
        video: require('./robots/video.js'),
        youtube: require('./robots/youtube.js'),
        utils: require('./robots/utils.js'),
        telegram: new TelegramBot( token.token, { polling: true } )
    }

    var content = {
        maximumSentences: 7
    }

    async function makeVideo(){
        try{
            await robots.text()
            await robots.image()
            await robots.video()
            return true
        }
        catch(e)
        {   
            console.log('***** Objeto exception:')
            robots.utils.printaJson(e)
            console.log('*****')
            return false
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
        if(makeVideoStatus)
            robots.telegram.sendMessage(chatId, 'Vídeo pronto')
        else{
            robots.telegram.sendMessage(chatId, 'Erro ao gerar vídeo, encerrando operação')
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
