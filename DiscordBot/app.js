const { prefix, token } = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

const music = require('./musicModule.js');
const fun = require('./funModule.js');
const util = require('./Utility.js');
const mod = require('./moderatorModule.js');

//Error handling - last instance
process.on('uncaughtException', (err, origin) => {
    // inform Devs on origin server
    // Send the message to a designated channel on the server:
    const channel = client.guilds.get('688081153361576013').channels.cache.find(ch => ch.name === 'dev-chat');
    // Do nothing if the channel wasn't found on this server
    if (!channel) {
        util.logErr("Did not find channel 'dev-chat' while trying to inform about crash!", "main: uncaughtException listener", "You missed an exception case somewhere!");
    }
    else {
        // Send the message, mentioning the Devs
        channel.send(`The bot caught an horrible exception. <@688091839643123728>s check the console!`);
    }
    return util.logErr(err, "main: uncaughtException handler", origin);
});

//Define all commands as objects
commands = [];
{
    commands.push({
        names: ["info", "i"],
        parameter: "",
        description: "Get Bot info",
        longDescription: "Lists the GitHub link to the source code and provides a link so you can add the bot to your own server.",
        module: "main",
        func: function (message, args) { return info(message); }
    });
    commands.push({
        names: ["help", "h"],
        parameter: "[<Module | Command>]",
        description: "Get help!",
        longDescription: "If you enter a module, this command shows all affiliated commands in a list.\nIf you enter a command, an info embed will pop up.\nYou can enter multiple modules/commands (also mixed together) by separating them with spaces.\nDefaults to 'all', which lists all commands.",
        example: "?help main music purge ban",
        module: "main",
        func: function (message, args) { return help(message, args); }
    });
    commands.push({
        names: ["modules", "mod"],
        parameter: "",
        description: "List all modules",
        longDescription: "Lists all available modules you can request via the help function.",
        module: "main",
        func: function (message, args) { return listModules(message); }
    });
    commands.push({
        names: ["play", "add"],
        parameter: "<YT-URL>",
        description: "Add a song",
        longDescription: "Adds a song to the queue. If no queue exists, enters your voice channel (you have to be in one!) and starts playing.",
        example: "?play https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        module: "music",
        func: function (message, args) { return music.execute(message, args); }
    });
    commands.push({
        names: ["search"],
        parameter: "<query>",
        description: "Search YouTube",
        longDescription: "Lists the first results of a youtube search.\nIf you enter a number as last argument, the function takes this as the number of results it will show. Default is 5.",
        example: "?search PlanetChili Hardware 3D 3\n>> Outputs the first 3 results for this query.",
        module: "music",
        func: function (message, args) { return music.search(message, args); }
    });
    commands.push({
        names: ["playlist"],
        parameter: "<YT-URL>",
        description: "Add a YT-playlist",
        longDescription: "Adds an entire YouTube-playlist to the queue. If no queue exists, enters your voice channel (you have to be in one!) and starts playing.",
        example: "?playlist https://www.youtube.com/playlist?list=PL2GCi6aTvU1I5fcBnHQuE1-Cbw-9zXGqb",
        module: "music",
        func: function (message, args) { return music.addPlaylist(message, args); }
    });
    commands.push({
        names: ["pause", "p"],
        parameter: "",
        description: "Pause",
        longDescription: "Immediatly pauses the music. Type '?resume' to continue.",
        module: "music",
        func: function (message, args) { return music.pause(message); }
    });
    commands.push({
        names: ["resume", "res", "continue", "r"],
        parameter: "",
        description: "Resume",
        longDescription: "Use this to continue playing after the music is paused.",
        module: "music",
        func: function (message, args) { return music.resume(message); }
    });
    commands.push({
        names: ["rejoin"],
        parameter: "",
        description: "Rejoin voice channel",
        longDescription: "If the bot drops out due to unknown reasons, try this to bring it back in.\nDespite best effort, this function often does not help.",
        module: "music",
        func: function (message, args) { return music.rejoin(message); }
    });
    commands.push({
        names: ["skip", "s"],
        parameter: "<int = 1>",
        description: "Skip songs",
        longDescription: "Skip one or more songs. The parameter dictates how many songs you will be skipping.",
        example: "?skip 3",
        module: "music",
        func: function (message, args) { return music.skip(message, args); }
    });
    commands.push({
        names: ["unskip", "us"],
        parameter: "<int = 1>",
        description: "Unskip songs",
        longDescription: "Skipped too much? Bot wasn't able to play the song? Unskip multiple songs to bring the back of the queue in front.",
        example: "?unskip 2",
        module: "music",
        func: function (message, args) { return music.unskip(message, args); }
    });
    commands.push({
        names: ["queue", "q"],
        parameter: "<page [,endPage]>",
        description: "List songs",
        longDescription: "List pages of the queue. A page contains 10 songs. Default is one.\nTo list the entire queue, enter 'all'.",
        example: "?queue 3 5\n>> Shows page 3 to 5.",
        module: "music",
        func: function (message, args) { return music.list(message, args); }
    });
    commands.push({
        names: ["volume", "vol", "v"],
        parameter: "[<float | res>]",
        description: "Set/get the volume",
        longDescription: "If you enter a number, this function sets the volume to this number.\nIf no number is entered, returns the active volume.\nIf you enter 'res', sets default (5).",
        example: "?volume 3",
        module: "music",
        func: function (message, args) { return music.vol(message, args); }
    });
    commands.push({
        names: ["shuffle", "random", "randomize"],
        parameter: "",
        description: "Shuffle",
        longDescription: "Change your monotone playlist to enjoy a better mix!",
        module: "music",
        func: function (message, args) { return music.shuffle(message); }
    });
    commands.push({
        names: ["looping", "loop"],
        parameter: "[<true/false>]",
        description: "Set/get looping status",
        longDescription: "Looping determines whether a played song is discarded or added at the end of the queue.\nEnter 'true' or 'false' to set the looping status. If no parameter is entered, returns the active status. Default is true.",
        module: "music",
        func: function (message, args) { return music.setLooping(message, args); }
    });
    commands.push({
        names: ["count", "c", "number"],
        parameter: "",
        description: "Count songs",
        longDescription: "Counts, how many songs there are in queue.",
        module: "music",
        func: function (message, args) { return music.count(message); }
    });
    commands.push({
        names: ["now", "np"],
        parameter: "",
        description: "Show what is live",
        longDescription: "Returns the title of the songs that is currently being played. To get a link, type '?link'.\nTo get who added the song, type '?who'.",
        module: "music",
        func: function (message, args) { return music.now(message); }
    });
    commands.push({
        names: ["time", "t"],
        parameter: "",
        description: "Show song timer",
        longDescription: "Displays the elapsed time of the song as well as the entire song length.",
        module: "music",
        func: function (message, args) { return music.time(message); }
    });
    commands.push({
        names: ["link"],
        parameter: "<int = 1>",
        description: "Get a song link",
        longDescription: "Returns the link of a song. Your parameter specifies, which one: enter a queue position. Defaults to the current song (1).",
        example: "?link 3",
        module: "music",
        func: function (message, args) { return music.link(message, args); }
    });
    commands.push({
        names: ["again", "replay", "rp"],
        parameter: "",
        description: "Restart song",
        longDescription: "Rewind time and start playing the currently live song again.",
        module: "music",
        func: function (message, args) { return music.again(message); }
    });
    commands.push({
        names: ["playnow", "playdirect", "force"],
        parameter: "<YT-URL>",
        description: "Play a song instant",
        longDescription: "Pushes URL to the front of the queue, ends current track (will then be 2nd place in the queue) and starts playing this requested song.",
        example: "?playnow https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        module: "music",
        func: function (message, args) { return music.playDirect(message, args); }
    });
    commands.push({
        names: ["who", "requested"],
        parameter: "",
        description: "Who added this?",
        longDescription: "Displays and tags the user who added the song that is currently being played.",
        module: "music",
        func: function (message, args) { return music.requested(message); }
    });
    commands.push({
        names: ["remove", "delete", "del"],
        parameter: "<int = 1>",
        description: "Remove a song",
        longDescription: "Completely deletes a song from the queue. Your parameter is the queue position, the default is the song that is live.\nAttention if you want to remove multiple songs: This shifts songs that were positioned after this song one place to the front. To be safe, remove songs in descending order.",
        example: "?remove 3",
        module: "music",
        func: function (message, args) { return music.remove(message, args); }
    });
    commands.push({
        names: ["duplicates", "removeDoubles"],
        parameter: "",
        description: "Remove duplicates",
        longDescription: "Removes all songs with the same URL from the queue.",
        module: "music",
        func: function (message, args) { return music.removeDoubles(message); }
    });
    commands.push({
        names: ["finish", "end"],
        parameter: "",
        description: "End playing - FINAL!",
        longDescription: "Deletes queue but keeps the first song. As result, the active song will play to the end and then the bot will stop.",
        module: "music",
        func: function (message, args) { return music.finish(message); }
    });
    commands.push({
        names: ["clear", "cls"],
        parameter: "",
        description: "Delete all - FINAL!",
        longDescription: "Removes everything, ends currently playing track and drops out of the voice channel.",
        module: "music",
        func: function (message, args) { return music.clear(message); }
    });
    commands.push({
        names: ["save", "write"],
        parameter: "<name>",
        description: "Save queue",
        longDescription: "If there is no save with this name, creates a new file and writes the URLs.\nIf there is a save with this name, adds the URLs to that save.",
        module: "music",
        func: function (message, args) { return music.write(message, args); }
    });
    commands.push({
        names: ["load", "l"],
        parameter: "<name>",
        description: "Load songs",
        longDescription: "Loads a previously saved file. Adds all songs to the queue (does not delete it).",
        example: "?load music",
        module: "music",
        func: function (message, args) { return music.load(message, args); }
    });
    commands.push({
        names: ["ban"],
        parameter: "<user, reason>",
        description: "Ban a user!",
        longDescription: "Bans a user from the entire Discord Server. You need the permissions to evoke this command.",
        module: "moderator",
        func: function (message, args) { return mod.ban(message, args); }
    });
    commands.push({
        names: ["purge"],
        parameter: "<int>",
        description: "Delete messages",
        longDescription: "Deletes the last messages, you can enter up to 200. You need the permission to manage messages.",
        module: "moderator",
        func: function (message, args) { return mod.purge(message, args); }
    });
    commands.push({
        names: ["rps"],
        parameter: "<r|p|s>",
        description: "Play against the bot!",
        longDescription: "Plays rock, paper, scissors against the bot.",
        module: "fun",
        func: function (message, args) { return fun.rps(message, args); }
    });
    commands.push({
        names: ["flip"],
        parameter: "",
        description: "Flip a coin",
        longDescription: "Will result in Heads (50%) or Tails (50%). If you need to make a decision...",
        module: "fun",
        func: function (message, args) { return fun.flip(message); }
    });
    commands.push({
        names: ["randomColor", "randColor", "randomRGB", "randomcolor"],
        parameter: "",
        description: "Get a random color",
        longDescription: "Displays an embed filled with RGB and hex code to a random color.",
        module: "fun",
        func: function (message, args) { return fun.randomColor(message); }
    });
}

