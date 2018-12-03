const DISCORD = require('discord.js');

function Process(Message, Args) {
    Message.reply('pong!');
}

function HelpMessage(Args) {
    return '```md\n# ping\n Use this command to check my connection, I\'ll reply with **ping** if I can receive your message!\n```';
}

function Close() {
    return true;
}

module.exports = {

    Load: function (Register) {
        Register('ping', Process, Close, HelpMessage, 'Check the bot connection');
    }

}
