const DISCORD = require('discord.js');

function Process(Message) {
    if (Message.member.roles.find(role => role.name == 'manager')) {
        Message.reply('You can use sudo');
    }
    else {
        Message.reply('You do not have permissions to use sudo commands');
    }
}

module.exports = {

    Load: function () {
        return {
            signature: 'sudo',
            call: Process,
            description: 'sudo command is for sudo users'
        };
    },

    Close: function () {
        return true;
    }

}