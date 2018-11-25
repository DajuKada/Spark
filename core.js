const DISCORD = require('discord.js');

// Import modules
const SUDO = require('./modules/sudo');
const PING = require('./modules/ping');

var MESSAGE = DISCORD.Message;
var CommandPrefix = '';
var ChannelNotification = '';
var Modules = [];

//
// Function is called once when the bot is connected
// Load all the module files in this function
//
function LoadModules() {
    RegisterLoadedModule(PING.Load());
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
    Modules.forEach(function (m) {
        if (m.close()) {
            console.log(m.signature + ' module has been closed');
        }
        else {
            console.error(m.signature + ' module could not be closed!');
        }
    });
    Modules = []; // Clear the modules array
}

//
// Function is called everytime the message starts with prefix
// Handles calling to other modules according to the command typed
//
function ProcessBotCommand(Message) {
    
    var args = Message.content.substring(1).split(' ');
    for (let i = 0; i < Modules.length; ++i) {
        if (Modules[i].signature == args[0]) {
            Modules[i].call(Message, args);
            return;
        }
    }
    Message.reply('Command not found!');
    return;

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

    StartUp: function (prefix, notification) {
        CommandPrefix = prefix;
        ChannelNotification = notification;
        LoadModules();
    },

    /*
     * @param {MESSAGE} Message
    */
    ProcessCommand: function (Message) {
        if (Message.content.startsWith(CommandPrefix) && Message.channel.id == ChannelNotification) {
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