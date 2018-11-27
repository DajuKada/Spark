const DISCORD = require('discord.js');
const FS = require('fs');

var __sudoConfig = JSON.parse(FS.readFileSync('config/sudo.json', 'utf-8'));
const AnnouncementChannel = __sudoConfig.announcement_channel;
const ManagementChannel = __sudoConfig.management_channel;
const SudoUser = __sudoConfig.sudo_user;

// Management (sudo methods)
function ProcessSudo(Message, Args) {

    if (!Message.member.roles.find(role => role.name == SudoUser)) {
        Message.reply('you do not have permissions to use sudo commands');
        return;
    }

    firstArg = Args[1];
    if (!firstArg) {
        Message.reply('You are authorized to use sudo commands!');
        return;
    }

    switch (firstArg) {
        case 'announce':
            {
                channel = Message.client.channels.find(val => val.id == AnnouncementChannel);
                if (channel) {
                    announcement = Message.content.substr('.sudo announce '.length);
                    //announcement = '@everyone \n' + announcement;
                    channel.send(announcement);
                }
            } break;

        default:
            {
                Message.reply('this sudo command is not present in the module');
            } break;
    }

}

function SudoHelpMessage(Args) {
    return '```md\n# sudo\nThis command is reserved for managers of the server for maintaining the server.```';
}

function SudoClose() {
    return true;
}

function ProcessManageMessage(Message, Args) {
    
    username = Message.author.username + '(' + Message.author.discriminator + ')';
    message = Message.content.substr('.manager '.length);
    channel = Message.client.channels.find(val => val.id == ManagementChannel);
    if(channel) {
        mention = 'manager, ';
        //mention = '<@&' + Message.guild.roles.find(m=> m.name == SudoUser).id + '> ';
        channel.send(mention + 'User::' + username + 'has sent a message::\n' + message);
        Message.author.send('Your message has been sucessfully been sent!');
        Message.delete();
        return;
    }
    else {
        Message.author.send('Your message could not be sent, please report this problem to the server manager');
        Message.delete();
        return;
    }

}

function ManageHelpMessage(Args) {
    return '```md\n# manager::\nThis command will send a copy of your message to all the managers and then your original message will be removed!\n' +
        'Use this command to send message to all managers without disturbing them.```';
}

function ManageClose() {
    return true;
}

module.exports = {

    Load: function (Register) {
        Register('sudo', ProcessSudo, SudoClose, SudoHelpMessage, 'sudo command is for managers');
        Register('manager', ProcessManageMessage, ManageClose, ManageHelpMessage, 'Send message to all managers');
    }

}