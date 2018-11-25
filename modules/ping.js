const DISCORD = require('discord.js');

function Process(Message, Args) {
    Message.reply('pong!');
}

function Close() {
    return true;
}

module.exports = {

    Load: function() {
        return {
            signature: 'ping',
            call: Process,
            close: Close,
            description: 'Check the bot connection'
        };
    }

}