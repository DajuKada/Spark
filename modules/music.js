const DISCORD = require('discord.js');

function Process(Message, Args) {

    firstArg = Args[1];
    switch (firstArg) {
        case 'join': // join the voice channel that the caller is on and have permission
            {

            } break;
        case 'leave': // leave the voice channel if connected to one
            {

            } break;
        case 'play': // search for music in youtube or play the selected music from search result if -1
            {

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