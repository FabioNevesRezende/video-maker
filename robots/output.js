var queue = require('./queue')
const Robot = require('./robot.js')

class OutputRobot extends Robot{
    constructor(name){
        super(name)
        this.say('Starting...')
    }

    run = async function(){

        setInterval(
            async function consumeTextQueue(){
                if(queue.queueText.length > 0)
                    console.log(queue.queueText.shift())
            }, 
            10
        );

    }
}

module.exports = OutputRobot
