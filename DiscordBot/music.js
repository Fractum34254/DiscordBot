//Node.js: File module
const fs = require('fs');
const os = require("os");
const path = require('path');
const objLine = require('readline');
//YT-Downloader
const ytdl = require("ytdl-core");
//Storage for URLs when loading from file
const folderPath = "playlists/";
const urls = new Map();
//Serverqueues
const queue = new Map();
//Google/YT-API
var { google } = require('googleapis');
var youtube = google.youtube({
    version: 'v3',
    auth: "AIzaSyAgr0zXRI2OepJUZOO1P7935rl7Mu3I-Iw"
});

function logErr(err) {
    var cDate = new Date();
    var timeStamp = "---[MUSIC ERROR START]----[TIME: " + cDate.getHours() + ":" + cDate.getMinutes() + ":" + cDate.getSeconds() + "]-----------------------------------------";
    console.log(timeStamp);
    console.log(err);
    timeStamp = "---[MUSIC ERROR END] --------------------------------------------------------------";
    console.log(timeStamp);
}

async function execute(message, serverQueue, callback) {

    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
        message.channel.send("You need to be in a voice channel to play music!");
        return callback(serverQueue);
    }

    const permissions = voiceChannel.permissionsFor(message.client.user);

    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {

        message.channel.send("I need the permissions to join and speak in your voice channel!");
        return callback(serverQueue);
    }

    var songInfo;
    try {
        songInfo = await ytdl.getInfo(args[1]);
    }
    catch (err) {
        logErr(err);
        return message.channel.send("No valid song!");
    }
    const song = {
        title: songInfo.title,
        url: songInfo.video_url
    };

    //No server queue
    if (!serverQueue) {

        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
            looping: true
        };

        queue.set(message.guild.id, queueContruct);
        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
            return callback(queue.get(message.guild.id));
        } catch (err) {
            logErr(err);
            queue.delete(message.guild.id);
            message.channel.send(err);
            return callback(serverQueue);
        }

    } else {
        serverQueue.songs.push(song);
        message.channel.send(`${song.title} has been added to the queue!`);
        return callback(serverQueue);
    }
}

function play(guild, song) {

    const serverQueue = queue.get(guild.id);

    if (!song) { //empty queue
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    serverQueue.connection.play(ytdl(song.url, { filter: 'audioonly' }))
        .on("finish", () => {
            if (queue.get(guild.id).playing) {
                const firstSong = serverQueue.songs.shift();

                if (queue.get(guild.id).looping) {
                    serverQueue.songs.push(firstSong);
                }

                play(guild, serverQueue.songs[0]);
            }
        })
        .on("error", error => logErr(error));

    serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function playlist(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send("You won't be listening to any music, you are not in a voice chat!");
    }

    message.channel.send("_Start loading from YouTube..._");
    const args = message.content.split(" ");

    if (args.length == 1) {
        return message.channel.send("Missing parameter: no YouTube-Link provided!");
    }

    addPlaylist(message, serverQueue, args[1]);
}

function clear(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You have to be in a voice channel to clear the queue!");
    }

    if (!serverQueue) {
        return message.channel.send("There are already no songs in queue!");
    }

    serverQueue.songs = [];
    if (serverQueue.playing) {
        serverQueue.connection.dispatcher.end();
    }
    message.channel.send("_Stopped all music, cleared queue!_");
}

function load(message, serverQueue) {
    const args = message.content.split(" ");
    message.channel.send("Start loading of " + args[1] + "...");
    ReadFileCustom(folderPath + args[1], message, serverQueue, args[1]);
}

function save(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You are not listening to any music, you are not in a voice chat!");
    }

    if (!serverQueue) {
        return message.channel.send("There are no songs in queue I could save!");
    }

    message.channel.send("_Start saving..._");
    const args = message.content.split(" ");

    if (args.length == 1) {
        args.push("temp");
    }

    for (i = 0; i < serverQueue.songs.length; i++) {
        WriteFile(folderPath + args[1], serverQueue.songs[i].url);
    }
    return message.channel.send("Saved queue in **" + args[1] + "**! (Added songs to file)");
}

