//Node.js: File module
const fs = require('fs');
const os = require("os");
const path = require('path');
const objLine = require('readline');
//music queues
const queues = new Map();
//retry queues
const retryQueues = new Map();
//common functions (error handling etc)
const util = require('./Utility.js');
//YT-Downloader
const ytdl = require("ytdl-core");
//YT-search
const ytsr = require("ytsr");
//Yt-playlists
const ytpl = require("ytpl");
//storage for urls from file
const urls = new Map();
const pathName = "playlists/";
//storage for urls from YT-playlist
const playlists = new Map();

async function execute(message, args, text, retry) {
    if (!(typeof text === 'boolean')) {
        text = true;
    }
    if (!(typeof retry === 'boolean')) {
        retry = false;
    }

    //check for guild --> no DMs allowed!
    //might add later: check every guild in 'queues' if the user is member there
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: execute", message.author, "None");
        return message.channel.send("You have to be in a server channel to add songs, DMs are not allowed!");
    }

    //check for parameters
    if (args.length == 0) {
        util.logUserError("Found no YT-URL in 'play'-statement", "music: execute", message.author, "None");
        return message.channel.send("Missing arguments: No URL!");
    }

    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: execute: voiceChannel", message.author, "Probably asked in DM");
        return message.channel.send("I could not find your voice channel. You can not add songs via DM!");
    }

    if (!voiceChannel) {
        util.logUserError("User was not connected to a voice channel", "music: execute", message.author, "URL: " + args[0]);
        return message.channel.send("You need to be in a voice channel to play music!");
    }

    //check for permissions
    const permissions = voiceChannel.permissionsFor(message.client.user);

    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        util.logUserError("Bot did not have enough permissions to play music in specific voice channel", "music: execute", message.author, "URL: " + args[0]);
        return message.channel.send("I need the permissions to join and speak in your voice channel!");
    }

    //try to receive song info
    var songInfo;
    try {
        songInfo = await ytdl.getInfo(args[0], { quality: 'highestaudio', filter: 'audioonly' });
    }
    catch (err) {
        util.logErr(err, "music: execute: ytdl.getInfo", "URL: " + args[0]);
        message.channel.send("YT-Downloader could not resolve this URL: **" + args[0] + "**");
        if (retry) {
            retryQueue = retryQueues.get(message.guild.id);
            if (!retryQueue) {
                retryQueues.set(message.guild.id, [args[0]]);
            }
            else {
                retryQueue.push(args[0]);
            }
            message.channel.send("Added URL to the retry list - will execute in the end.");
        }
        return;
    }
    const song = {
        title: songInfo.title,
        url: songInfo.video_url,
        user: message.member,
        length: songInfo.player_response.videoDetails.lengthSeconds,
        startTime: undefined,
        pauseStartTime: undefined
    };

    //Load ServerQueue
    serverQueue = queues.get(message.guild.id);
    if (!serverQueue) {
        serverQueue =
            {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true,
                looping: true
            };
        queues.set(message.guild.id, serverQueue);
        serverQueue.songs.push(song);

        //try connecting to voiceChannel
        var connection;
        try {
            connection = await voiceChannel.join();
        }
        catch (err) {
            util.logErr(err, "music: execute: join VoiceChannel", "URL: " + args[0]);
            queues.delete(message.guild.id);
            return message.channel.send("Error while trying to join the voice channel.\nDeleted queue.");
        }
        serverQueue.connection = connection;
        //start playing!
        play(message);
    }
    else {
        if (voiceChannel != serverQueue.voiceChannel) {
            util.logUserError("User was not connected to the correct voice channel", "music: execute", message.author, "Parameter: " + util.arrToString(args, " "));
            return message.channel.send("You need to be in the same voice channel as the bot to add songs!");
        }
        //add song to the queue
        serverQueue.songs.push(song);
        if (text) message.channel.send(`${serverQueue.songs.length}. **${song.title}** has been added to the queue!`);
        return;
    }
}

function executeRecursion(message, localUrls, retry) {
    if (!(typeof retry === 'boolean')) {
        retry = true;
    }
    //test, if there are any more urls to add or not
    if ((!localUrls) || (!localUrls[0]) || (localUrls.length == 0)) {
        retryQueue = retryQueues.get(message.guild.id);
        if (retryQueue) {
            if (retryQueue.length != 0) {
                message.channel.send(`Start loading of retry queue ${message.member}: ${retryQueue.length} songs left.`);
                executeRecursion(message, retryQueue, false);
                return;
            }
            else {
                retryQueues.delete(message.guild.id);
            }
        }
        return message.channel.send(`Finished loading ${message.member} - final!`);
    }
    execute(message, localUrls, false, retry).then(function () {
        localUrls.shift();
        executeRecursion(message, localUrls, retry);
    });
}

