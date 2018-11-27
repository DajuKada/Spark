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

    Load: function (Register) {
        Register('ping', Process, Close, HelpMessage, 'Check the bot connection');
    }

}