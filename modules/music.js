const DISCORD = require('discord.js');
const YTDL = require('ytdl-core');
const EVENTS = require('events');
const FS = require('fs');
const DATA_PATH = 'data/';

const LoadOptions = {
  quality: 'highestaudio',
  filter: 'audioonly'
};
const StreamOptions = {
  seek: 0,
  volume: 1
};

var ConnectedVoiceChannel = null;
var TotalConnectedUsers = 0;
var CurrentPlaylist = [];
var CurrentMusicIndex = null;
var CurrentDispatcher = null;
var PlayerEventEmitter = new EVENTS.EventEmitter();
var PlayerMode = 'none';
var AllPlaylistsAvailable = [];

const MusicCommands = {
  "join": {
    "cmd": "join",
    "desc": "Join a voice channel"
  },
  "leave": {
    "cmd": "leave",
    "desc": "Leave the voice channel"
  },
  "play": {
    "cmd": "play",
    "desc": "Play music by loading from youtube"
  },
  "pause": {
    "cmd": "pause",
    "desc": "Pauses the player"
  },
  "resume": {
    "cmd": "resume",
    "desc": "Resumes the player"
  },
  "save": {
    "cmd": "save",
    "desc": "Saves the current playlist"
  },
  "clear": {
    "cmd": "clear",
    "desc": "Removes all music from the current playlist"
  },
  "load": {
    "cmd": "load",
    "desc": "Loads a playlist from saved playlists"
  },
  "playlists": {
    "cmd": "playlists",
    "desc": "Displays all saved playlists"
  },
  "rmvplaylist": {
    "cmd": "remove-playlist",
    "desc": "Removes given playlist if present in the playlist record"
  },
  "next": {
    "cmd": "next",
    "desc": "Plays previous music in the playlist"
  },
  "previous": {
    "cmd": "previous",
    "desc": "Plays next music in the playlist"
  },
  "seek": {
    "cmd": "seek",
    "desc": "Plays the music at given index"
  },
  "remove": {
    "cmd": "remove",
    "desc": "Removes a music at given index from currently playing playlist"
  },
  "repeat": {
    "cmd": "repeat",
    "desc": "Sets player repeat mode"
  },
  "list": {
    "cmd": "list",
    "desc": "Lists 5 music in the playlist page by page"
  },
  "now": {
    "cmd": "now",
    "desc": "Shows the currently playing music"
  }
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
  all_music_cmds += MusicCommands.rmvplaylist.cmd + " = '" + MusicCommands.rmvplaylist.desc + "'\n";
  all_music_cmds += MusicCommands.next.cmd + " = '" + MusicCommands.next.desc + "'\n";
  all_music_cmds += MusicCommands.previous.cmd + " = '" + MusicCommands.previous.desc + "'\n";
  all_music_cmds += MusicCommands.seek.cmd + " = '" + MusicCommands.seek.desc + "'\n";
  all_music_cmds += MusicCommands.remove.cmd + " = '" + MusicCommands.remove.desc + "'\n";
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
    } else {
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
      members = ConnectedVoiceChannel.members;
      for (let [snowflake, member] of members) {
        if (member.user.bot) {
          // don't add bot as music listeners
        } else {
          TotalConnectedUsers++;
      }
    }
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
      if (CurrentDispatcher) {
        CurrentDispatcher.end('skipping');
      }
      ConnectedVoiceChannel.leave();
      ConnectedVoiceChannel = null;
      TotalConnectedUsers = 0;
    } else {
      Message.reply('you are not connected to the voice channel that I am in!');
    }
  } else {
    Message.reply('I am not connected to any voice channel!');
  }
}

function LeaveVoiceChannelCheckUsers() {
  if (TotalConnectedUsers === 0) {
    if (ConnectedVoiceChannel) {
      if (CurrentDispatcher) {
        CurrentDispatcher.end('skipping');
      }
      ConnectedVoiceChannel.leave();
      ConnectedVoiceChannel = null;
    }
  }
}

function ClearPlaylist() {
  CurrentPlaylist = [];
  CurrentMusicIndex = null;
}

