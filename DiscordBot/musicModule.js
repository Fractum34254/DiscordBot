//Node.js: File module
const fs = require('fs');
const os = require("os");
const path = require('path');
const objLine = require('readline');
//music queues
const queues = new Map();
//common functions (error handling etc)
const util = require('./Utility.js');
//YT-Downloader
const ytdl = require("ytdl-core");
//storage for urls from file
const urls = new Map();
const pathName = "playlists/";

async function execute(message, args) {
    //check for parameters
    if (args.length == 0) {
        util.logUserError("Found no YT-URL in 'play'-statement", "music: execute", message.member, "None");
        return message.channel.send("Missing arguments: No URL!");
    }

    //check for voiceChannel
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
        util.logUserError("User was not connected to a voice channel", "music: execute", message.member, "URL: " + args[0]);
        return message.channel.send("You need to be in a voice channel to play music!");
    }

    //check for permissions
    const permissions = voiceChannel.permissionsFor(message.client.user);

    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        util.logUserError("Bot did not have enough permissions to play music in specific voice channel", "music: execute", message.member, "URL: " + args[0]);
        return message.channel.send("I need the permissions to join and speak in your voice channel!");
    }

    //try to receive song info
    var songInfo;
    try {
        songInfo = await ytdl.getInfo(args[0], { quality: 'highestaudio', filter: 'audioonly' });
    }
    catch (err) {
        util.logErr(err, "music: execute: ytdl.getInfo", "URL: " + args[0]);
        return message.channel.send("YT-Downloader could not resolve this URL: **" + args[0] + "**");
    }

    const song = {
        title: songInfo.title,
        url: songInfo.video_url,
        user: message.member
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
        //add song to the queue
        serverQueue.songs.push(song);
        return message.channel.send(`${serverQueue.songs.length}. **${song.title}** has been added to the queue!`);
    }
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
    serverQueue.connection.play(ytdl(serverQueue.songs[0].url, { quality: 'highestaudio', filter: 'audioonly' }))
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
            util.logErr(err, "music: play: ytdl-stream", "URL: " + serverQueue.songs[0].url);
            message.channel.send("Something went wrong while trying to play the song " + serverQueue.songs[0].title + ".\nContinuing to the next one");
            //finish song (continue)
            const first = serverQueue.songs.shift();
            if (serverQueue.looping) {
                serverQueue.songs.push(first);
            }
            play(message);
        });
    serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    message.channel.send(`Start playing: **${serverQueue.songs[0].title}**!`);
}

function vol(message, args) {
    //no parameter --> reset volume to 5 (standard)
    if (args.length == 0) {
        args.push("5");
    }
    //incorrect voice channel
    if (message.member.voice.channel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: vol", message.member, "Parameter: " + args[0]);
        return message.channel.send("You need to be in the same voice channel as the bot to change the volume!");
    }
    //incorrect parameter (no number)
    if (isNaN(args[0])) {
        util.logUserError("User did not enter a valid parameter", "music: vol", message.member, "Parameter: " + args[0]);
        return message.channel.send("You need to enter a valid number!");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("There was no music playing while user tried to change volume", "music: vol", message.member, "Parameter: " + args[0]);
        return message.channel.send("Nothing is currently being played!");
    }
    //range of volume
    if (0 >= args[0]) {
        util.logUserError("User tried to set negative volume", "music: vol", message.member, "Parameter: " + args[0]);
        return message.channel.send("There can't be a negative volume!");
    }
    serverQueue.volume = args[0];
    try {
        serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    }
    catch (err) {
        util.logErr(err, "music: vol: Set dispatcher volume", "Parameter: " + args[0]);
        return message.channel.send(`Failed to change volume to ${serverQueue.volume} on current song!`);
    }
    return message.channel.send(`Changed volume to ${serverQueue.volume}`);
}

function count(message) {
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No queue for user to count songs", "music: count", message.member, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    return message.channel.send(`There are ${serverQueue.songs.length} songs in queue!`);
}

function clear(message) {
    //log every try in console
    util.logUserError("Called 'clear' function.", "music: clear: log console", message.member, "INFO only");

    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No queue for user to delete", "music: clear", message.member, "None");
        return message.channel.send("Queue is already empty!");
    }
    const num = serverQueue.songs.length;
    serverQueue.songs = [];
    //not in a voice channel --> delete serverQueue and return
    if (!message.guild.voice) {
        queues.delete(message.guild.id);
        return message.channel.send(`Deleted queue of ${num} songs!`);
    }
    //in a voice channel --> check if playing, if not, resume (so the end event will clear everything up)
    try {
        if (!serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
        }
        serverQueue.connection.dispatcher.end();
    }
    catch (err) {
        util.logErr(err, "music: clear: end dispatcher", "None");
        message.channel.send(`Deleted queue of ${num} songs, but could not end currently playing track!`);
    }
    return message.channel.send(`Deleted queue of ${num} songs!`);
}

