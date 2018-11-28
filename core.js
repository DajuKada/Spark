const DISCORD = require('discord.js');

var CommandPrefix = '';
var ChannelNotification = '';
var Modules = [];
var DisabledModules = [];

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
                    if (IsModuleDisabled(Modules[i].signature)) {
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
            if (IsModuleDisabled(Modules[i].signature)) {
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
        module_string += m.signature + " = '" + m.description + "'\n";
    });
    module_string += '```\nType `!help <module_name>` to get help for specific module.';
    return module_string;
}

function IsModuleDisabled(name) {
    result = false;
    DisabledModules.forEach(function (modName) {
        if (modName == name) {
            result = true;
        }
    });
    return result;
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

    Register: function (sign, call, close, help, desc) {
        Modules.forEach(function (m) {
            if (m.signature == sign) {
                console.error(sign + ' could not be registered, because module with same signature already exists');
            }
        });
        Modules.push({
            signature: sign,
            call: call,
            close: close,
            help: help,
            description: desc
        });
        console.log(sign + ' has been registered');
    },

    Enable: function (name) {
        for (dm = 0; dm < DisabledModules.length; ++dm) {
            if (dm.sign == name) {
                DisabledModules.pop(dm);
                return ('"' + name + '" module enabled successfully!');
            }
        }
        return ('"' + name + '" module either doesn\'t exist or is already enabled!');
    },

    Disable: function (name) {
        for (dm = 0; dm < DisabledModules.length; ++dm) {
            if (dm.sign == name) {
                return ('"' + name + '" module is already disabled!');
            }
        }
        for (m = 0; m < Modules.length; ++m) {
            if (dm.sign == name) {
                DisabledModules.push(name);
                return ('"' + name + '" module has been disabled!');
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