function Play() {
  if (ConnectedVoiceChannel && (CurrentMusicIndex != null)) {
    const stream = YTDL(CurrentPlaylist[CurrentMusicIndex].url, LoadOptions);
    dispatcher = ConnectedVoiceChannel.connection.playStream(stream, StreamOptions);
    CurrentDispatcher = dispatcher;
    dispatcher.on('end', function(reason) {
      if (reason == 'skipping') {
        CurrentDispatcher = null;
        return;
      }

      if (CurrentMusicIndex != null) {
        if (PlayerMode != 'one') {
          CurrentMusicIndex += 1;
        }
        next_music = CurrentPlaylist[CurrentMusicIndex];
        if (next_music) {
          PlayerEventEmitter.emit('change_music');
        } else {
          if ((PlayerMode == 'none') || (PlayerMode == 'one')) {
            CurrentDispatcher.end('skipping');
            ClearPlaylist();
          } else if (PlayerMode == 'all') {
            CurrentMusicIndex = 0;
            PlayerEventEmitter.emit('change_music');
          }
        }
      }
    });
    return true;
  }
  return false;
}
PlayerEventEmitter.on('change_music', Play);

function GetNowPlaying() {
  total_music_nums = CurrentPlaylist.length;
  now_playing = '```md\n# Now Playing [Mode: Repeat ' + PlayerMode + '] & [Total Music:' + total_music_nums + ']\n';
  now_playing += '[' + (CurrentMusicIndex + 1).toString() + '] ' + CurrentPlaylist[CurrentMusicIndex].title + '\n```';
  return now_playing;
}

function Pause() {
  if (CurrentDispatcher) {
    result = (CurrentDispatcher.paused == false);
    CurrentDispatcher.pause();
    return result;
  }
}

function Resume() {
  if (CurrentDispatcher) {
    result = (CurrentDispatcher.paused == true);
    CurrentDispatcher.resume();
    return result;
  } else {
    return Play();
  }
}

function PlayNext() {
  if (CurrentMusicIndex != null) {
    ++CurrentMusicIndex;
    if (CurrentMusicIndex > (CurrentPlaylist.length - 1)) {
      CurrentMusicIndex = 0;
    }
    if (CurrentDispatcher) {
      CurrentDispatcher.end('skipping');
    }
    Play();
    return true;
  } else {
    return false;
  }
}

function PlayPrevious() {
  if (CurrentMusicIndex != null) {
    --CurrentMusicIndex;
    if (CurrentMusicIndex < 0) {
      CurrentMusicIndex = CurrentPlaylist.length - 1;
    }
    if (CurrentDispatcher) {
      CurrentDispatcher.end('skipping');
    }
    Play();
    return true;
  } else {
    return false;
  }
}

function AddPlayListToRecord(playlist_name) {
  RemovePlaylistFromRecord(playlist_name);
  AllPlaylistsAvailable.push(playlist_name);
}

function RemovePlaylistFromRecord(playlist_name) {
  NewPlaylistAvailable = [];
  removed = false;
  for (playlist_index = 0; playlist_index < AllPlaylistsAvailable.length; ++playlist_index) {
    if (playlist_name !== AllPlaylistsAvailable[playlist_index]) {
      NewPlaylistAvailable.push(AllPlaylistsAvailable[playlist_index]);
    } else {
      removed = true;
    }
  }
  AllPlaylistsAvailable = NewPlaylistAvailable;
  return removed;
}