function remove(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You are not listening to any music, you are not in a voice chat!");
    }

    if (!serverQueue) {
        return message.channel.send("There are no songs in queue!");
    }

    const args = message.content.split(" ");
    if (args.length == 1) {
        return message.channel.send("Missing specifier: which song (nr)?");
    }
    if (args[1] > serverQueue.songs.length) {
        return message.channel.send("There are only " + serverQueue.songs.length + " in queue!");
    }

    const tit = serverQueue.songs[args[1] - 1].title;
    if (args[1] == 1) {
        skip(message, serverQueue);
        if (serverQueue.looping) {
            serverQueue.songs.pop();
        }
    }
    else {
        serverQueue.songs.splice(args[1] - 1, 1);
    }
    return message.channel.send("Removed " + tit + "!");
}

function shuffle(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You are not listening to any music, you are not in a voice chat!");
    }

    if (!serverQueue) {
        return message.channel.send("There are no songs in queue I could shuffle!");
    }

    if (serverQueue.songs.length == 1) {
        return message.channel.send("There is only one song left!");
    }

    const firstSong = serverQueue.songs.shift();

    serverQueue.songs = randomize(serverQueue.songs);

    serverQueue.songs.unshift(firstSong);

    return message.channel.send("Shuffled!");
}

function now(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You are not listening to any music, you are not in a voice chat!");
    }

    if (!serverQueue) {
        return message.channel.send("There are no songs in queue!");
    }

    return message.channel.send("Now playing **" + serverQueue.songs[0].title + "**");
}

function loop(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You are not listening to any music, you are not in a voice chat!");
    }

    if (!serverQueue) {
        return message.channel.send("There are no songs in queue!");
    }
    const args = message.content.split(" ");
    if (args.length == 1) {
        args.push("true");
    }

    if (args[1] == "true") {
        serverQueue.looping = true;
    } else if (args[1] == "false") {
        serverQueue.looping = false;
    } else {
        serverQueue.looping = true;
    }
    return message.channel.send("Looping set to: **" + serverQueue.looping + "**");
}

function list(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You are not listening to any music, you are not in a voice chat!");
    }
    if (!serverQueue) {
        return message.channel.send("Empty queue! Add songs via _?play <YT-URL>_");
    }
    const args = message.content.split(" ");
    if (args.length == 1) {
        args.push(0);
    }
    if (args[1] == "all") {
        text = "";
        for (i = 0; i < serverQueue.songs.length; i++) {
            text += (++i + ". **" + serverQueue.songs[--i].title + "**\n");
            if ((i + 1) % 10 == 0) {
                message.channel.send(text);
                text = "";
            }
        }
        message.channel.send(text);
    }
    else {
        text = "";
        for (i = 10 * (args[1] - 1); i < serverQueue.songs.length && i < 10 * (args[1]); i++) {
            text += (++i + ". **" + serverQueue.songs[--i].title + "**\n");
        }
        message.channel.send(text);
    }
}

function count(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send("You have to be in a voice chat to skip the music!");
    }

    if (!serverQueue) {
        return message.channel.send("There is no song that I could skip!");
    }
    return message.channel.send("There are " + serverQueue.songs.length + " songs in queue!");
}

function skip(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You have to be in a voice chat to skip the music!");
    }

    if (!serverQueue) {
        return message.channel.send("There is no song that I could skip!");
    }

    args = message.split(" ");
    if (args.length == 1) {
        args.push(1);
    }

    skipN(args[1]);
}

function skipN(serverQueue, n) {
    if (n <= 0) {
        return;
    }
    serverQueue.connection.dispatcher.end().then(function (serverQueue, n) { skipN(serverQueue, --n); });
}

function restartSong(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You have to be in a voice chat to restart the current song!");
    }

    if (!serverQueue) {
        return message.channel.send("There is currently no music playing!");
    }

    serverQueue.songs.splice(1, 0, serverQueue.songs[0]);
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You have to be in a voice channel to stop the music!");
    }

    serverQueue.playing = false;
    serverQueue.connection.dispatcher.end();
    message.channel.send("_Stopped music!_");
}

function resume(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You have to be in a voice channel to play music!");
    }
    if (!serverQueue) {
        return message.channel.send("There are no songs to resume!");
    }
    if (serverQueue.playing) {
        return message.channel.send("Already playing music!");
    }

    serverQueue.playing = true;
    message.channel.send("_Resuming!_");

    if (!queue.get(message.guild.id).connection) {
        try {
            var connection = voiceChannel.join();
            queue.get(message.guild.id).connection = connection;
        } catch (err) {
            return logErr(err);
        }
    }
    play(message.guild, serverQueue.songs[0]);
}

