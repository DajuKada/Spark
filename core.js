const DISCORD = require('discord.js');

var CommandPrefix = '';
var ChannelNotification = '';
var Modules = [];

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
                    if (!Modules[i].enabled) {
                        Message.channel.send('"' + args[1] + '" module is disabled!');
                        return;
                    }
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
            if (!Modules[i].enabled) {
                Message.channel.send('"' + args[0] + '" module is disabled!');
                return;
            }
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
        if (m.enabled) {
            module_string += m.signature + " = '" + m.description + "'\n";
        }
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
    },

    Register: function (signature, call, close, help, desc) {
        Modules.forEach(function (m) {
            if (m.signature == signature) {
                console.error(signature + ' could not be registered, because module with same signature already exists');
            }
        });
        Modules.push({
            signature: signature,
            enabled: true,
            call: call,
            close: close,
            help: help,
            description: desc
        });
        console.log(signature + ' has been registered');
    },

    Enable: function (name) {
        if (name == 'sudo') {
            return ('"sudo" module can\'t be disabled or enabled!');
        }
        for (dm = 0; dm < Modules.length; ++dm) {
            if (Modules[dm].signature == name) {
                if (Modules[dm].enabled) {
                    return ('"' + name + '" module is already enabled!');
                } else {
                    Modules[dm].enabled = true;
                    return ('"' + name + '" module enabled successfully!');
                }
            }
        }
        return ('"' + name + '" module doesn\'t exist!');
    },

    Disable: function (name) {
        if (name == 'sudo') {
            return ('"sudo" module can\'t be disabled or enabled!');
        }
        for (m = 0; m < Modules.length; ++m) {
            if (Modules[m].signature == name) {
                if (Modules[m].enabled) {
                    Modules[m].enabled = false;
                    return ('"' + name + '" module has been disabled!');
                } else {
                    return ('"' + name + '" module is already disabled!');
                }
            }
        }
        return ('"' + name + '" module doesn\'t exist!');
    },

    ProcessCommand: function (Message) {
        if (Message.content.startsWith(CommandPrefix) && Message.channel.id == ChannelNotification) {
            ProcessBotCommand(Message);
        }
        else {
            ProcessXPCommand(Message);
        }
    },

    ShutDown: function () {
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

}