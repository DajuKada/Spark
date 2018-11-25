// Core discord js
const DISCORD = require('discord.js');
const BOT = new DISCORD.Client();

// Other dependencies
const FS = require('fs');
const STRUCT = require('c-struct');


// Globals
var DiscordParms = new STRUCT.Schema(
    { 
        token: STRUCT.type.string(), 
        prefix: STRUCT.type.string(1),
        ready: STRUCT.type.u8(0) 
    }
);

// Setting up configurations
var __botConfig = JSON.parse(FS.readFileSync('config/server.json', 'utf-8'));
DiscordParms.token = __botConfig.token;
DiscordParms.prefix = __botConfig.prefix;

// Bot shutting down
if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function() {
        process.emit("SIGINT");
    });
}
process.on("SIGINT", function() {
    console.log("Disconnecting bot..")
    
    process.exit();
});

// Bot connection
BOT.on('ready', () => {
    console.log(`Logged in as ${BOT.user.tag}!`);

    // Bot is ready
    DiscordParms.ready = 1;
});

BOT.on('message', Msg => {
    // Don't process the message if it is from bot
    if(Msg.author.bot)
        return;

    if (Msg.content === DiscordParms.prefix + 'ping') {
        Msg.reply('pong');
    }
});

BOT.login(DiscordParms.token);