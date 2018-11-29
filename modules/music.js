const DISCORD = require('discord.js');
const YTDL = require('ytdl-core');
const EVENTS = require('events');

const LoadOptions = { quality: 'highestaudio', filter: 'audioonly' };
const StreamOptions = { seek: 0, volume: 1 };

var ConnectedVoiceChannel = null;
var CurrentPlaylist = [];
var CurrentMusicIndex = null;
var CurrentDispatcher = null;
var PlayerEventEmitter = new EVENTS.EventEmitter();
var PlayerMode = 'none';

const MusicCommands = {
    "join": { "cmd": "join", "desc": "Join a voice channel" },
    "leave": { "cmd": "leave", "desc": "Leave the voice channel" },
    "play": { "cmd": "play", "desc": "Play music by loading from youtube" },
    "pause": { "cmd": "pause", "desc": "Pauses the player" },
    "resume": { "cmd": "resume", "desc": "Resumes the player" },
    "save": { "cmd": "save", "desc": "Saves the current playlist" },
    "clear": { "cmd": "clear", "desc": "Removes all music from the current playlist" },
    "load": { "cmd": "load", "desc": "Loads a playlist from saved playlists" },
    "playlists": { "cmd": "playlists", "desc": "Displays all saved playlists" },
    "skipf": { "cmd": "skipf", "desc": "Plays previous music in the playlist" },
    "skipb": { "cmd": "skipb", "desc": "Plays next music in the playlist" },
    "seek": { "cmd": "seek", "desc": "Plays the music at given index" },
    "repeat": { "cmd": "repeat", "desc": "Sets player repeat mode" },
    "list": { "cmd": "list", "desc": "Lists 5 music in the playlist page by page" },
    "now": { "cmd": "now", "desc": "Shows the currently playing music" }
};

function GetCompiledCommandListWithDesc() {
    all_music_cmds = '```py\n# Music help\n';
    all_music_cmds += MusicCommands.join.cmd + " = '" + MusicCommands.join.desc + "'\n";
    all_music_cmds += MusicCommands.leave.cmd + " = '" + MusicCommands.leave.desc + "'\n";
    all_music_cmds += MusicCommands.play.cmd + " = '" + MusicCommands.play.desc + "'\n";
    all_music_cmds += MusicCommands.pause.cmd + " = '" + MusicCommands.pause.desc + "'\n";
    all_music_cmds += MusicCommands.resume.cmd + " = '" + MusicCommands.resume.desc + "'\n";
    all_music_cmds += MusicCommands.save.cmd + " = '" + MusicCommands.save.desc + "'\n";
    all_music_cmds += MusicCommands.clear.cmd + " = '" + MusicCommands.clear.desc + "'\n";
    all_music_cmds += MusicCommands.load.cmd + " = '" + MusicCommands.load.desc + "'\n";
    all_music_cmds += MusicCommands.playlists.cmd + " = '" + MusicCommands.playlists.desc + "'\n";
    all_music_cmds += MusicCommands.skipf.cmd + " = '" + MusicCommands.skipf.desc + "'\n";
    all_music_cmds += MusicCommands.skipb.cmd + " = '" + MusicCommands.skipb.desc + "'\n";
    all_music_cmds += MusicCommands.seek.cmd + " = '" + MusicCommands.seek.desc + "'\n";
    all_music_cmds += MusicCommands.repeat.cmd + " = '" + MusicCommands.repeat.desc + "'\n";
    all_music_cmds += MusicCommands.list.cmd + " = '" + MusicCommands.list.desc + "'\n";
    all_music_cmds += MusicCommands.now.cmd + " = '" + MusicCommands.now.desc + "'\n";
    all_music_cmds += '```'
    return all_music_cmds;
}

function JoinVoiceChannel(Message) {
    if (ConnectedVoiceChannel) {
        if (ConnectedVoiceChannel == Message.member.voiceChannel) {
            Message.reply('I am already in the voice channel!');
        }
        else {
            Message.reply('I am already connected to the voice channel: :speaker:' +
                ConnectedVoiceChannel.name +
                '. Please connect to this channel.');
        }
        return;
    }

    voiceChannel = Message.member.voiceChannel;
    if (voiceChannel) {
        if (voiceChannel.joinable) {
            voiceChannel.join();
            ConnectedVoiceChannel = voiceChannel;
        } else {
            Message.reply('I don\'t have permissions to join that voice channel');
        }
    } else {
        Message.reply('you must connect to a voice channel first');
    }
}

