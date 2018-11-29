// Core discord js
const DISCORD = require('discord.js');
const BOT = new DISCORD.Client();

// Other dependencies
const FS = require('fs');
const STRUCT = require('c-struct');

// Implemented files
const CORE = require('./core');
const PING = require('./modules/ping');
const MUSIC = require('./modules/music');
const SUDO = require('./modules/sudo');

function StartUp() {
    PING.Load(CORE.Register);
    MUSIC.Load(CORE.Register);
    SUDO.Load(CORE.Register);
}

// Globals
var DiscordParms = new STRUCT.Schema(
    {
        token: STRUCT.type.string(),
        notification: STRUCT.type.string(),
        prefix: STRUCT.type.string(),
        ready: STRUCT.type.u8(0)
    }
);

// Setting up configurations
var __botConfig = JSON.parse(FS.readFileSync('config/server.json', 'utf-8'));
DiscordParms.token = __botConfig.token;
DiscordParms.notification = __botConfig.notification;
DiscordParms.prefix = __botConfig.prefix;

// Bot shutting down
if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}
process.on("SIGINT", function () {
    console.log("Disconnecting bot..")
    CORE.ShutDown();
    process.exit();
});

// Bot connection
BOT.on('ready', () => {
    if (DiscordParms.ready == 1) {
        console.log("Reconnected!");
        return;
    }

    console.log(`Logged in as ${BOT.user.tag}!`);

    CORE.StartUp(DiscordParms.prefix, DiscordParms.notification);
    StartUp();

    // Bot is ready
    console.log('Prefix for the command set as : ' + DiscordParms.prefix);
    console.log('Notification channel has been set as "' +
        BOT.channels.find(val => val.id == DiscordParms.notification).name +
        '" of id : ' + DiscordParms.notification);
    DiscordParms.ready = 1;
});


// When new member arrives send this message
BOT.on('guildAddMember', member => {
    member.send('Welcome to the server,' + `${member}` +
        '. Please goto #welcome channel for more info on the server.' +
        'Also you can call me any time with the command `!help` from #bot in the server! Enjoy!!');
});

BOT.on('message', msg => {
    // Don't process the message if it is from bot
    if (msg.author.bot)
        return;
    CORE.ProcessCommand(msg);
});

BOT.login(DiscordParms.token);