//Define all modules as objects
modules = [];
{
    modules.push({
        names: ["Main", "main"],
        description: "MAIN MODULE"
    });
    modules.push({
        names: ["Music", "music"],
        description: "MUSIC MODULE"
    });
    modules.push({
        names: ["Fun", "fun"],
        description: "FUN MODULE"
    });
    modules.push({
        names: ["Moderator", "moderator"],
        description: "MODERATOR MODULE - PERMISSIONS REQUIRED"
    });
}

function listModules(message) {
    mods = "Available modules: " + modules[0].names[0];
    for (i = 1; i < modules.length; i++) {
        mods += ", ";
        mods += modules[i].names[0];
    }
    mods += ".";
    return message.channel.send(mods);
}

function info(message) {
    embed = new Discord.MessageEmbed();
    embed.setColor('#1c061b');
    embed.setTitle("Meme God - Info");
    embed.addFields(
        { name: 'GitHub', value: "https://github.com/Fractum34254/DiscordBot" },
        { name: 'Add Bot to own server', value: "https://discordapp.com/api/oauth2/authorize?client_id=694262365608345671&scope=bot&permissions=8" }
    );
    embed.setThumbnail('https://imgur.com/ZL5kZpK.png')
    embed.setFooter("Meme God Bot by Fractum#3592");
    embed.setTimestamp();
    message.channel.send(embed);
}