function now(message) {
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No server queue while user tried to display current song", "music: now", message.member, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    return message.channel.send(`Currently live: **${serverQueue.songs[0].title}**!`);
}

function shuffle(message) {
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No server queue while user tried to shuffle it", "music: shuffle", message.member, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    //incorrect voice channel
    if (message.member.voice.channel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: shuffle", message.member, "None");
        return message.channel.send("You need to be in the same voice channel as the bot to shuffle the queue!");
    }
    //not enough songs left
    if (serverQueue.songs.length <= 2) {
        util.logUserError("Not enough songs in queue to shuffle for user", "music: shuffle", message.member, "None");
        return message.channel.send("There are not enough songs left in the queue to shuffle!");
    }
    //shuffle
    const first = serverQueue.songs.shift();
    try {
        serverQueue.songs = util.randomize(serverQueue.songs);
    }
    catch (err) {
        util.logError("Error in shuffle-algorithm", "music: shuffle: randomize", "None");
        return message.channel.send("Something went wrong while trying to shuffle!");
    }
    serverQueue.songs.unshift(first);
    return message.channel.send("Successfully shuffled the queue!");
}

function again(message) {
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to restart song", "music: again", message.member, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    //incorrect voice channel
    if (message.member.voice.channel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: again", message.member, "None");
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
    serverQueue = queues.get(message.guild.id);
    //no parameter --> skip 1 song
    if (args.length == 0) {
        args.push("1");
    }
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to skip songs", "music: skip", message.member, "Parameter: " + args[0]);
        return message.channel.send("Nothing is currently being played!");
    }
    //set looping parameter
    looping = (typeof looping === 'undefined') ? serverQueue.looping : looping;
    //check if looping parameter is true/false
    if (!(typeof looping === 'boolean')) {
        util.logErr("Unmatched parameter types: 'Looping' was not a boolean.", "music: skip", "Parameter: " + args[0]);
        return message.channel.send("Parameter 'looping' did not match the specified 'boolean' type.");
    }
    //incorrect voice channel
    if (message.member.voice.channel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: skip", message.member, "Parameter: " + args[0]);
        return message.channel.send("You need to be in the same voice channel as the bot to skip songs!");
    }
    //incorrect parameter (no number)
    if (isNaN(args[0])) {
        util.logUserError("User did not enter a valid parameter", "music: skip", message.member, "Parameter: " + args[0]);
        return message.channel.send("You need to enter a valid integer!");
    }
    //incorrect parameter negative/zero
    if (args[0] <= 0) {
        util.logUserError("User tried to skip negative/zero songs", "music: skip", message.member, "Parameter: " + args[0]);
        return message.channel.send("Skipping negative/zero songs does not make any sense!");
    }
    //skipping too much
    if (args[0] > serverQueue.songs.length) {
        util.logUserError("User wanted to skip more songs than there are in queue", "music: skip", message.member, "Parameter: " + args[0] + " | Queue Length: " + serverQueue.songs.length);
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
        util.logErr(err, "music: skip: end dispatcher", "Parameter: " + args[0]);
        return message.channel.send("Tried to skip but failed while stopping dispatcher.");
    }
    //only return text when user called 'skip'-function directly, not another function
    const msg = message.content.substr(1);
    if (msg.startsWith("skip ")) {
        return message.channel.send("Skipped " + args[0] + " song(s)!");
    }
}

function setLooping(message, args) {
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to set looping status", "music: setLooping", message.member, "Parameter: " + args[0]);
        return message.channel.send("Nothing is currently being played!");
    }
    //no parameter --> return current looping status
    if (args.length == 0) {
        return message.channel.send("Looping is currently set to: **" + serverQueue.looping + "**!");
    }
    //incorrect voice channel
    if (message.member.voice.channel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: setLooping", message.member, "Parameter: " + args[0]);
        return message.channel.send("You need to be in the same voice channel as the bot to set the looping status!");
    }
    //incorrect parameter (no number)
    if (args[0] != "true" && args[0] != "false") {
        util.logUserError("User did not enter a valid parameter", "music: setLooping", message.member, "Parameter: " + args[0]);
        return message.channel.send("You need to enter a valid integer!");
    }
    //set looping
    serverQueue.looping = (args[0] == "true");
    return message.channel.send("Set looping to **" + serverQueue.looping + "**!");
}

