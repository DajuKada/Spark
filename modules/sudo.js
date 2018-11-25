const DISCORD = require('discord.js');

function Process(Message, Args) {
    if (Message.member.roles.find(role => role.name == 'manager')) {
        Message.reply('You can use sudo');
    }
    else {
        Message.reply('You do not have permissions to use sudo commands');
    }
}

function HelpMessage(Args) {
    return 'This is help for sudo command';
}

function Close() {
    return true;
}

module.exports = {

    Load: function () {
        return {
            signature: 'sudo',
            call: Process,
            close: Close,
            help: HelpMessage,
            description: 'sudo command is for sudo users'
        };
    }

}