function help(message, args) {
    //no arguments: print all
    if (args.length == 0) {
        args.push("all");
    }
    //if listing all, remove all modules from arguments, then put every module in once:
    if (args.find(function (elem) { return (elem == "all"); })) {
        for (i = 0; i < args.length; i++) {
            foundArg = false;
            if (args[i] == "all") {
                foundArg = true;
                args.splice(i, 1);
                i--;
            }
            for (j = 0; (!foundArg) && (j < modules.length); j++) {
                for (k = 0; (!foundArg) && (k < modules[j].names.length); k++) {
                    if (modules[j].names[k] == args[i]) {
                        foundArg = true;
                        args.splice(i, 1);
                        i--;
                    }
                }
            }
        }
        for (i = modules.length - 1; i >= 0; i--) {
            args.unshift(modules[i].names[0]);
        }
    }
    //replace all inputs with the first name of the module/command --> unified names
    for (i = 0; i < args.length; i++) {
        found = false;
        for (j = 0; j < modules.length && !found; j++) {
            for (k = 0; k < modules[j].names.length && !found; k++) {
                if (args[i] == modules[j].names[k]) {
                    args[i] = modules[j].names[0];
                    found = true;
                }
            }
        }
        for (j = 0; j < commands.length && !found; j++) {
            for (k = 0; k < commands[j].names.length && !found; k++) {
                if (args[i] == commands[j].names[k]) {
                    args[i] = commands[j].names[0];
                    found = true;
                }
            }
        }
        if (!found) {
            util.logUserError("User entered non-registered module/command", "main: help", message.author, "Current parameter: " + args[i] + " | All parameters: " + util.arrToString(args, " "));
            return message.channel.send("Unknown module/command: " + args[i]);
        }
    }
    //remove duplicates to avoid spam (only list every module/command once)
    for (i = 0; i < args.length; i++) {
        for (j = i + 1; j < args.length; j++) {
            if (args[j] == args[i]) {
                args.splice(j--, 1);
            }
        }
    }

    //loop trough all functions to find biggest name + parameter & description
    longestName = 0;
    longestDesc = 0;
    for (i = 0; i < commands.length; i++) {
        name = commands[i].names[0];
        name += " ";
        name += commands[i].parameter;
        longestName = Math.max(longestName, name.length);
        longestDesc = Math.max(longestDesc, commands[i].description.length);
    }

    //loop trough all modules/commands and compose individual blocks/embeds
    for (a = 0; a < args.length; a++) {
        i = 0;
        foundObject = false;
        command = false;
        for (j = 0; j < modules.length && !foundObject; j++) {
            if (args[a] === modules[j].names[0]) {
                i = j;
                foundObject = true;
            }
        }
        for (j = 0; j < commands.length && !foundObject; j++) {
            if (args[a] === commands[j].names[0]) {
                i = j;
                foundObject = true;
                command = true;
            }
        }
        if (!foundObject) {
            util.logErr("Unknown module/command despite of testing!", "main: help: compose blocks", "None");
            return message.channel.send("Something went terribly wrong :(");
        }
        if (!command) {
            //head
            text = "```diff\n"
            text += "+ ";
            text += modules[i].description;
            text += " +\n+ Currently, there are ";
            //count all commands that are attached to this module and contain them in a seperate text
            list = "";
            count = 0;
            for (j = 0; j < commands.length; j++) {
                found = false;
                for (k = 0; k < modules[i].names.length && !found; k++) {
                    if (commands[j].module === modules[i].names[k]) {
                        count++;
                        found = true;
                        name = commands[j].names[0];
                        name += " ";
                        name += commands[j].parameter;
                        list += util.trimString(name, longestName);
                        list += " - ";
                        list += util.trimString(commands[j].description, longestDesc);
                        list += " - ";
                        if (commands[j].names.length >= 2) {
                            list += commands[j].names[1];
                            for (n = 2; n < commands[j].names.length; n++) {
                                list += ", ";
                                list += commands[j].names[n];
                            }
                        }
                        list += "\n";
                    }
                }
            }
            text += count;
            text += " commands available +\n";
            text += util.trimString("Command <arguments>", longestName + 3);
            text += util.trimString("Description", longestDesc + 3);
            text += "Aliases\n";
            //attach command list
            text += list;
            text += "```";
            //send text
            message.channel.send(text);
        }
        else {
            //create embed
            embed = new Discord.MessageEmbed();
            embed.setColor('#1c061b');
            embed.setTitle("Help: " + commands[i].names[0]);
            embed.addFields(
                { name: 'Aliases', value: util.arrToString(commands[i].names.slice(1), ", ", "---"), inline: true },
                { name: 'Parameter', value: (commands[i].parameter == "") ? "---" : commands[i].parameter, inline: true },
                { name: 'Module', value: commands[i].module, inline: true },
                { name: 'Description', value: commands[i].longDescription }
            );
            if (commands[i].example) {
                embed.addField('Example', commands[i].example);
            }
            embed.setFooter("Meme God Bot by Fractum#3592");
            embed.setTimestamp();
            message.channel.send(embed);
        }
    }
}