function list(message, args) {
    serverQueue = queues.get(message.guild.id);
    //no parameter --> list first page
    if (args.length == 0) {
        args.push("1");
    }
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to list queue", "music: list", message.member, "Parameter: " + args[0]);
        return message.channel.send("Nothing is currently being played!");
    }
    //incorrect parameter (no number)
    if (isNaN(args[0]) && (args[0] != "all")) {
        util.logUserError("User did not enter a valid parameter", "music: list", message.member, "Parameter: " + args[0]);
        return message.channel.send("You need to enter a valid integer!");
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
            util.logErr(err, "music: list: display all", "Parameter: all");
            message.channel.send("Something went wrong while listing the entire queue.");
        }
    }
    else {
        if (args[0] <= 0) {
            util.logUserError("User did not enter a valid parameter", "music: list", message.member, "Parameter: " + args[0]);
            return message.channel.send("You need to enter an integer bigger than zero!");
        }
        if ((args[0] - 1) * 10 > serverQueue.songs.length) {
            util.logUserError("User did not enter a valid parameter", "music: list", message.member, "Parameter: " + args[0] + " | Queue length: " + serverQueue.songs.length);
            return message.channel.send("Your page number is too big! There are only " + serverQueue.songs.length + " songs in queue.");
        }
        try {
            text = "";
            for (i = 10 * (args[0] - 1); i < serverQueue.songs.length && i < 10 * (args[0]); i++) {
                text += (++i + ". **" + serverQueue.songs[--i].title + "**\n");
            }
            message.channel.send(text);
        }
        catch (err) {
            util.logErr(err, "music: list: display page", "Parameter: " + args[0]);
            message.channel.send("Something went wrong while displaying page " + args[0] + " of the queue.");
        }
    }
}

function pause(message) {
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to pause", "music: pause", message.member, "None");
        return message.channel.send("Nothing is currently being played!");
    }
    //incorrect voice channel
    if (message.member.voice.channel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: pause", message.member, "None");
        return message.channel.send("You need to be in the same voice channel as the bot in order to pause the music!");
    }
    //already paused
    if (!serverQueue.playing) {
        util.logUserError("Already paused when user tried to", "music: pause", message.member, "None");
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
    return message.channel.send("_Paused_");
}

function resume(message) {
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No music playing while user tried to resume", "music: resume", message.member, "None");
        return message.channel.send("Nothing is currently in the queue!");
    }
    //already playing
    if (serverQueue.playing) {
        util.logUserError("Already playing music when user tried to resume", "music: resume", message.member, "None");
        return message.channel.send("Music is already on air!");
    }
    //incorrect voice channel
    if (message.member.voice.channel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: resume", message.member, "None");
        return message.channel.send("You need to be in the same voice channel as the bot in order to resume the music!");
    }
    //if bot dropped out of voice channel, try to bring it back in ans restart song (continuing not possible)
    if (!message.guild.voice) {
        try {
            serverQueue.connection = serverQueue.voiceChannel.join();
        }
        catch (err) {
            util.logErr(err, "music: resume: rejoin voiceChannel", "None");
            return message.channel.send("Failed rejoining the original voice channel! Not able to continue.");
        }
        return play(message); //will do every text output
    }
    //set 'playing' to true
    serverQueue.playing = true;
    //try to fire 'resume' event for dispatcher
    try {
        serverQueue.connection.dispatcher.resume();
    }
    catch (err) {
        util.logErr(err, "music: resume: resume dispatcher", "None");
        return message.channel.send("Error while trying to resume. Maybe missing dispatcher object!");
    }
    return message.channel.send("_Resuming!_");
}

function remove(message, args) {
    serverQueue = queues.get(message.guild.id);
    //no parameter --> remove first song
    if (args.length == 0) {
        args.push("1");
    }
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("No serverQueue while user tried to remove songs", "music: remove", message.member, "Parameter: " + args[0]);
        return message.channel.send("Nothing is currently in the queue!");
    }
    //incorrect voice channel
    if (message.member.voice.channel != serverQueue.voiceChannel) {
        util.logUserError("User was not connected to the correct voice channel", "music: remove", message.member, "Parameter: " + args[0]);
        return message.channel.send("You need to be in the same voice channel as the bot to remove songs!");
    }
    //incorrect parameter (no number)
    if (isNaN(args[0])) {
        util.logUserError("User did not enter a valid parameter", "music: remove", message.member, "Parameter: " + args[0]);
        return message.channel.send("You need to enter a valid integer!");
    }
    //incorrect parameter 0
    if (args[0] <= 0) {
        util.logUserError("User tried to remove negative/zero songs", "music: remove", message.member, "Parameter: " + args[0]);
        return message.channel.send("Removing negative/zero songs does not make any sense!");
    }
    //index out of range
    if (args[0] > serverQueue.songs.length) {
        util.logUserError("User wanted to remove a song out of the queue", "music: remove", message.member, "Parameter: " + args[0] + " | Queue Length: " + serverQueue.songs.length);
        return message.channel.send("There are only " + serverQueue.songs.length + " songs in queue!");
    }
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
        util.logErr(err, "music: remove: splice queue", "Parameter: " + args[0]);
        return message.channel.send("An error occured while trying to remove song #" + args[0] + " from the queue. Sorry :(");
    }
    return message.channel.send("Removed **" + removed[0].title + "** from the queue (was on position " + args[0] + ").");
}