function vol(message, serverQueue) {

    if (!message.member.voice.channel) {
        return message.channel.send("You have to be in a voice channel to change the volume!");
    }

    if (!serverQueue) {
        return message.channel.send("Nothing is currently being played!");
    }

    const args = message.content.split(" ");
    if (args.length == 1) {
        return message.channel.send("Missing parameter: which volume should I set?");
    }
    serverQueue.volume = args[1];
    serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    return message.channel.send(`Changed volume to ${serverQueue.volume}`);
}

function randomize(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function WriteFile(pathFile, dataToWrite) {
    var newdatawithnewline = dataToWrite + os.EOL;
    fs.writeFile(pathFile, newdatawithnewline, { flag: "a" },
        function (err) {
            if (err) logErr(err);
        });
}

function ReadFileCustom(pathFile, message, serverQueue, name) {

    urls.delete(message.guild.id);
    urls.set(message.guild.id, []);

    const readLineFile = objLine.createInterface({
        input: fs.createReadStream(pathFile)
    });

    // Each line generates an event 
    readLineFile.on('line', (line) => {
        urls.get(message.guild.id).push(line);
    }).on('close', () => {
        message.content = "?play " + urls.get(message.guild.id)[0];
        execute(message, serverQueue, (qu) => {
            for (i = 1; i < urls.get(message.guild.id).length; i++) {
                ytdl.getInfo(urls.get(message.guild.id)[i], (err, songInfo) => {
                    if (err) {
                        logErr(err + "\nURL: " + urls.get(message.guild.id)[i] + "| Nr: " + i);
                    }
                    const song = {
                        title: songInfo.title,
                        url: songInfo.video_url
                    };
                    qu.songs.push(song);
                });
            }
        });
        message.channel.send("Adding _" + name + "_ to the queue, containing " + urls.get(message.guild.id).length + " songs!");
    });
}

function addPlaylist(message, serverQueue, playlistID) {
    return youtube.playlistItems.list({
        "part": "contentDetails",
        "maxResults": 50,
        "playlistId": playlistID
    })
    .then(function (response) {

        numRes = response.data.pageInfo.totalResults;
        numPage = response.data.pageInfo.resultsPerPage;
        nextPage = response.data.nextPageToken;

        //first page
        message.content = "?play https://www.youtube.com/watch?v=" + response.data.items[0].contentDetails.videoId;
        execute(message, serverQueue, (qu) => {
            for (i = 1; i < numPage && i < numRes; i++) {
                url = "https://www.youtube.com/watch?v=" + response.data.items[i].contentDetails.videoId;
                ytdl.getInfo(url, (err, songInfo) => {
                    if (err) {
                        logErr(err + "\nURL: " + url + "| Nr: " + i);
                    }
                    const song = {
                        title: songInfo.title,
                        url: songInfo.video_url
                    };
                    qu.songs.push(song);
                });
            }
            addPlaylistPage(message, qu, playlistID, nextPage, numRes - numPage);
        });
    },
    function (err) { logErr(err); });
}

function addPlaylistPage(message, serverQueue, playlistID, pageToken, resNr) {
    //last page: no "nextPageToken" provided -> exit
    if (!pageToken) {
        return message.channel.send("Loaded full YT-Playlist " + playlistID);
    }
    //hit API
    youtube.playlistItems.list({
        "part": "contentDetails",
        "maxResults": 50,
        "pageToken": pageToken,
        "playlistId": playlistID
    })
        .then(function (response) {

            numPage = response.data.pageInfo.resultsPerPage;
            nextPage = response.data.nextPageToken;

            for (i = 0; i < numPage && i < resNr; i++) {
                url = "https://www.youtube.com/watch?v=" + response.data.items[i].contentDetails.videoId;
                ytdl.getInfo(url, (err, songInfo) => {
                    if (err) {
                        logErr(err + "\nURL: " + url + "| Nr: " + i);
                    }
                    const song = {
                        title: songInfo.title,
                        url: songInfo.video_url
                    };
                    serverQueue.songs.push(song);
                });
            }
            resNr -= numPage;

            addPlaylistPage(message, serverQueue, playlistID, nextPage, resNr);
        },
            function (err) { logErr(err); });
}

module.exports = {
    logErr: logErr,
    execute: execute,
    play: play,
    playlist: playlist,
    clear: clear,
    load: load,
    save: save,
    remove: remove,
    shuffle: shuffle,
    now: now,
    loop: loop,
    list: list,
    count: count,
    skip: skip,
    restartSong: restartSong,
    stop: stop,
    resume: resume,
    vol: vol,
    randomize: randomize,
    WriteFile: WriteFile,
    ReadFileCustom: ReadFileCustom,
    queue: queue
}