const DISCORD = require('discord.js');

// Import modules
const SUDO = require('./modules/sudo');

var MESSAGE = DISCORD.Message;
var CommandPrefix = '';
var Modules = [];

//
// Function is called once when the bot is connected
// Load all the module files in this function
//
function LoadModules() {
    RegisterLoadedModule(SUDO.Load());
}

function RegisterLoadedModule(module) {
    Modules.forEach(function (m) {
        if (m.signature == module.signature) {
            console.error(module.signature + ' could not be registered, because module with same signature already exists');
        }
    });
    Modules.push(module);
    console.log(module.signature + ' has been registered');
}

//
// Function is called once when the bot is disconnected
// Save and close all the module files in this function
//
function CloseModules() {
    SUDO.Close();
}

//
// Function is called everytime the message starts with prefix
// Handles calling to other modules according to the command typed
//
function ProcessBotCommand(Message) {

    var args = Message.content.substring(1).split(' ');
    switch (args[0]) {
        case 'ping':
            {
                Message.reply('pong');
            } break;

        case 'sudo':
            {
                Modules[0].call(Message);
            } break;

        default:
            {
                Message.reply('Command not found');
            }
    }

    if (Message.content == CommandPrefix + 'join') {
        if (Message.member.voiceChannel) {
            if (!Message.member.voiceChannel.joinable) {
                Message.reply('I do not have permissions in the voice channel you connected!');
            }
            else {
                Message.member.voiceChannel.join()
                    .then(connection => console.log('Connected!'))
                    .catch(console.error);
                Message.reply('You are connected to music voice channel!');
            }
        }
        else {
            Message.reply('You must be connected to `music` voice channel');
        }
    }

}


//
// Function is called everytime user sends some messages
// Handles giving XP to the users
//
function ProcessXPCommand(Message) {

}

module.exports = {

    StartUp: function (prefix) {
        CommandPrefix = prefix;
        LoadModules();
    },

    /*
     * @param {MESSAGE} Message
    */
    ProcessCommand: function (Message) {
        if (Message.content.startsWith(CommandPrefix)) {
            ProcessBotCommand(Message);
        }
        else {
            ProcessXPCommand(Message);
        }
    },

    ShutDown: function () {
        CloseModules();
    }

}