function play(message) {
    const serverQueue = queues.get(message.guild.id);
    //missing queue
    if (!serverQueue) {
        util.logErr("Missing serverQueue while trying to play music!", "music: play", "None");
        return message.channel.send("Error while trying to play music: missing queue object!");
    }
    //empty queue
    if (!serverQueue.songs[0]) {
        serverQueue.voiceChannel.leave();
        queues.delete(message.guild.id);
        return message.channel.send("End of queue reached!");
    }
    //play music!
    try {
        serverQueue.songs[0].startTime = Date.now();
        serverQueue.connection.play(ytdl(serverQueue.songs[0].url, { quality: 'highestaudio', filter: 'audioonly' })
            .on("error", err => {
                //log Error and inform users
                util.logErr(err, "music: play: ytdl-stream: on error", "URL: " + serverQueue.songs[0].url);
                message.channel.send("Something went wrong while trying to play the song **" + serverQueue.songs[0].title + "**.\nContinuing to the next one");
                //finish song (continue)
                const first = serverQueue.songs.shift();
                if (serverQueue.looping) {
                    serverQueue.songs.push(first);
                }
                play(message);
            }))
            .on("finish", () => {
                const first = serverQueue.songs.shift();
                if (serverQueue.looping) {
                    serverQueue.songs.push(first);
                }
                //Recursion
                play(message);
            })
            .on("error", err => {
                //log Error and inform users
                util.logErr(err, "music: play: connection.play: on error", "URL: " + serverQueue.songs[0].url);
                message.channel.send("Something went wrong while trying to play the song **" + serverQueue.songs[0].title + "**.\nContinuing to the next one");
                //finish song (continue)
                const first = serverQueue.songs.shift();
                if (serverQueue.looping) {
                    serverQueue.songs.push(first);
                }
                play(message);
            });
    }
    catch (err) {
        //log Error and inform users
        util.logErr(err, "music: play: ytdl-stream: catch", "URL: " + serverQueue.songs[0].url);
        message.channel.send("Something went terribly wrong while trying to play the song **" + serverQueue.songs[0].title + "**.\nContinuing to the next one");
        //finish song (continue)
        const first = serverQueue.songs.shift();
        if (serverQueue.looping) {
            serverQueue.songs.push(first);
        }
        play(message);
    }
    serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume / 5.0);
    message.channel.send(`Start playing: **${serverQueue.songs[0].title}**!`);
}

