const DISCORD = require('discord.js');

function Process(Message, Args) {
    Message.reply('pong!');
}

function HelpMessage(Args) {
    return 'This is help for ping';
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
            help: HelpMessage,
            description: 'Check the bot connection'
        };
    }

}