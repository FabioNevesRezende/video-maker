
const TelegramBot = require( `node-telegram-bot-api` )
const state = require('./robots/state.js')
const token = require('./credentials/telegram.json')
const fs = require('fs')

async function loadState(){
  const content = state.load()
}


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
            //await robots.youtube()
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

    async function onBotText(msg, match){
        const chatId = msg.chat.id;
        const searchTerm = match[1]
        const prefixIndex = match[2]
        
        content.searchTerm = searchTerm
        content.prefix = prefixIndex // 
        content.queryId = robots.utils.uuidv4()
        state.save(content)
        robots.telegram.sendMessage(chatId, 'Certo, vou fazer um vídeo a respeito de: ' + searchTerm);
        makeVideoStatus = await makeVideo();
        if(makeVideoStatus)
            robots.telegram.sendMessage(chatId, 'Vídeo pronto');
        else{
            console.log('Error generating video, exiting...')
            return
        }


        content = state.load()


        const videoFilePath = './content/output.mp4'
        /*const videoFileSize = fs.statSync(videoFilePath).size
        const videoTitle = `${content.prefix} ${content.searchTerm}`
        const videoTags = [content.searchTerm, ...content.sentences[0].keywords]
        const videoDescription = content.sentences.map((sentence) => {
          return sentence.text
        }).join('\n\n')*/
    
        var videoCntnt = await fs.createReadStream(videoFilePath);
        robots.telegram.sendMessage(chatId, 'Segue o video:');

        const fileOptions = {
            // Explicitly specify the file name.
            filename: videoFilePath,
            // Explicitly specify the MIME type.
            contentType: 'video/mp4',
        };

        robots.telegram.sendDocument(chatId, videoFilePath);
        


    }

    robots.telegram.onText(/\/make (.+)/, onBotText) //


}

robot()
