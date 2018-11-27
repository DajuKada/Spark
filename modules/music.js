const DISCORD = require('discord.js');

function Process(Message, Args) {
    if (Args[1] == 'join') {
        if (Message.member.voiceChannel) {
            if (!Message.member.voiceChannel.joinable) {
                Message.reply('I do not have permissions in the voice channel you connected!');
            }
            else {
                Message.member.voiceChannel.join()
                    .then(Message.reply('You are connected to music voice channel!'));
            }
        }
        else {
            Message.reply('You must be connected to `music` voice channel');
        }
    }
    else {
        Message.reply('Error in arguments');
    }
}

function HelpMessage(Args) {
    return 'This is help for music!';
}

function Close() {
    return true;
}

module.exports = {

    Load: function (Register) {
        Register('player', Process, Close, HelpMessage, 'Control the music player of the server');
    }

}