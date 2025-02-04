const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
 
const queue = require('./queue.js')
const Robot = require('./robot.js')

const nlu = new NaturalLanguageUnderstandingV1({
  iam_apikey: watsonApiKey,
  version: '2018-04-05',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
})

const state = require('./state.js')

class TextRobot extends Robot {
  constructor(name){
    super(name)
    this.say('Starting...')
    this.consumeQueueTextRobot = async function(instance){


      async function fetchContentFromWikipedia(content) {
        instance.say('Fetching content from Wikipedia')
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()

        content.sourceContentOriginal = wikipediaContent.content
        instance.say('Fetching done!')
      }

      function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

        content.sourceContentSanitized = withoutDatesInParentheses

        function removeBlankLinesAndMarkdown(text) {
          const allLines = text.split('\n')

          const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
            if (line.trim().length === 0 || line.trim().startsWith('=')) {
              return false
            }

            return true
          })

          return withoutBlankLinesAndMarkdown.join(' ')
        }
      }

      function removeDatesInParentheses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
      }

      function breakContentIntoSentences(content) {
        content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
          content.sentences.push({
            text: sentence,
            keywords: [],
            images: []
          })
        })
      }

      function limitMaximumSentences(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)
      }

      async function fetchKeywordsOfAllSentences(content) {
        instance.say('Starting to fetch keywords from Watson')

        for (const sentence of content.sentences) {
          instance.say(`Sentence: "${sentence.text}"`)

          sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)

          instance.say(`Keywords: ${sentence.keywords.join(', ')}\n`)
        }
      }

      async function fetchWatsonAndReturnKeywords(sentence) {
        return new Promise((resolve, reject) => {
          nlu.analyze({
            text: sentence,
            features: {
              keywords: {}
            }
          }, (error, response) => {
            if (error) {
              reject(error)
              return
            }

            const keywords = response.keywords.map((keyword) => {
              return keyword.text
            })

            resolve(keywords)
          })
        })
      }

      if(queue.queueTextRobot.length > 0){

        var content = queue.queueTextRobot.shift()

        await fetchContentFromWikipedia(content)
        sanitizeContent(content)
        breakContentIntoSentences(content)
        limitMaximumSentences(content)
        await fetchKeywordsOfAllSentences(content)

        queue.queueImageRobot.push(content)
      }
    }
  }

  run = async function(){
    setInterval(this.consumeQueueTextRobot.bind(null, this), 10);

  }
}

module.exports = TextRobot
