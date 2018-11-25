const DISCORD = require('discord.js');

var MESSAGE = DISCORD.Message;
var CommandPrefix = '';
var Modules = [];

//
// Function is called once when the bot is connected
// Load all the module files in this function
//
function LoadModules() {

}

//
// Function is called once when the bot is disconnected
// Save and close all the module files in this function
//
function CloseModules() {

}

//
// Function is called everytime the message starts with prefix
// Handles calling to other modules according to the command typed
//
function ProcessBotCommand(Message) {

    var args = Message.content.substring(1).split(' ');
    switch(args[0])
    {
        case 'ping':
        {
            Message.reply('pong');
        } break;

        case 'sudo':
        {
            if(Message.member.roles.find(role => role.name == 'manager')) {
                Message.reply('You can use sudo');
            }
            else {
                Message.reply('You do not have permissions to use sudo commands');
            }
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