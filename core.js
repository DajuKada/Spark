const DISCORD = require('discord.js');

// Import modules
const SUDO = require('./modules/sudo');
const PING = require('./modules/ping');
const MUSIC = require('./modules/music');

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
    RegisterLoadedModule(MUSIC.Load());
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

    // Help commands
    if (args[0] == 'help') {
        let help_msg = 'Module could not be found. Type `!help` to get a list of all modules';
        if (args[1]) {
            for (let i = 0; i < Modules.length; ++i) {
                if (Modules[i].signature == args[1]) {
                    help_msg = Modules[i].help(args);
                    break;
                }
            }
        }
        else {
            help_msg = GetStringOfModulesList();
        }
        Message.channel.send(help_msg);
        return;
    }

    // Other modules
    for (let i = 0; i < Modules.length; ++i) {
        if (Modules[i].signature == args[0]) {
            Modules[i].call(Message, args);
            return;
        }
    }
    Message.reply('Command not found!');
    return;
}

function GetStringOfModulesList() {
    let module_string = '```py\n# Here are the lists of modules::\n';
    Modules.forEach(function (m) {
        module_string += m.signature + " = '" + m.description + "'\n";
    });
    module_string += '```\nType `!help <module_name>` to get help for specific module.';
    return module_string;
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