function LeaveVoiceChannel(Message) {
    if (ConnectedVoiceChannel) {
        if (ConnectedVoiceChannel == Message.member.voiceChannel) {
            ConnectedVoiceChannel.leave();
            ConnectedVoiceChannel = null;
        } else {
            Message.reply('you are not connected to the voice channel that I am in!');
        }
    } else {
        Message.reply('I am not connected to any voice channel!');
    }
}

function ClearPlaylist() {
    CurrentPlaylist = [];
}

function Play() {
    const stream = YTDL(CurrentPlaylist[CurrentMusicIndex].url, LoadOptions);
    dispatcher = ConnectedVoiceChannel.connection.playStream(stream, StreamOptions);
    CurrentDispatcher = dispatcher;
    dispatcher.on('end', function (reason) {
        if (reason == 'skipping') {
            CurrentDispatcher = null;
            return;
        }

        if (PlayerMode != 'one') {
            CurrentMusicIndex += 1;
        }
        if (CurrentPlaylist[CurrentMusicIndex]) {
            PlayerEventEmitter.emit('change_music');
        } else {
            if (PlayerMode == 'none' || PlayerMode == 'one') {
                CurrentDispatcher = null;
                CurrentMusicIndex = null;
                ClearPlaylist();
            } else if (PlayerMode == 'all') {
                CurrentMusicIndex = 0;
                PlayerEventEmitter.emit('change_music');
            }
        }
    });
}
PlayerEventEmitter.on('change_music', Play);

function GetNowPlaying() {
    now_playing = '```md\n# Now Playing [Mode: Repeat ' + PlayerMode + ']\n';
    now_playing += CurrentPlaylist[CurrentMusicIndex].title + '\n```';
    return now_playing;
}

function Pause() {
    if (CurrentDispatcher) {
        if (CurrentDispatcher.paused) {
            // already paused
        } else {
            CurrentDispatcher.pause();
        }
        return true;
    } else {
        return false;
    }
}

function Resume() {
    if (CurrentDispatcher) {
        if (CurrentDispatcher.paused) {
            CurrentDispatcher.resume();
        }
        return true;
    } else {
        return false;
    }
}

