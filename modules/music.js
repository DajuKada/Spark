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
    "repeat": { "cmd": "repeat", "desc": "Sets player repeat mode" },
    "list": { "cmd": "list", "desc": "Lists 5 music in the playlist page by page" },
    "now": { "cmd": "now", "desc": "Shows the currently playing music" }
};

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
        if (PlayerMode != 'one') {
            CurrentMusicIndex += 1;
        }
        if (CurrentPlaylist[CurrentMusicIndex]) {
            PlayerEventEmitter.emit('next_music');
        } else {
            if (PlayerMode == 'none' || PlayerMode == 'one') {
                CurrentDispatcher = null;
                CurrentMusicIndex = null;
                ClearPlaylist();
            } else if (PlayerMode == 'all') {
                CurrentMusicIndex = 0;
                PlayerEventEmitter.emit('next_music');
            }
        }
    });
}
PlayerEventEmitter.on('next_music', Play);

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

            } break;

        case MusicCommands.skipb.cmd: // skip the player backwards
            {

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
                now_playing = '```md\n# Now Playing [Mode: Repeat ' + PlayerMode + ']\n';
                now_playing += CurrentPlaylist[CurrentMusicIndex].title + '\n```';
                Message.channel.send(now_playing);
            } break;

        default: // error! show list of all possible commands for music player
            {
                Message.reply('Error arguments supplied!');
            } break;
    }
}

function HelpMessage(Args) {
    return 'This is help for music!';
}

function Close() {
    return true;
}

module.exports = {

    Load: function (Register) {
        Register('player', Process, Close, HelpMessage, 'Control the music player of the server');
    }

}