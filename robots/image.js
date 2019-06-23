const imageDownloader = require('image-downloader')
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')
const utils = require('./utils.js')
const queue = require('./queue.js')
const Robot = require('./robot')

const googleSearchCredentials = require('../credentials/google-search.json')

class ImageRobot extends Robot {
  constructor(name){
    super(name)
    this.say('Starting...')
  }

  run = async function(){
    setInterval(
      async function consumeQueueTextRobot(){
          if(queue.queueImageRobot.length > 0){
              var content = queue.queueImageRobot.shift()

              await fetchImagesOfAllSentences(content)
              await downloadAllImages(content)

              queue.queueVideoRobot.push(content)

              async function fetchImagesOfAllSentences(content) {
                for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
                  let query

                  if (sentenceIndex === 0) {
                    query = `${content.searchTerm}`
                  } else {
                    query = `${content.searchTerm} ${content.sentences[sentenceIndex].keywords[0]}`
                  }

                  this.say(`> [image-robot] Querying Google Images with: "${query}"`)

                  content.sentences[sentenceIndex].images = await fetchGoogleAndReturnImagesLinks(query)
                  content.sentences[sentenceIndex].googleSearchQuery = query
                }
              }

              async function fetchGoogleAndReturnImagesLinks(query) {
                const response = await customSearch.cse.list({
                  key: googleSearchCredentials.apiKey,
                  cx: googleSearchCredentials.searchEngineId,
                  q: query,
                  searchType: 'image',
                  num: 2
                })
                if(response.data.items){
                  const imagesUrl = response.data.items.map((item) => {
                    return item.link
                  })

                  return imagesUrl
                }
                else{
                  throw `Nenhuma imagem encontrada para: ${content.searchTerm}`;
                }
              }

              async function downloadAllImages(content) {
                content.downloadedImages = []

                for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
                  const images = content.sentences[sentenceIndex].images

                  for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
                    const imageUrl = images[imageIndex]

                    try {
                      if (content.downloadedImages.includes(imageUrl)) {
                        throw new Error('Image already downloaded')
                      }

                      await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)
                      content.downloadedImages.push(imageUrl)
                      this.say(`[${sentenceIndex}][${imageIndex}] Image successfully downloaded: ${imageUrl}`)
                      break
                    } catch(error) {
                      this.say(`[${sentenceIndex}][${imageIndex}] Error (${imageUrl}): ${error}`)
                    }
                  }
                }
              }

              async function downloadAndSave(url, fileName) {
                return imageDownloader.image({
                  url: url,
                  dest: `./content/${fileName}`
                })
              }
          }
      }, 
    10
    );
  }

}

module.exports = ImageRobot
