// Core discord js
const Discord = require('discord.js');
const client = new Discord.Client();

// Other dependencies
const fs = require('fs');
var _ = require('c-struct');


// Globals
var discord_prams = new _.Schema({ token: _.type.string(), prefix: _.type.string(1) });

// Setting up configurations
var __botConfig = JSON.parse(fs.readFileSync('config/server.json', 'utf-8'));
discord_prams.token = __botConfig.token;
discord_prams.prefix = __botConfig.prefix;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.content === discord_prams.prefix + 'ping') {
        msg.reply('pong');
    }
});

client.login(discord_prams.token);