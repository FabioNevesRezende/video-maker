
const token = require('../credentials/telegram.json')
const TelegramBot = require( `node-telegram-bot-api` )
const Robot = require('./robot.js')
const queue = require('./queue.js')
const utils = require('./utils.js')

class TelegramRobot extends Robot{
    constructor(name){
        super(name)
        this.say('Starting...')
        const tApi = new TelegramBot(token.token, { polling: true })
        this.nodeTelegramBotApi = tApi

        this. onMsgToTelegramUser = async function(chatId, msg){
            this.nodeTelegramBotApi.sendMessage(chatId, msg)
        }

        this.consumeQueueRequests = async function(){
            if(queue.queueRequests.length > 0)
                queue.queueTextRobot.push(queue.queueRequests.shift())
        }

        this.consumeQueueTextToTelegramUser = async function(instance){
            if(queue.queueTextToTelegramUser.length > 0){
                var msg = queue.queueTextToTelegramUser.shift()
                instance.onMsgToTelegramUser(msg.chatId, msg.msg)
            }
        }
        async function onBotMake(msg, match){
            const chatId = msg.chat.id
            const searchTerm = match[1].trim()
            const requestId = utils.uuidv4()

            queue.queueRequests.push({
                    chatId: chatId,
                    searchTerm: searchTerm,
                    requestId: requestId
            })

            queue.queueTextToTelegramUser.push({
                msg: `Certo, vou fazer um vídeo a respeito de: ${searchTerm}`,
                chatId: chatId}
            )
            
        }

        async function onBotHelp(msg, match){
            const chatId = msg.chat.id
            this.nodeTelegramBotApi.sendMessage(chatId, 'Video Maker para telegram, programa código aberto disponibilizado em https://github.com/FabioNevesRezende/video-maker')
            this.nodeTelegramBotApi.sendMessage(chatId, 'Comandos disponiveis: ')

            this.nodeTelegramBotApi.sendMessage(chatId, '/help - mostra esta mensagem de ajuda ')
            this.nodeTelegramBotApi.sendMessage(chatId, '/make <tema> - faz um vídeo sobre o <tema> escolhido ')

        }

        this.nodeTelegramBotApi.onText(/\/make(.+)/, onBotMake)
        this.nodeTelegramBotApi.onText(/\/help/, onBotHelp)

    }

    run = async function(){
        setInterval(this.consumeQueueRequests, 10);

        setInterval(this.consumeQueueTextToTelegramUser.bind(null, this), 10);

    }

}

module.exports = TelegramRobot