async function playDirect(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: playDirect", message.author, "None");
        return message.channel.send("You have to be in a server channel to play a song, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue --> Execute
    if (!serverQueue) {
        return execute(message, args);
    }
    //check for parameters
    if (args.length == 0) {
        util.logUserError("Found no YT-URL in 'playDirect'-statement", "music: playDirect", message.author, "None");
        return message.channel.send("Missing arguments: No URL!");
    }
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: playDirect: voiceChannel", message.author, "Probably asked in DM");
        return message.channel.send("I could not find your voice channel. You can not play a song via DM!");
    }
    if (!voiceChannel) {
        util.logUserError("User was not connected to a voice channel", "music: playDirect", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to be in a voice channel to play music!");
    }
    //try to receive song info
    var songInfo;
    try {
        songInfo = await ytdl.getInfo(args[0], { quality: 'highestaudio', filter: 'audioonly' });
    }
    catch (err) {
        util.logErr(err, "music: playDirect: ytdl.getInfo", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("YT-Downloader could not resolve this URL: **" + args[0] + "**");
    }
    
    const song = {
        title: songInfo.title,
        url: songInfo.video_url,
        user: message.member,
        length: songInfo.player_response.videoDetails.lengthSeconds,
        startTime: undefined,
        pauseStartTime: undefined
    };

    //double unshift and then skip --> current song won't be pushed to the end of the queue
    serverQueue.songs.unshift(song);
    serverQueue.songs.unshift(song);
    skipArgs = [];
    skipArgs.push("1");
    //skip resumes if paused
    skip(message, skipArgs, false);
    //play will annouce the song
}

async function rejoin(message) {
    //log: something went wrong before
    util.logInfo("Called 'rejoin' function.", "music: rejoin: log console", "User: " + message.author.tag);
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: rejoin", message.author, "None");
        return message.channel.send("You have to be in a server channel to let the bot rejoin your voice channel, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried bot to rejoin", "music: rejoin", message.author, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: rejoin: voiceChannel", message.author, "Probably asked in DM");
        return message.channel.send("I could not find your voice channel. You can not let the bot rejoin via DM!");
    }
    if (!voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: rejoin", message.author, "None");
        return message.channel.send("You need to be in a voice channel to let to bot rejoin!");
    }
    //no permissions
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        util.logUserError("Bot did not have enough permissions to play music in specific voice channel", "music: rejoin", message.author, "None");
        return message.channel.send("I need the permissions to join and speak in your voice channel!");
    }
    //leave former voice channel
    try {
        serverQueue.connection.disconnect();
    }
    catch (err) {
        util.logErr(err, "music: rejoin: disconnect", "Unable to disconnect voice connection, continuing");
    }
    try {
        serverQueue.voiceChannel.leave();
    }
    catch (err) {
        util.logErr(err, "music: rejoin: leave channel", "Unable to leave voice channel, continuing");
    }
    serverQueue.voiceChannel = voiceChannel;
    //try connecting to voiceChannel
    var connection;
    try {
        connection = await voiceChannel.join();
    }
    catch (err) {
        util.logErr(err, "music: rejoin: join VoiceChannel", "None");
        return message.channel.send("Error while trying to join the voice channel.");
    }
    serverQueue.connection = connection;
    message.channel.send("Successfully rejoined!");
    play(message);
}

function vol(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: vol", message.author, "None");
        return message.channel.send("You have to be in a server channel to change the volume, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("There was no music playing while user tried to change volume", "music: vol", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Nothing is currently being played!");
    }
    //no parameter --> return volume
    if (args.length == 0) {
        return message.channel.send("Current volume: " + serverQueue.volume);
    }
    //args: reset/r --> set volume to 5
    if (args[0] == "r" || args[0] == "reset" || args[0] == "res") {
        args.shift();
        args.unshift("5");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: vol: voiceChannel", message.author, "Probably asked in DM");
        return message.channel.send("I could not find your voice channel. You can not change the volume via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: vol", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to be in the same voice channel as the bot to change the volume!");
    }
    //incorrect parameter (no number)
    if (isNaN(args[0])) {
        util.logUserError("User did not enter a valid parameter", "music: vol", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to enter a valid number!");
    }
    //range of volume
    if (0 > args[0]) {
        util.logUserError("User tried to set negative volume", "music: vol", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("There can't be a negative volume!");
    }
    serverQueue.volume = args[0];
    try {
        serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume / 5.0);
    }
    catch (err) {
        util.logErr(err, "music: vol: Set dispatcher volume", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send(`Failed to change volume to ${serverQueue.volume} on current song!`);
    }
    return message.channel.send(`Changed volume to ${serverQueue.volume}`);
}

function count(message) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: count", message.author, "None");
        return message.channel.send("You have to be in a server channel to count songs in the queue, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No queue for user to count songs", "music: count", message.author, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    return message.channel.send(`There are ${serverQueue.songs.length} songs in queue!`);
}

function clear(message) {
    //log every try in console
    util.logInfo("Called 'clear' function.", "music: clear: log console", "User: " + message.author.tag);

    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: clear", message.author, "None");
        return message.channel.send("You have to be in a server channel to clear the queue, DMs are not allowed!");
    }

    //clear loading queue
    if (urls.get(message.guild.id)) {
        urls.delete(message.guild.id);
        message.channel.send("Deleted loading queue.");
    }
    //clear retry queue
    if (retryQueues.get(message.guild.id)) {
        retryQueues.delete(message.guild.id);
        message.channel.send("Deleted retry queue.");
    }

    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No queue for user to delete", "music: clear", message.author, "None");
        return message.channel.send("Queue is already empty!");
    }
    const num = serverQueue.songs.length;
    serverQueue.songs = [];
    //not in a voice channel --> delete serverQueue and return
    if (!message.guild.voice) {
        queues.delete(message.guild.id);
        return message.channel.send(`Deleted queue of ${num} songs while not connected to a voice chat!`);
    }
    //in a voice channel --> check if playing, if not, resume (so the end event will clear everything up)
    try {
        if (!serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
        }
        serverQueue.connection.dispatcher.end();
        return message.channel.send(`Deleted queue of ${num} songs while being connected to a voice chat!`);
    }
    catch (err) {
        util.logErr(err, "music: clear: end dispatcher", "None");
        queues.delete(message.guild.id);
        return message.channel.send(`Deleted queue of ${num} songs, but could not end currently playing track!`);
    }
}

function now(message) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: now", message.author, "None");
        return message.channel.send("You have to be in a server channel to check what is playing, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No server queue while user tried to display current song", "music: now", message.author, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    //paused
    if (!serverQueue.playing) {
        message.channel.send("Music is paused.");
    }
    return message.channel.send(`Currently live: **${serverQueue.songs[0].title}**!`);
}

function shuffle(message) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: shuffle", message.author, "None");
        return message.channel.send("You have to be in a server channel to shuffle the queue, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No server queue while user tried to shuffle it", "music: shuffle", message.author, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: shuffle: voiceChannel", message.author, "Probably asked in DM");
        return message.channel.send("I could not find your voice channel. You can not shuffle via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: shuffle", message.author, "None");
        return message.channel.send("You need to be in the same voice channel as the bot to shuffle the queue!");
    }
    //not enough songs left
    if (serverQueue.songs.length <= 2) {
        util.logUserError("Not enough songs in queue to shuffle for user", "music: shuffle", message.author, "None");
        return message.channel.send("There are not enough songs left in the queue to shuffle!");
    }
    //shuffle
    const first = serverQueue.songs.shift();
    try {
        serverQueue.songs = util.randomize(serverQueue.songs);
    }
    catch (err) {
        util.logError(err, "music: shuffle: randomize", "None");
        return message.channel.send("Something went wrong while trying to shuffle!");
    }
    serverQueue.songs.unshift(first);
    return message.channel.send("Successfully shuffled the queue!");
}