function load(message, args) {
    //no parameter
    if (args.length == 0) {
        util.logUserError("User tried to load from file without parameter.", "music: load", message.member, "None");
        return message.channel.send("Missing parameter: Which file should I load?");
    }
    //incorrect voice channel
    if (!message.member.voice.channel) {
        util.logUserError("User was not connected to a voice channel", "music: load", message.member, "Parameter: " + args[0]);
        return message.channel.send("You need to be in a voice channel to attach songs from a file to the queue!");
    }

    //empty array
    urls.delete(message.guild.id);
    urls.set(message.guild.id, []);

    //create stream interface
    const readLineFile = objLine.createInterface({
        input: fs.createReadStream(pathName + args[0])
    });

    //each line generates an event
    readLineFile
        .on("line", (line) => {
            urls.get(message.guild.id).push(line);
        })
        .on("close", () => {
            playArgs = [];
            //initialize first song
            playArgs.push(urls.get(message.guild.id)[0]);
            execute(message, playArgs)
                .then(
                    function () {
                        //add all other songs
                        for (i = 1; i < urls.get(message.guild.id).length; i++) {
                            playArgs[0] = urls.get(message.guild.id)[i];
                            execute(message, playArgs);
                        }
                    }
                );
            message.channel.send("Adding **" + args[0] + "** to the queue, containing " + urls.get(message.guild.id).length + " songs!");
        })
        .on("error", (err) => {
            util.logErr(err, "music: load: readLineFile", "Parameter: " + args[0]);
            message.channel.send("Error while trying to add **" + args[0] + "** to the queue!");
        });
}

function write(message, args) {
    //no parameter
    if (args.length == 0) {
        util.logUserError("User tried to write to file without parameter.", "music: write", message.member, "None");
        return message.channel.send("Missing parameter: Which file should I write to?");
    }
    serverQueue = queues.get(message.guild.id);
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("User tried to write empty queue to file.", "music: write", message.member, "Parameter: " + args[0]);
        return message.channel.send("No queue to save!");
    }
    //write all URLs to a file
    errorCount = 0;
    for (i = 0; i < serverQueue.songs.length; i++) {
        try {
            util.writeLineToFile(pathName + args[0], serverQueue.songs[i].url);
        }
        catch (err) {
            util.logErr(err, "music: write: writeLineToFile", "Parameter: " + args[0] + " | Nr: " + i + " | URL: " + serverQueue.songs[i].url + " | Title: " + serverQueue.songs[i].title);
            message.channel.send("Error while trying to save the url of **" + serverQueue.songs[i].title + "**. Continuing.");
            errorCount++;
        }
    }
    return message.channel.send("Succesfully wrote " + 100 * (serverQueue.songs.length - errorCount) / serverQueue.songs.length + "% to the file " + args[0] + "!");
}

function requested(message) {
    serverQueue = queues.get(message.guild.id)
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("User tried to request impulse of empty queue.", "music: request", message.member, "None");
        return message.channel.send("Nothing is currently playing!");
    }
    return message.channel.send(`**${serverQueue.songs[0].title}** was requested by ${serverQueue.songs[0].user}!`);
}

function removeDoubles(message) {
    serverQueue = queues.get(message.guild.id)
    //no serverQueue
    if (!serverQueue) {
        util.logUserError("User tried to remove doubles in empty queue.", "music: removeDoubles", message.member, "None");
        return message.channel.send("Nothing is currently in the queue!");
    }
    try {
        const removed = 0;
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

module.exports = {
    execute: execute,
    vol: vol,
    count: count,
    clear: clear,
    now: now,
    shuffle: shuffle,
    again: again,
    skip: skip,
    setLooping: setLooping,
    list: list,
    pause: pause,
    resume: resume,
    remove: remove,
    load: load,
    write: write,
    requested: requested,
    removeDoubles: removeDoubles
}