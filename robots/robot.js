var queue = require('./queue.js')

class Robot{
    constructor(name){
        this.name = name
    }
}

Robot.prototype.say = function(something){
    queue.queueText.push(`> [${this.name}] ${something}`)
}

module.exports = Robot