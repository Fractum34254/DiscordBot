const { prefix, token } = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

const music = require('./music.js');

client.once("ready", () => {

    console.log("Ready!");

});

client.once("reconnecting", () => {

    console.log("Reconnecting!");

});

client.once("disconnect", () => {

    console.log("Disconnect!");

});


function help(message) {
    text =
        "**All commands for this bot:**\nplay - Add a YT - URL to the queue\ncount - Count the songs in queue\nstop - Pause the music\n";
    text += "resume - Continue playing\nskip - Skip one song\nagain - Restart the current song\nvol <number> - Set the volume\n";
    text += "np - Check what is currently being played!\nremove <int> - Remove one song from the queue\nshuffle - Shuffle the queue!\n";
    text += "random - alias for shuffle\nloop <true/false> - enable/disable loop (standard: enabled)\nclear - Delete all songs in the queue: FINAL!\n";
    text += "queue <int/all> - List queue page number / list entire queue\nsave <name> - Save queue in file (additive)\nload <name> - Add songs from a file to the queue";

    message.channel.send(text);
}


client.on("message", async message => {

    if (message.author.bot) return;

    if (!message.content.startsWith(prefix)) return;

    const serverQueue = music.queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}help`)) {

        help(message);

        return;

    } else if (message.content.startsWith(`${prefix}play`)) {

        music.execute(message, serverQueue, (qu) => { });

        return;

    } else if (message.content.startsWith(`${prefix}skip`)) {

        music.skip(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}stop`)) {

        music.stop(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}queue`)) {

        music.list(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}vol`)) {

        music.vol(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}again`)) {

        music.restartSong(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}loop`)) {

        music.loop(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}shuffle`)) {

        music.shuffle(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}random`)) {

        music.shuffle(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}np`)) {

        music.now(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}remove`)) {

        music.remove(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}resume`)) {

        music.resume(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}save`)) {

        music.save(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}load`)) {

        music.load(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}clear`)) {

        music.clear(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}count`)) {

        music.count(message, serverQueue);

        return;

    } else if (message.content.startsWith(`${prefix}playlist`)) {

        music.playlist(message, serverQueue);

        return;

    } else {

        message.channel.send("You need to enter a valid command!");

    }

});

client.login(token);