function Process(Message, Args) {

    firstArg = Args[1];
    switch (firstArg) {
        case MusicCommands.join.cmd: // join the voice channel that the caller is on and have permission
            {
                JoinVoiceChannel(Message);
            } break;

        case MusicCommands.leave.cmd: // leave the voice channel if connected to one
            {
                LeaveVoiceChannel(Message);
            } break;

        case MusicCommands.play.cmd: // search for music in youtube or play the selected music from search result if -1
            {
                if (!ConnectedVoiceChannel) {
                    JoinVoiceChannel(Message);
                    if (!ConnectedVoiceChannel) {
                        return;
                    }
                }

                // TODO(Zero): Search youtube for music
                ytlink = Args[2];
                if (!ytlink && CurrentPlaylist.length > 0) {
                    if (Resume()) {
                        Message.channel.send(':arrow_forward: Player resumed!');
                    }
                    return;
                }

                if (ytlink[0] == '<') {
                    ytlink = ytlink.substr(1, ytlink.length - 1);
                }

                if (YTDL.validateURL(ytlink)) {
                    YTDL.getInfo(ytlink, (err, info) => {
                        if (err) return console.log('Error in player play command!');
                        CurrentPlaylist.push({ title: info.title, url: ytlink });
                        if (CurrentPlaylist.length == 1) {
                            CurrentMusicIndex = 0;
                            Play();
                            Message.channel.send('```md\n# Playing \n' + CurrentPlaylist[0].title + '```');
                        } else {
                            Message.channel.send('```md\n# Added song \n' + CurrentPlaylist[CurrentPlaylist.length - 1].title + '```');
                        }
                    });
                } else {
                    Message.channel.send(':negative_squared_cross_mark: Error, youtube link is not accessible');
                }

            } break;

        case MusicCommands.pause.cmd: // pause the player if playing
            {
                if (Pause()) {
                    Message.channel.send(':pause_button: Player paused!');
                }
            } break;

        case MusicCommands.resume.cmd: // resumes the player if plaused
            {
                if (Resume()) {
                    Message.channel.send(':arrow_forward: Player resumed!');
                }
            } break;

        case MusicCommands.save.cmd: // save the current playing list
            {

            } break;

        case MusicCommands.clear.cmd: // clear the musics in the current playlist
            {
                if (ConnectedVoiceChannel && Message.member.voiceChannel == ConnectedVoiceChannel) {
                    ClearPlaylist();
                    Message.channel.send(':ballot_box_with_check: Current Playlist has been cleared!');
                } else {
                    Message.reply('you are not connected to any voice channels!');
                }
            } break;

        case MusicCommands.load.cmd: // load the saved playlist if present
            {

            } break;

        case MusicCommands.playlists.cmd: // display all saved playlist
            {

            } break;

        case MusicCommands.skipf.cmd: // skip the player forwards
            {
                ++CurrentMusicIndex;
                if (CurrentMusicIndex > (CurrentPlaylist.length - 1)) {
                    CurrentMusicIndex = 0;
                }
                CurrentDispatcher.end('skipping');
                Play();
                Message.channel.send(GetNowPlaying());
            } break;

        case MusicCommands.skipb.cmd: // skip the player backwards
            {
                --CurrentMusicIndex;
                if (CurrentMusicIndex < 0) {
                    CurrentMusicIndex = CurrentPlaylist.length - 1;
                }
                CurrentDispatcher.end('skipping');
                Play();
                Message.channel.send(GetNowPlaying());
            } break;

        case MusicCommands.seek.cmd: // seek at given index
            {
                if (Args[2]) {
                    index = parseInt(Args[2]);
                    if (index == NaN) {
                        Message.reply('please specify an index from 1 to ' + CurrentPlaylist.length.toString());
                    } else {
                        if ((index < 1) || (index > CurrentPlaylist.length)) {
                            Message.reply('index must range from 1 to ' + CurrentPlaylist.length.toString());
                        } else {
                            CurrentMusicIndex = index - 1;
                            CurrentDispatcher.end('skipping');
                            Play();
                            Message.channel.send(GetNowPlaying());
                        }
                    }
                } else {
                    Message.reply('please specify an index from 0 to ' + (CurrentPlaylist.length - 1).toString());
                }
            } break;

        case MusicCommands.repeat.cmd: // mode can be either 'all', 'none', 'one'
            {
                mode = Args[2];
                if (mode == 'all') {
                    PlayerMode = 'all';
                } else if (mode == 'one') {
                    PlayerMode = 'one';
                } else if (mode == 'none') {
                    PlayerMode = 'none';
                }
                Message.channel.send(':musical_note: Player Repeat mode: **' + PlayerMode + '**');
            } break;

        case MusicCommands.list.cmd: // shows all music in currently playing playlist
            {
                if (CurrentPlaylist.length == 0) {
                    Message.channel.send(':negative_squared_cross_mark: No songs playing :negative_squared_cross_mark:');
                    return;
                }
                music_list = '```md\n# Music List [Mode: Repeat ' + PlayerMode + ']\n';
                CurrentPlaylist.forEach(m => {
                    music_list += '- ' + m.title + '\n';
                });
                music_list += '```';
                Message.channel.send(music_list);
            } break;

        case MusicCommands.now.cmd: // shows currently playing song
            {
                if (!CurrentPlaylist[CurrentMusicIndex]) {
                    Message.channel.send(':negative_squared_cross_mark: No songs playing :negative_squared_cross_mark:');
                    return;
                }
                Message.channel.send(GetNowPlaying());
            } break;

        default: // error! show list of all possible commands for music player
            {
                error_help = 'Error: **' + firstArg + '** is not present in **player** module, here are the lists of commands:\n' + GetCompiledCommandListWithDesc();
                Message.channel.send(error_help);
            } break;
    }
}

