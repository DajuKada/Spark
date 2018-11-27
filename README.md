## Spark Discord Bot

## Requirement
- [Node JS](https://nodejs.org/en/)
- [FFMPEG](https://www.ffmpeg.org/)

## Library
- [Discord JS](https://discord.js.org/)

## Setting up

- Create a directory named `config` in the root directory
- Create a file named `server.json` in the `config` directory and add the following
```json
{
    "token": "your_bot_token",
    "notification": "channel_id",
    "prefix": "your_desired_prefix_for_bot_command"
}
```


## Installing
- Run `install.sh` file in linux
- Run `install.ps1` or `install.bat` file in windows

## Running
- Run `run.sh` file in linux
- Run `run.ps1` or `run.bat` file in windows


## Adding new modules
- Create a new file in `modules` directory
- Import it in the file [main.js](./main.js) here::
```js
///// continuation
const CORE = require('./core');
const PING = require('./modules/ping');
const MUSIC = require('./modules/music');
const SUDO = require('./modules/sudo');
const MY_MODULE = require('./modules/my_module');
// your other modules
function StartUp() {
    PING.Load(CORE.Register);
    MUSIC.Load(CORE.Register);
    SUDO.Load(CORE.Register);
    MY_MODULE.Load(CORE.Register);
    // your other modules
}
///// continuation
```
- The basic template for module file is::
```js
const DISCORD = require('discord.js');

// When message with registered command is sent, this function is called
/*
    @Message: Message class from discordjs (https://discord.js.org/#/docs/main/stable/class/Message)
    @Args: Arguments passed with commands (e.g. if `!help ping pong` is sent, @Args is ['help', 'ping' , 'pong'])
*/
function Process(Message, Args) {
    Message.reply('pong!');
}

// When `help` command is called with the module name as argument
/*
    @Args: Arguments passed with commands (e.g. if `!help ping pong` is sent, @Args is ['help', 'ping' , 'pong'])
*/
function HelpMessage(Args) {
    return 'This is help for ping';
}

// Called when the bot is about to shutdown, save your stuffs to file!!
function Close() {
    // should return true if close is sucessfull
    return true;
}

module.exports = {

    // Called when the bot is started, load your saved files!!
    Load: function (Register) {
        // Use `Register` function to register "one" or "several" commands
        // Register (invocation_command, close_function, help_function, command_description)
        Register('ping', Process, Close, HelpMessage, 'Check the bot connection');
    }

}
```