module.exports = {
    help: help,
    listModules: listModules
}

client.once("ready", () => {

    util.logInfo("Bot started & connected", "app: ready", "None");

});

client.once("reconnecting", () => {

    util.logInfo("Bot reconnecting", "app: reconnecting", "None");

});

client.once("disconnect", () => {

    util.logInfo("Bot disconnected", "app: disconnect", "None");

});

client.on("message", async message => {
    try {
        if (!message.content.startsWith(prefix)) return;

        message.content = message.content.substr(1);
        var args = message.content.split(" ");
        args = args.filter(function (value, index, arr) { return (value != ""); });
        const first = args.shift();

        //search commands for proper command
        for (i = 0; i < commands.length; i++) {
            for (j = 0; j < commands[i].names.length; j++) {
                if (commands[i].names[j] === first) {
                    commands[i].func(message, args);
                    return;
                }
            }
        }
        //no command found --> error
        args.unshift(first);
        util.logUserError("User did not enter a valid command.", "message listener", message.author, "Parameter: " + util.arrToString(args, " "));
        message.channel.send("Please enter a valid command!");
    }
    catch (err) {
        util.logErr(err, "message listener: final catch embrace", "None");
        message.channel.send("Something in the message listener went wrong.");
    }
});

// Create an event listener for new guild members
client.on('guildMemberAdd', member => {
    // Send the message to a designated channel on a server:
    const channel = member.guild.channels.cache.find(ch => ch.name === 'dev-chat');
    // Do nothing if the channel wasn't found on this server
    if (!channel) return util.logErr("Did not find channel 'dev-chat' while trying to annouce new member!", "main: new member listener", "New user: " + member);
    // Send the message, mentioning the member
    return channel.send(`${member} is new on the server. <@688091839643123728> give them a role and a nickname!`);
});

//VERY IMPORTANT TO CALL THESE!!
client.login(token);