function again(message) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: again", message.author, "None");
        return message.channel.send("You have to be in a server channel to restart the song, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to restart song", "music: again", message.author, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: again: voiceChannel", message.author, "Probably asked in DM");
        return message.channel.send("I could not find your voice channel. You can not restart a song via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: again", message.author, "None");
        return message.channel.send("You need to be in the same voice channel as the bot to restart the current song!");
    }
    //paused --> resume
    if (!serverQueue.playing) {
        resume(message);
    }
    //copy current track into second place
    serverQueue.songs.splice(1, 0, serverQueue.songs[0]);
    //call skip function with false as looping parameter
    skipArgs = [];
    skipArgs.push("1");
    skip(message, skipArgs, false);
    return; //'play' is going to annnouce the song again, no need to do it here
}
function skip(message, args, looping) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: skip", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to skip a song, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no parameter --> skip 1 song
    if (args.length == 0) {
        args.push("1");
    }
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to skip songs", "music: skip", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Nothing is currently being played!");
    }
    //set looping parameter
    looping = (typeof looping === 'undefined') ? serverQueue.looping : looping;
    //check if looping parameter is true/false
    if (!(typeof looping === 'boolean')) {
        util.logErr("Unmatched parameter types: 'Looping' was not a boolean.", "music: skip", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Parameter 'looping' did not match the specified 'boolean' type.");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: skip: voiceChannel", message.author, "Probably asked in DM, Parameter: " + util.arrToString(args, " "));
        return message.channel.send("I could not find your voice channel. You can not skip a song via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: skip", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to be in the same voice channel as the bot to skip songs!");
    }
    //incorrect parameter (no number)
    if (isNaN(args[0])) {
        util.logUserError("User did not enter a valid parameter", "music: skip", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to enter a valid integer!");
    }
    //incorrect parameter negative/zero
    if (args[0] <= 0) {
        util.logUserError("User tried to skip negative/zero songs", "music: skip", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Skipping negative/zero songs does not make any sense!");
    }
    args[0] = parseInt(args[0], 10);
    //skipping too much
    if (args[0] > serverQueue.songs.length) {
        util.logUserError("User wanted to skip more songs than there are in queue", "music: skip", message.author, "Parameter: " + util.arrToString(args, " ") + " | Queue Length: " + serverQueue.songs.length);
        return message.channel.send("There are only " + serverQueue.songs.length + " songs in queue!");
    }
    //paused --> resume
    if (!serverQueue.playing) {
        resume(message);
    }
    //remove skipped songs
    skipped = serverQueue.songs.splice(0, args[0]);
    //add them to the back of the array if looping is enabled
    if (looping) {
        serverQueue.songs = serverQueue.songs.concat(skipped);
    }
    //put last song in front, so dispatcher.end() will put it in the back again if looping
    last = serverQueue.songs.pop();
    serverQueue.songs.unshift(last);
    if (!serverQueue.looping) {
        serverQueue.songs.push(last);
    }
    //try to end currently playing song
    try {
        serverQueue.connection.dispatcher.end();
    }
    catch (err) {
        util.logErr(err, "music: skip: end dispatcher", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Tried to skip but failed while stopping dispatcher.");
    }
    //only return text when user called 'skip'-function directly, not another function
    if (message.content.startsWith("skip ")) {
        return message.channel.send("Skipped " + args[0] + " song(s)!");
    }
}

function unskip(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: unskip", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to unskip songs, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no parameter --> unskip 1 song
    if (args.length == 0) {
        args.push("1");
    }
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to unskip songs", "music: unskip", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Nothing is currently being played!");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: unskip: voiceChannel", message.author, "Probably asked in DM, Parameter: " + util.arrToString(args, " "));
        return message.channel.send("I could not find your voice channel. You can not unskip via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: unskip", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to be in the same voice channel as the bot to unskip songs!");
    }
    //incorrect parameter (no number)
    if (isNaN(args[0])) {
        util.logUserError("User did not enter a valid parameter", "music: unskip", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to enter a valid integer!");
    }
    //incorrect parameter negative/zero
    if (args[0] <= 0) {
        util.logUserError("User tried to unskip negative/zero songs", "music: unskip", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Unskipping negative/zero songs does not make any sense!");
    }
    //unskipping too much
    if (args[0] > serverQueue.songs.length) {
        util.logUserError("User wanted to unskip more songs than there are in queue", "music: unskip", message.author, "Parameter: " + util.arrToString(args, " ") + " | Queue Length: " + serverQueue.songs.length);
        return message.channel.send("There are only " + serverQueue.songs.length + " songs in queue!");
    }
    args[0] = parseInt(args[0], 10);
    //paused --> resume
    if (!serverQueue.playing) {
        resume(message);
    }
    //remove unskipped songs
    unskipped = serverQueue.songs.splice(serverQueue.songs.length - args[0], args[0]);
    //add them to the front of the queue
    serverQueue.songs = unskipped.concat(serverQueue.songs);
    //put last song in front, so dispatcher.end() will put it in the back again if looping
    last = serverQueue.songs.pop();
    serverQueue.songs.unshift(last);
    if (!serverQueue.looping) {
        serverQueue.songs.push(last);
    }
    //try to end currently playing song
    try {
        serverQueue.connection.dispatcher.end();
    }
    catch (err) {
        util.logErr(err, "music: unskip: end dispatcher", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Tried to unskip but failed while stopping dispatcher.");
    }
    //only return text when user called 'unskip'-function directly, not another function
    if (message.content.startsWith("unskip ")) {
        return message.channel.send("Unskipped " + args[0] + " song(s)!");
    }
}

function setLooping(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: setLooping, message.author", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to set the looping status, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to set looping status", "music: setLooping", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Nothing is currently being played!");
    }
    //no parameter --> return current looping status
    if (args.length == 0) {
        return message.channel.send("Looping is currently set to: **" + serverQueue.looping + "**!");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: setLooping: voiceChannel", message.author, "Probably asked in DM, Parameter: " + util.arrToString(args, " "));
        return message.channel.send("I could not find your voice channel. You can not set the looping status via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: setLooping", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to be in the same voice channel as the bot to set the looping status!");
    }
    //incorrect parameter (no number)
    if (args[0] != "true" && args[0] != "false") {
        util.logUserError("User did not enter a valid parameter", "music: setLooping", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to enter a valid integer!");
    }
    //set looping
    serverQueue.looping = (args[0] == "true");
    return message.channel.send("Set looping to **" + serverQueue.looping + "**!");
}

function list(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: list", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to list the queue, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no parameter --> list first page only
    if (args.length == 0) {
        args.push("1");
    }
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to list queue", "music: list", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Nothing is currently being played!");
    }
    //incorrect parameter (no number)
    if (isNaN(args[0]) && (args[0] != "all")) {
        util.logUserError("User did not enter a valid first parameter", "music: list", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to enter a valid number as first parameter!");
    }
    if ((args.length == 1) && (args[0] != "all")) {
        args.push((parseInt(args[0]) + 1).toString(10));
    }
    //incorrect parameter (no number)
    if (isNaN(args[1]) && (args[0] != "all")) {
        util.logUserError("User did not enter a valid second parameter", "music: list", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to enter a valid number as second parameter!");
    }
    //display queue
    if (args[0] == "all") {
        try {
            text = "";
            for (i = 0; i < serverQueue.songs.length; i++) {
                text += (++i + ". **" + serverQueue.songs[--i].title + "**\n");
                if ((i + 1) % 20 == 0) {
                    message.channel.send(text);
                    text = "";
                }
            }
            message.channel.send(text);
        }
        catch (err) {
            util.logErr(err, "music: list: display all", "Parameter: " + util.arrToString(args, " "));
            message.channel.send("Something went wrong while listing the entire queue.");
        }
    }
    else {
        if (args[0] <= 0) {
            util.logUserError("User did not enter a valid parameter", "music: list", message.author, "Parameter: " + util.arrToString(args, " "));
            return message.channel.send("You need to enter an integer bigger than zero as first parameter!");
        }
        if ((args[0] - 1) * 10 > serverQueue.songs.length) {
            util.logUserError("User did not enter a valid parameter", "music: list", message.author, "Parameter: " + util.arrToString(args, " ") + " | Queue length: " + serverQueue.songs.length);
            return message.channel.send("Your first page number is too big! There are only " + serverQueue.songs.length + " songs in queue.");
        }
        if (args[1] <= args[0]) {
            util.logUserError("User did not enter a valid parameter", "music: list", message.author, "Parameter: " + util.arrToString(args, " "));
            return message.channel.send("Your second parameter needs to be bigger than the first one!");
        }
        try {
            text = "";
            for (i = 10 * (args[0] - 1); i < serverQueue.songs.length && i < 10 * (args[1] - 1); i++) {
                text += (++i + ". **" + serverQueue.songs[--i].title + "**\n");
            }
            message.channel.send(text);
        }
        catch (err) {
            util.logErr(err, "music: list: display page", "Parameter: " + util.arrToString(args, " "));
            message.channel.send("Something went wrong while displaying page " + args[0] + " of the queue.");
        }
    }
}

function link(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: link", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to link to a song, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to get a link", "music: link", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Nothing is currently being played!");
    }
    //no parameter --> default: 1
    if (args.length == 0) {
        args.push("1");
    }
    //incorrect parameter (no number)
    if (isNaN(args[0])) {
        util.logUserError("User did not enter a valid parameter", "music: link", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to enter a valid integer!");
    }
    //incorrect parameter negative/zero
    if (args[0] <= 0) {
        util.logUserError("User tried to get link of a negative song / song zero", "music: link", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Negative/zero songs do not make any sense!");
    }
    //nr too big
    if (args[0] > serverQueue.songs.length) {
        util.logUserError("User wanted the link to a song out of queue range.", "music: link", message.author, "Parameter: " + util.arrToString(args, " ") + " | Queue Length: " + serverQueue.songs.length);
        return message.channel.send("There are only " + serverQueue.songs.length + " songs in queue!");
    }
    args[0] = parseInt(args[0], 10);
    return message.channel.send("Link to **" + serverQueue.songs[args[0] - 1].title + "**: " + serverQueue.songs[args[0] - 1].url);
}

function pause(message) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: pause", message.author, "None");
        return message.channel.send("You have to be in a server channel to pause, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to pause", "music: pause", message.author, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: pause: voiceChannel", message.author, "Probably asked in DM");
        return message.channel.send("I could not find your voice channel. You can not pause via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: pause", message.author, "None");
        return message.channel.send("You need to be in the same voice channel as the bot in order to pause the music!");
    }
    //already paused
    if (!serverQueue.playing) {
        util.logUserError("Already paused when user tried to", "music: pause", message.author, "None");
        return message.channel.send("Music is already paused!");
    }
    //set 'playing' to false
    serverQueue.playing = false;
    //try to fire 'pause' event for dispatcher
    try {
        serverQueue.connection.dispatcher.pause();
    }
    catch (err) {
        util.logErr(err, "music: pause: pause dispatcher", "None");
        return message.channel.send("Error while trying to pause the music. Maybe missing dispatcher object!");
    }
    serverQueue.songs[0].pauseStartTime = Date.now();
    return message.channel.send("_Paused_");
}

function resume(message) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: resume", message.author, "None");
        return message.channel.send("You have to be in a server channel to resume, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to resume", "music: resume", message.author, "None");
        return message.channel.send("Nothing is currently in the queue!");
    }
    //already playing
    if (serverQueue.playing) {
        util.logUserError("Already playing music when user tried to resume", "music: resume", message.author, "None");
        return message.channel.send("Music is already on air!");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: resume: voiceChannel", message.author, "Probably asked in DM");
        return message.channel.send("I could not find your voice channel. You can not resume via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: resume", message.author, "None");
        return message.channel.send("You need to be in the same voice channel as the bot in order to resume the music!");
    }
    //set 'playing' to true
    serverQueue.playing = true;
    //calculate correct timestamp
    diff = Date.now() - serverQueue.songs[0].pauseStartTime;
    serverQueue.songs[0].startTime += diff;
    //try to fire 'resume' event for dispatcher
    try {
        serverQueue.connection.dispatcher.resume();
    }
    catch (err) {
        util.logErr(err, "music: resume: resume dispatcher", "None");
        try {
            play(message);
        }
        catch {
            util.logErr(err, "music: resume: dispatcher - play", "None");
            return message.channel.send("Error while trying to resume. Maybe missing dispatcher object!");
        }
    }
    return message.channel.send("_Resuming!_");
}

function remove(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: remove", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to remove songs from the queue, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no parameter --> remove first song
    if (args.length == 0) {
        args.push("1");
    }
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No serverQueue while user tried to remove songs", "music: remove", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Nothing is currently in the queue!");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: remove: voiceChannel", message.author, "Probably asked in DM, Parameter: " + util.arrToString(args, " "));
        return message.channel.send("I could not find your voice channel. You can not remove songs via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: remove", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to be in the same voice channel as the bot to remove songs!");
    }
    //incorrect parameter (no number)
    if (isNaN(args[0])) {
        util.logUserError("User did not enter a valid parameter", "music: remove", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to enter a valid integer!");
    }
    //incorrect parameter 0
    if (args[0] <= 0) {
        util.logUserError("User tried to remove negative/zero songs", "music: remove", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Removing negative/zero songs does not make any sense!");
    }
    //index out of range
    if (args[0] > serverQueue.songs.length) {
        util.logUserError("User wanted to remove a song out of the queue", "music: remove", message.author, "Parameter: " + util.arrToString(args, " ") + " | Queue Length: " + serverQueue.songs.length);
        return message.channel.send("There are only " + serverQueue.songs.length + " songs in queue!");
    }
    args[0] = parseInt(args[0], 10);
    try {
        //remove first song (special case)
        if (args[0] == 1) {
            //call 'skip' with false as looping parameter
            skipArgs = [];
            skipArgs.push("1");
            skip(message, skipArgs, false);
            return message.channel.send("Removed first song!");
        }
        //else: remove other songs
        removed = serverQueue.songs.splice(args[0] - 1, 1);
    }
    catch (err) {
        util.logErr(err, "music: remove: splice queue", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("An error occured while trying to remove song #" + args[0] + " from the queue. Sorry :(");
    }
    return message.channel.send("Removed **" + removed[0].title + "** from the queue (was on position " + args[0] + ").");
}

function load(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: load", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to load songs to the queue, DMs are not allowed!");
    }
    //no parameter
    if (args.length == 0) {
        util.logUserError("User tried to load from file without parameter.", "music: load", message.author, "None");
        return message.channel.send("Missing parameter: Which file should I load?");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: load: voiceChannel", message.author, "Probably asked in DM, Parameter: " + util.arrToString(args, " "));
        return message.channel.send("I could not find your voice channel. You can not load songs via DM!");
    }
    if (!voiceChannel) {
        util.logUserError("User was not connected to a voice channel", "music: load", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to be in a voice channel to attach songs from a file to the queue!");
    }

    //check if there is already an url-array for this guild
    if (!urls.get(message.guild.id)) {
        urls.set(message.guild.id, []);
    }
    preSize = urls.get(message.guild.id).length;

    //create stream interface
    var readLineFile = null;
    try {
        readLineFile = objLine.createInterface({
            input: fs.createReadStream(pathName + args[0]).on('error', err => {
                util.logUserError(err, "music: load: fs.createReadStream error handler", message.author, "Parameter: " + util.arrToString(args, " "));
                return message.channel.send("Could not load " + args[0] + "!");
            })
        });
    }
    catch (err) {
        util.logUserError(err, "music: load: createFileInterface", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Could not load " + args[0] + "!");
    }

    try {
        //each line generates an event
        readLineFile
            .on("line", (line) => {
                urls.get(message.guild.id).push(line);
            })
            .on("close", () => {
                //initialize first song
                executeRecursion(message, urls.get(message.guild.id));
                message.channel.send("Adding **" + args[0] + "** to the queue, containing " + (urls.get(message.guild.id).length - preSize) + " songs!");
            })
            .on("error", (err) => {
                util.logErr(err, "music: load: readLineFile", "Parameter: " + util.arrToString(args, " "));
                message.channel.send("Error while trying to add **" + args[0] + "** to the queue!");
            });
    }
    catch (err) {
            util.logErr(err, "music: load: readLineFile", "Parameter: " + util.arrToString(args, " "));
            message.channel.send("Error while trying to add **" + args[0] + "** to the queue!");
    };
}

function loadShuffled(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: loadShuffled", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to load songs to the queue, DMs are not allowed!");
    }
    //no parameter
    if (args.length == 0) {
        util.logUserError("User tried to load from file without parameter.", "music: loadShuffled", message.author, "None");
        return message.channel.send("Missing parameter: Which file should I load?");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: loadShuffled: voiceChannel", message.author, "Probably asked in DM, Parameter: " + util.arrToString(args, " "));
        return message.channel.send("I could not find your voice channel. You can not load songs via DM!");
    }
    if (!voiceChannel) {
        util.logUserError("User was not connected to a voice channel", "music: loadShuffled", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to be in a voice channel to attach songs from a file to the queue!");
    }

    //check if there is already an url-array for this guild
    if (!urls.get(message.guild.id)) {
        urls.set(message.guild.id, []);
    }
    preSize = urls.get(message.guild.id).length;

    //create stream interface
    var readLineFile = null;
    try {
        readLineFile = objLine.createInterface({
            input: fs.createReadStream(pathName + args[0]).on('error', err => {
                util.logUserError(err, "music: loadShuffled: fs.createReadStream error handler", message.author, "Parameter: " + util.arrToString(args, " "));
                return message.channel.send("Could not load " + args[0] + "!");
            })
        });
    }
    catch (err) {
        util.logUserError(err, "music: loadShuffled: createFileInterface", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Could not load " + args[0] + "!");
    }

    try {
        //each line generates an event
        readLineFile
            .on("line", (line) => {
                urls.get(message.guild.id).push(line);
            })
            .on("close", () => {
                //shuffle url queue
                urls.set(message.guild.id, util.randomize(urls.get(message.guild.id)));
                //initialize first song
                executeRecursion(message, urls.get(message.guild.id));
                message.channel.send("Adding **" + args[0] + "** to the queue, containing " + (urls.get(message.guild.id).length - preSize) + " songs!");
            })
            .on("error", (err) => {
                util.logErr(err, "music: loadShuffled: readLineFile", "Parameter: " + util.arrToString(args, " "));
                message.channel.send("Error while trying to add **" + args[0] + "** to the queue!");
            });
    }
    catch (err) {
        util.logErr(err, "music: loadShuffled: readLineFile", "Parameter: " + util.arrToString(args, " "));
        message.channel.send("Error while trying to add **" + args[0] + "** to the queue!");
    };
}

function write(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: shuffle", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to shuffle the queue, DMs are not allowed!");
    }
    //no parameter
    if (args.length == 0) {
        util.logUserError("User tried to write to file without parameter.", "music: write", message.author, "None");
        return message.channel.send("Missing parameter: Which file should I write to?");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("User tried to write empty queue to file.", "music: write", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("No queue to save!");
    }
    //write all URLs to a file
    errorCount = 0;
    for (i = 0; i < serverQueue.songs.length; i++) {
        try {
            util.writeLineToFile(pathName + args[0], serverQueue.songs[i].url);
        }
        catch (err) {
            util.logErr(err, "music: write: writeLineToFile", "Parameter: " + util.arrToString(args, " ") + " | Nr: " + i + " | URL: " + serverQueue.songs[i].url + " | Title: " + serverQueue.songs[i].title);
            message.channel.send("Error while trying to save the url of **" + serverQueue.songs[i].title + "**. Continuing.");
            errorCount++;
        }
    }
    return message.channel.send("Successfully wrote " + 100 * (serverQueue.songs.length - errorCount) / serverQueue.songs.length + "% to the file " + args[0] + "!");
}

function requested(message) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: requested", message.author, "None");
        return message.channel.send("You have to be in a server channel to get who requested this song, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id)
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("User tried to request impulse of empty queue.", "music: request", message.author, "None");
        return message.channel.send("Nothing is currently playing!");
    }
    return message.channel.send(`**${serverQueue.songs[0].title}** was requested by ${serverQueue.songs[0].user}!`);
}

function removeDoubles(message) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: removeDoubles", message.author, "None");
        return message.channel.send("You have to be in a server channel to remove duplicates, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id)
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("User tried to remove doubles in empty queue.", "music: removeDoubles", message.author, "None");
        return message.channel.send("Nothing is currently in the queue!");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: removeDoubles: voiceChannel", message.author, "Probably asked in DM");
        return message.channel.send("I could not find your voice channel. You can not remove duplicates via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: removeDoubles", message.author, "None");
        return message.channel.send("You need to be in the same voice channel as the bot to remove duplicate songs!");
    }
    removed = 0;
    try {
        for (i = 0; i < serverQueue.songs.length; i++) {
            for (j = i + 1; j < serverQueue.songs.length; j++) {
                if (serverQueue.songs[j].url == serverQueue.songs[i].url) {
                    serverQueue.songs.splice(j--, 1);
                    removed++;
                }
            }
        }
    }
    catch (err) {
        util.logErr(err, "music: removeDoubles: for-Loops", "None");
        return message.channel.send("Something went wrong. Already removed " + removed + " songs.");
    }
    return message.channel.send("Removed " + removed + " songs from the queue - they were duplicates.");
}

async function search(message, args) {
    //no arguments
    if (args.length == 0) {
        util.logUserError("User did not enter a search parameter", "music: search", message.author, "None");
        return message.channel.send("You need to enter a query!");
    }
    //test for result number
    if ((args.length <= 1) || (isNaN(args[args.length - 1]))) {
        args.push("5");
    }
    results = args.pop();
    if (results > 20) {
        util.logUserError("User entered a too large number", "music: search", message.author, "Parameter: " + util.arrToString(args, " ") + " | Max Result Number: " + results);
        return message.channel.send("You need to enter a max result number smaller then or equal to 20!");
    }
    //try searching via ytsr
    var result;
    try {
        result = await ytsr(util.arrToString(args, " "), { limit: parseInt(results, 10) });
    }
    catch (err) {
        util.logErr(err, "music: search: await ytsr", "Parameter: " + util.arrToString(args, " ") + " | Max Result Number: " + results);
        return message.channel.send("Error while searching.");
    }
    text = "";
    //loop trough results
    try {
        for (i = 0; i < result.items.length; i++) {
            text += result.items[i].link;
            text += " - ";
            text += result.items[i].title;
            text += "\n";
        }
    }
    catch (err) {
        util.logErr(err, "music: search: examine results", "Parameter: " + util.arrToString(args, " ") + " | Max Result Number: " + results);
        message.channel.send("Error while examining the results. Already extracted:");
        if (text === "");
        {
            return message.channel.send("Nothing extracted.");
        }
        return message.channel.send(text);
    }
    if (text == "") {
        return message.channel.send("No search results!");
    }
    message.channel.send("**Search results:**");
    return message.channel.send(text);
}

async function addPlaylist(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: addPlaylist", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to add a playlist to the queue, DMs are not allowed!");
    }
    //no parameter
    if (args.length == 0) {
        util.logUserError("User tried to load from YT-playlist without parameter.", "music: addPlaylist", message.author, "None");
        return message.channel.send("Missing parameter: No playlist link!");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: addPlaylist: voiceChannel", message.author, "Probably asked in DM, Parameter: " + util.arrToString(args, " "));
        return message.channel.send("I could not find your voice channel. You can not add a playlist via DM!");
    }
    if (!voiceChannel) {
        util.logUserError("User was not connected to a voice channel", "music: addPlaylist", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You need to be in a voice channel to attach songs from a playlist to the queue!");
    }

    //check if there is already an playlist-array for this guild
    if (!playlists.get(message.guild.id)) {
        playlists.set(message.guild.id, []);
    }

    //request YT-playlist
    var result;
    try {
        result = await ytpl(args[0], { limit: 0 });
    }
    catch (err) {
        util.logErr(err, "music: addPlaylist: await ytpl", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("YT-Downloader could not resolve this playlist-link!");
    }
    //loop trough results
    try {
        for (i = 0; i < result.items.length; i++) {
            playlists.get(message.guild.id).push(result.items[i].url_simple);
        }
    }
    catch (err) {
        util.logErr(err, "music: addPlaylist: examine results", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Error while examining the results.");
    }
    //add all songs to the queue via recursion
    executeRecursion(message, playlists.get(message.guild.id));
}

function finish(message) {
    //almost equal to queue clearing --> log it!
    util.logInfo("Called 'finish' function.", "music: finish: log console", "User: " + message.author.tag + " (" + message.member.nickname + ")");
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: finish", message.author, "None");
        return message.channel.send("You have to be in a server channel to finish playing, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to finish queue", "music: finish", message.author, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    //incorrect voice channel
    let voiceChannel = null;
    //check for voiceChannel
    try {
        voiceChannel = message.member.voice.channel;
    }
    catch (err) {
        util.logUserError(err, "music: finish: voiceChannel", message.author, "Probably asked in DM");
        return message.channel.send("I could not find your voice channel. You can not finish playing via DM!");
    }
    if (voiceChannel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: finish", message.author, "None");
        return message.channel.send("You need to be in the same voice channel as the bot to finish the queue!");
    }
    //set looping off
    if (serverQueue.looping) {
        setLooping(message, ["false"]);
    }
    //clear loading queue
    if (urls.get(message.guild.id)) {
        urls.delete(message.guild.id);
        message.channel.send("Deleted loading queue.");
    }
    //clear retry queue
    if (retryQueues.get(message.guild.id)) {
        retryQueues.delete(message.guild.id);
        message.channel.send("Deleted retry queue.");
    }
    try {
        first = serverQueue.songs.shift();
        serverQueue.songs = [];
        serverQueue.songs.push(first);
    }
    catch (err) {
        util.logErr(err, "music: finish", "None");
        return message.channel.send("An error occured while trying to finish the queue!");
    }
    return message.channel.send("Enjoy the last song!");
}

function time(message) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "music: time", message.author, "None");
        return message.channel.send("You have to be in a server channel to get the song timer, DMs are not allowed!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to get song timestamp", "music: time", message.author, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    var curr;
    //paused --> calculate time different
    if (!serverQueue.playing) {
        curr = serverQueue.songs[0].pauseStartTime - serverQueue.songs[0].startTime;
        message.channel.send("Music is paused at the moment.");
    }
    else {
        curr = Date.now() - serverQueue.songs[0].startTime;
    }
    //to seconds
    curr = Math.ceil(curr / 1000);
    message.channel.send("Current song time: **" + util.secondsToTimeString(curr) + " min** of **" + util.secondsToTimeString(serverQueue.songs[0].length) + " min** song length!");
}

module.exports = {
    execute: execute,
    vol: vol,
    count: count,
    clear: clear,
    now: now,
    shuffle: shuffle,
    again: again,
    skip: skip,
    unskip: unskip,
    setLooping: setLooping,
    list: list,
    pause: pause,
    resume: resume,
    remove: remove,
    load: load,
    loadShuffled: loadShuffled,
    write: write,
    requested: requested,
    removeDoubles: removeDoubles,
    playDirect: playDirect,
    search: search,
    addPlaylist: addPlaylist,
    link: link,
    finish: finish,
    rejoin: rejoin,
    time: time
}
