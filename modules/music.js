const DISCORD = require('discord.js');
const PLAYER = require('ytdl-core');

var ConnectedVoiceChannel = null;

function JoinVoiceChannel(Message) {
    if (ConnectedVoiceChannel) {
        if (ConnectedVoiceChannel == Message.member.voiceChannel) {
            Message.reply('I am already in the voice channel!');
        }
        else {
            Message.reply('I am already connected to the voice channel: :speaker:' +
                ConnectedVoiceChannel.name +
                '. Please connect to this channel.');
        }
        return;
    }

    voiceChannel = Message.member.voiceChannel;
    if (voiceChannel) {
        if (voiceChannel.joinable) {
            voiceChannel.join();
            ConnectedVoiceChannel = voiceChannel;
        } else {
            Message.reply('I don\'t have permissions to join that voice channel');
        }
    } else {
        Message.reply('you must connect to a voice channel first');
    }
}

function LeaveVoiceChannel(Message) {
    if (ConnectedVoiceChannel) {
        if (ConnectedVoiceChannel == Message.member.voiceChannel) {
            ConnectedVoiceChannel.leave();
            ConnectedVoiceChannel = null;
        } else {
            Message.reply('you are not connected to the voice channel that I am in!');
        }
    } else {
        Message.reply('I am not connected to any voice channel!');
    }
}

function Process(Message, Args) {

    firstArg = Args[1];
    switch (firstArg) {
        case 'join': // join the voice channel that the caller is on and have permission
            {
                JoinVoiceChannel(Message);
            } break;

        case 'leave': // leave the voice channel if connected to one
            {
                LeaveVoiceChannel(Message);
            } break;

        case 'play': // search for music in youtube or play the selected music from search result if -1
            {
                if (!ConnectedVoiceChannel) {
                    JoinVoiceChannel(Message);
                    if (!ConnectedVoiceChannel) {
                        return;
                    }
                }

                ytlink = Args[2];
                if (ytlink[0] == '<') {
                    ytlink = ytlink.substr(1, ytlink.length - 1);
                }
                const stream = PLAYER(ytlink, { filter: 'audioonly' });
                streamOptions = { seek: 0, volume: 1 };
                ConnectedVoiceChannel.connection.playStream(stream, streamOptions);
            } break;


        case 'pause': // pause the player if playing
            {

            } break;
        case 'save': // save the current playing list
            {

            } break;
        case 'load': // load the saved playlist if present
            {

            } break;
        case 'skipf': // skip the player forwards
            {

            } break;
        case 'skipb': // skip the player backwards
            {

            } break;
        case 'repeat': // mode can be either 'all', 'none', 'one'
            {

            } break;
        case 'list': // shows all music in currently playing playlist
            {

            } break;
        case 'now': // shows currently playing song
            {

            } break;

        default: // error! show list of all possible commands for music player
            {

            } break;
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