function Process(Message, Args) {

  firstArg = Args[1];

  if (firstArg == MusicCommands.join.cmd) { // join the voice channel that the caller is on and have permission
    JoinVoiceChannel(Message);
    return;
  } else if (firstArg == MusicCommands.leave.cmd) { // leave the voice channel if connected to one
    LeaveVoiceChannel(Message);
    return;
  } else if (firstArg == MusicCommands.play.cmd) { // search for music in youtube or play the selected music from search result if -1
    if (!ConnectedVoiceChannel) {
      JoinVoiceChannel(Message);
      if (!ConnectedVoiceChannel) {
        return;
      }
    }

    // TODO(Zero): Search youtube for music
    ytlink = Args[2];
    if (!ytlink && (CurrentPlaylist.length > 0)) {
      if (Resume()) {
        Message.channel.send(':arrow_forward: Player resumed!');
      }
      return;
    } else if (!ytlink && (CurrentPlaylist.length == 0)) {
      Message.channel.send(':negative_squared_cross_mark: No music in the playlist, type **player play <music name>** to add music!');
      return;
    }

    if (ytlink[0] == '<') {
      ytlink = ytlink.substr(1, ytlink.length - 1);
    }

    if (YTDL.validateURL(ytlink)) {
      YTDL.getInfo(ytlink, (err, info) => {
        if (err) return console.log('Error in player play command!');
        CurrentPlaylist.push({
          title: info.title,
          url: ytlink
        });
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
    return;
  }

  if (!ConnectedVoiceChannel) {
    Message.reply('I am not connected to a voice channel, please use **player play [song name]** OR **player join** command so I can join the voice channel');
    return;
  }

  if (Message.member.voiceChannel) {
    if (Message.member.voiceChannel != ConnectedVoiceChannel) {
      Message.reply('I am already connected to the voice channel: :speaker:' +
        ConnectedVoiceChannel.name +
        '. Please connect to this channel.');
      return;
    }
  } else {
    Message.reply('please connect to the voice channel: :speaker:' + ConnectedVoiceChannel.name);
    return;
  }

  switch (firstArg) {
    case MusicCommands.pause.cmd: // pause the player if playing
      {
        if (Pause()) {
          Message.channel.send(':pause_button: Player paused!');
        }
      }
      break;

    case MusicCommands.resume.cmd: // resumes the player if plaused
      {
        if (Resume()) {
          Message.channel.send(':arrow_forward: Player resumed!');
        }
      }
      break;

    case MusicCommands.save.cmd: // save the current playing list
      {
        // TODO: This has not been checked, remove this tag
        if (CurrentPlaylist.length != 0) {
          playlist_name = Args[2];
          if (playlist_name) {
            // NOTE: Both music name and music link are saved in file,
            // so no need of loading music names when playlist is being loaded
            FS.writeFileSync(DATA_PATH + playlist_name + '.json', JSON.stringify(CurrentPlaylist));
            AddPlayListToRecord(playlist_name);
            Message.channel.send(':inbox_tray: **' + playlist_name + '** sucessfully added to the record!');
          } else {
            Message.reply('specify a playlist name:: **player save <playlist_name>**');
            return;
          }
        } else {
          Message.reply('current playlist is empty!');
          return;
        }
      }
      break;

    case MusicCommands.clear.cmd: // clear the musics in the current playlist
      {
        ClearPlaylist();
        if (CurrentDispatcher) {
          CurrentDispatcher.end('skipping');
        }
        Message.channel.send(':ballot_box_with_check: Current Playlist has been cleared!');
      }
      break;

    case MusicCommands.load.cmd: // load the saved playlist if present
      {
        // TODO: check this, remove this tag
        playlist_name = Args[2];
        if (playlist_name) {
          // NOTE: Both music name and music link should be saved in the file
          for (playlist_index = 0; playlist_index < AllPlaylistsAvailable.length; ++playlist_index) {
            if (playlist_name === AllPlaylistsAvailable[playlist_index]) {
              if (FS.existsSync(DATA_PATH + playlist_name + '.json')) {
                NewPlaylist = JSON.parse(FS.readFileSync(DATA_PATH + playlist_name + '.json', 'utf-8'));
                if (NewPlaylist.length == 0) {
                  Message.reply('this playlist seems to be empty!');
                  RemovePlaylistFromRecord(playlist_name);
                  return;
                } else {
                  ClearPlaylist();
                  CurrentPlaylist = NewPlaylist;
                  CurrentMusicIndex = 0;
                  if (CurrentDispatcher) {
                    CurrentDispatcher.end('skipping');
                  }
                  Play();
                  Message.channel.send(':arrow_forward: **' + playlist_name + '** is now playing!');
                  return;
                }
              } else {
                Message.reply('seems like the playlist is lost! Please contact managers!');
                RemovePlaylistFromRecord(playlist_name);
                return;
              }
            }
          }
          Message.reply('the playlist you specified doesn\'t exist!');
          return;
        } else {
          Message.reply('specify a playlist name:: **player load <playlist_name>**');
          return;
        }
      }
      break;

    case MusicCommands.playlists.cmd: // display all saved playlist
      {
        // TODO: check this and remove the tag
        if (AllPlaylistsAvailable.length == 0) {
          Message.channel.send(':negative_squared_cross_mark: No playlist in the record :negative_squared_cross_mark:');
          return;
        }
        page = 0;
        last_page = (Math.ceil(AllPlaylistsAvailable.length / 10)).toString();
        if (Args[2]) {
          given_number = parseInt(Args[2]);
          if (given_number == NaN) {
            Message.reply('page number must be from 1 to ' + last_page);
            return;
          } else {
            if ((given_number < 1) || (given_number > parseInt(last_page))) {
              Message.reply('page number must start from 1 to ' + last_page);
              return;
            } else {
              page = given_number - 1;
            }
          }
        }
        if (page == NaN) return;

        start_index = page * 10;
        end_index = start_index + 10;
        if (end_index > AllPlaylistsAvailable.length) {
          end_index = AllPlaylistsAvailable.length;
        }

        total_playlist_nums = AllPlaylistsAvailable.length;
        playlist_list = '```md\n# [Total Playlist:' + total_playlist_nums + '] & [Page: ' +
        (page + 1).toString() + ' of ' + last_page + ']\n';

        for (index = start_index; index < end_index; ++index) {
          playlist_list += '- [' + (index + 1).toString() + '] ' + AllPlaylistsAvailable[index] + '\n';
        }
        playlist_list += '```';
        Message.channel.send(playlist_list);
      }
      break;

    case MusicCommands.rmvplaylist.cmd: // removes specified playlist if present in the record
      {
        // TODO: check this and remove this tag
        playlist_name = Args[2];
        if (playlist_name) {
          if (RemovePlaylistFromRecord(playlist_name)) {
            Message.channel.send(':warning: ' + playlist_name + ' has been removed!');
            return;
          } else {
            Message.reply('No playlist with the name `' + playlist_name + '` exists!');
            return;
          }
        } else {
          Message.reply('please specify playlist to remove! Type **player remove-playlist <playlist name>**');
          return;
        }
      }
      break;

    case MusicCommands.next.cmd: // skip the player forwards
      {
        if (PlayNext()) {
          Message.channel.send(GetNowPlaying());
        } else {
          Message.channel.send(':negative_squared_cross_mark: No music in the playlist, type **player play <music name>** to add music!');
        }
      }
      break;

    case MusicCommands.previous.cmd: // skip the player backwards
      {
        if (PlayPrevious()) {
          Message.channel.send(GetNowPlaying());
        } else {
          Message.channel.send(':negative_squared_cross_mark: No music in the playlist, type **player play <music name>** to add music!');
        }
      }
      break;

    case MusicCommands.seek.cmd: // seek at given index
      {
        if (CurrentMusicIndex != null) {
          if (Args[2]) {
            index = parseInt(Args[2]);
            if (index == NaN) {
              Message.reply('please specify an index from 1 to ' + CurrentPlaylist.length.toString());
            } else {
              if ((index < 1) || (index > CurrentPlaylist.length)) {
                Message.reply('index must range from 1 to ' + CurrentPlaylist.length.toString());
              } else {
                CurrentMusicIndex = index - 1;
                if (CurrentDispatcher) {
                  CurrentDispatcher.end('skipping');
                }
                Play();
                Message.channel.send(GetNowPlaying());
              }
            }
          } else {
            Message.reply('please specify an index from 1 to ' + CurrentPlaylist.length.toString());
          }
        } else {
          Message.channel.send(':negative_squared_cross_mark: No music in the playlist, type **player play <music name>** to add music!');
        }
      }
      break;

    case MusicCommands.remove.cmd: // remove a music from the playlist
      {
        if (CurrentPlaylist.length == 0) {
          Message.reply('there is not music in the playlist!');
          return;
        }
        if (Args[2]) {
          index = parseInt(Args[2]);
          if (index == NaN) {
            Message.reply('please specify an index from 1 to ' + CurrentPlaylist.length.toString());
          } else {
            if ((index < 1) || (index > CurrentPlaylist.length)) {
              Message.reply('index must range from 1 to ' + CurrentPlaylist.length.toString());
            } else {
              index--;
              if (index == CurrentMusicIndex) {
                PlayNext();
              }
              if (index < CurrentMusicIndex) {
                CurrentMusicIndex--;
              }
              removed_music = CurrentPlaylist[index];
              CurrentPlaylist.splice(index, 1);
              Message.channel.send(':red_circle: Music: ' + removed_music.title + ' has been sucessfully removed!');
            }
          }
        } else {
          Message.reply('please specify an index from 1 to ' + CurrentPlaylist.length.toString());
        }
      }
      break;

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
      }
      break;

    case MusicCommands.list.cmd: // shows all music in currently playing playlist
      {
        if (CurrentPlaylist.length == 0) {
          Message.channel.send(':negative_squared_cross_mark: No songs present in the playlist :negative_squared_cross_mark:');
          return;
        }
        page = 0;
        last_page = (Math.ceil(CurrentPlaylist.length / 5)).toString();
        if (Args[2]) {
          given_number = parseInt(Args[2]);
          if (given_number == NaN) {
            Message.reply('page number must be from 1 to ' + last_page);
            return;
          } else {
            if ((given_number < 1) || (given_number > parseInt(last_page))) {
              Message.reply('page number must start from 1 to ' + last_page);
              return;
            } else {
              page = given_number - 1;
            }
          }
        }
        if (page == NaN) return;

        start_index = page * 5;
        end_index = start_index + 5;
        if (end_index > CurrentPlaylist.length) {
          end_index = CurrentPlaylist.length;
        }

        total_music_nums = CurrentPlaylist.length;
        music_list = '```md\n# [Total Music:' + total_music_nums + '] & [Mode: Repeat ' + PlayerMode + '] & [Page: ' +
        (page + 1).toString() + ' of ' + last_page + ']\n';

        for (index = start_index; index < end_index; ++index) {
          if (index == CurrentMusicIndex) {
            music_list += '- [' + (index + 1).toString() + '] >>> ' + CurrentPlaylist[index].title + '\n';
          } else {
            music_list += '- [' + (index + 1).toString() + '] ' + CurrentPlaylist[index].title + '\n';
          }
        }
        music_list += '```';
        Message.channel.send(music_list);
      }
      break;

    case MusicCommands.now.cmd: // shows currently playing song
      {
        if (!CurrentPlaylist[CurrentMusicIndex]) {
          Message.channel.send(':negative_squared_cross_mark: No songs playing from a playlist :negative_squared_cross_mark:');
          return;
        }
        Message.channel.send(GetNowPlaying());
      }
      break;

    default: // error! show list of all possible commands for music player
      {
        error_help = 'Error: **' + firstArg + '** is not present in **player** module, here are the lists of commands:\n' + GetCompiledCommandListWithDesc();
        Message.channel.send(error_help);
      }
      break;
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
        music_cmd_desc += '- Syntax: **player playlists** \n```';
        return music_cmd_desc;

      case MusicCommands.rmvplaylist.cmd:
        music_cmd_desc += MusicCommands.rmvplaylist.cmd + '\n';
        music_cmd_desc += '- Description: ' + MusicCommands.rmvplaylist.desc + '\n';
        music_cmd_desc += '- Syntax: **player remove-playlist <playlist name>** \n ```';
        return music_cmd_desc;

      case MusicCommands.next.cmd:
        music_cmd_desc += MusicCommands.next.cmd + '\n';
        music_cmd_desc += '- Description: ' + MusicCommands.next.desc + '\n';
        music_cmd_desc += '- Syntax: **player next** \n```';
        return music_cmd_desc;

      case MusicCommands.previous.cmd:
        music_cmd_desc += MusicCommands.previous.cmd + '\n';
        music_cmd_desc += '- Description: ' + MusicCommands.previous.desc + '\n';
        music_cmd_desc += '- Syntax: **player previous** \n```';
        return music_cmd_desc;

      case MusicCommands.seek.cmd:
        music_cmd_desc += MusicCommands.seek.cmd + '\n';
        music_cmd_desc += '- Description: ' + MusicCommands.seek.desc + '\n';
        music_cmd_desc += '- Syntax: **player seek <index>** \n```';
        return music_cmd_desc;

      case MusicCommands.remove.cmd:
        music_cmd_desc += MusicCommands.remove.cmd + '\n';
        music_cmd_desc += '- Description: ' + MusicCommands.remove.desc + '\n';
        music_cmd_desc += '- Syntax: **player remove <index>** \n```';
        return music_cmd_desc;
        break;

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
  // TODO: this needs check, remove this tag
  if (AllPlaylistsAvailable.length != 0) {
    console.log(JSON.stringify(AllPlaylistsAvailable)); // TODO: remove this tag
    FS.writeFileSync(DATA_PATH + '_available_playlist.spark', JSON.stringify(AllPlaylistsAvailable));
  }
  return true;
}

module.exports = {

  Load: function(Register) {
    // TODO: check this and remove this tag
    if (FS.existsSync(DATA_PATH + '_available_playlist.spark')) {
      console.log(FS.readFileSync(DATA_PATH + '_available_playlist.spark')); // TODO: remove this tag
      AllPlaylistsAvailable = JSON.parse(FS.readFileSync(DATA_PATH + '_available_playlist.spark', 'utf-8'));
    }
    Register('player', Process, Close, HelpMessage, 'Control the music player of the server');
  },

  UserJoinedVoiceChannel: function(User, VoiceChannel) {
    if (ConnectedVoiceChannel) {
      if (VoiceChannel == ConnectedVoiceChannel) {
        TotalConnectedUsers++;
      }
    }
  },

  UserLeftVoiceChannel: function(User, LeftVoiceChannel) {
    if (ConnectedVoiceChannel) {
      if (LeftVoiceChannel == ConnectedVoiceChannel) {
        TotalConnectedUsers--;
        if (TotalConnectedUsers === 0) {
          Pause();
          setTimeout(LeaveVoiceChannelCheckUsers, 60 * 1000); // Leave the voice channel after a minute when there are no users left
        }
      }
    }
  }

}
