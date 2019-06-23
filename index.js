const OutputRobot = require('./robots/output.js')
const TextRobot = require('./robots/text.js')
const ImageRobot = require('./robots/image.js');
const VideoRobot = require('./robots/video.js');
const TelegramRobot = require('./robots/telegram.js');

const robots = {
    input: require('./robots/input.js'),
    text: new TextRobot('text-robot'),
    state: require('./robots/state.js'),
    image: new ImageRobot('image-robot'),
    video: new VideoRobot('video-robot'),
    youtube: require('./robots/youtube.js'),
    utils: require('./robots/utils.js'),
    queue: require('./robots/queue.js'),
    output: new OutputRobot('output-robot'),
    telegram: new TelegramRobot('telegram-robot')
}

async function start() {
  robots.output.run()
  robots.telegram.run()
  await robots.text.run()
  await robots.image.run()
  await robots.video.run()
  //await robots.youtube()
}

start()