function HelpMessage(Args) {
    if (Args[2]) {
        music_cmd_desc = '```md\n# player ';
        switch (Args[2]) {
            case MusicCommands.join.cmd:
                music_cmd_desc += MusicCommands.join.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.join.desc + '\n';
                music_cmd_desc += '- Syntax: **player join** after joining a voice channel.\n```';
                return music_cmd_desc;

            case MusicCommands.leave.cmd:
                music_cmd_desc += MusicCommands.leave.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.join.desc + '\n';
                music_cmd_desc += '- Syntax: **player leave** if I have joined a voice channel.\n```';
                return music_cmd_desc;

            case MusicCommands.play.cmd:
                music_cmd_desc += MusicCommands.play.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.play.desc + '\n';
                music_cmd_desc += '- Syntax: **player play [link | name of music]** \n```';
                return music_cmd_desc;

            case MusicCommands.pause.cmd:
                music_cmd_desc += MusicCommands.pause.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.pause.desc + '\n';
                music_cmd_desc += '- Syntax: **player pause** when the player is playing music.\n```';
                return music_cmd_desc;

            case MusicCommands.resume.cmd:
                music_cmd_desc += MusicCommands.resume.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.resume.desc + '\n';
                music_cmd_desc += '- Syntax: **player resume** when the player is paused.\n```';
                return music_cmd_desc;

            case MusicCommands.save.cmd:
                music_cmd_desc += MusicCommands.save.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.save.desc + '\n';
                music_cmd_desc += '- Syntax: **player save <playlist name>** \n```';
                return music_cmd_desc;

            case MusicCommands.clear.cmd:
                music_cmd_desc += MusicCommands.clear.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.clear.desc + '\n';
                music_cmd_desc += '- Syntax: **player clear** \n```';
                return music_cmd_desc;

            case MusicCommands.load.cmd:
                music_cmd_desc += MusicCommands.load.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.load.desc + '\n';
                music_cmd_desc += '- Syntax: **player load <playlist name>** \n```';
                return music_cmd_desc;

            case MusicCommands.playlists.cmd:
                music_cmd_desc += MusicCommands.playlists.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.playlists.desc + '\n';
                music_cmd_desc += '- Syntax: **player playlists*** \n```';
                return music_cmd_desc;

            case MusicCommands.skipf.cmd:
                music_cmd_desc += MusicCommands.skipf.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.skipf.desc + '\n';
                music_cmd_desc += '- Syntax: **player skipf** \n```';
                return music_cmd_desc;

            case MusicCommands.skipb.cmd:
                music_cmd_desc += MusicCommands.skipb.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.skipb.desc + '\n';
                music_cmd_desc += '- Syntax: **player skipb** \n```';
                return music_cmd_desc;

            case MusicCommands.seek.cmd:
                music_cmd_desc += MusicCommands.seek.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.seek.desc + '\n';
                music_cmd_desc += '- Syntax: **player seek <index>** \n```';
                return music_cmd_desc;

            case MusicCommands.repeat.cmd:
                music_cmd_desc += MusicCommands.repeat.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.repeat.desc + '\n';
                music_cmd_desc += '- Syntax: **player repeat [all | none | one]** \n```';
                return music_cmd_desc;

            case MusicCommands.list.cmd:
                music_cmd_desc += MusicCommands.list.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.list.desc + '\n';
                music_cmd_desc += '- Syntax: **player list [page number]** \n```';
                return music_cmd_desc;

            case MusicCommands.now.cmd:
                music_cmd_desc += MusicCommands.now.cmd + '\n';
                music_cmd_desc += '- Description: ' + MusicCommands.now.desc + '\n';
                music_cmd_desc += '- Syntax: **player now** \n```';
                return music_cmd_desc;

            default:
                return ':negative_squared_cross_mark: This command is not present in **player** module!';
        }
    } else {
        return GetCompiledCommandListWithDesc();
    }
}

function Close() {
    return true;
}

module.exports = {

    Load: function (Register) {
        Register('player', Process, Close, HelpMessage, 'Control the music player of the server');
    }

}