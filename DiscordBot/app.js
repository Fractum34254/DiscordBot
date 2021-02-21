const { prefix, token } = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

const music = require('./musicModule.js');
const fun = require('./funModule.js');
const util = require('./Utility.js');
const mod = require('./moderatorModule.js');

const EventEmitter = require('events');
class OwnEvent extends EventEmitter { }
const globalEvents = new OwnEvent();

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
var reactionChecks = [];

//Error handling - last instance
process.on('uncaughtException', (err, origin) => {
    // inform Devs on origin server
    // Send the message to a designated channel on the server:
    const guild = client.guilds.resolve('688081153361576013');
    if (!guild) {
        util.logErr("Did not find guild '688081153361576013' while trying to inform about crash!", "main: uncaughtException listener", "You missed an exception case somewhere!");
    }
    else {
        const channel = guild.channels.cache.find(ch => ch.name === 'dev-chat');
        // Do nothing if the channel wasn't found on this server
        if (!channel) {
            util.logErr("Did not find channel 'dev-chat' while trying to inform about crash!", "main: uncaughtException listener", "You missed an exception case somewhere!");
        }
        else {
            // Send the message, mentioning the Devs
            channel.send(`The bot caught an horrible exception. ${guild.roles.resolve('688091839643123728')}s check the console!`);
        }
    }
    return util.logErr(err, "main: uncaughtException handler", origin);
});

//classes to enable Input/Output from/to console

class ConsoleAuthor {
    constructor() {
        this.tag = "ConsoleUser";
        this.id = "292056469384331276";
    }
}

class ConsoleChannel {
    constructor() {
        this.name = "Console";
    }
    bulkDelete()
    {
        let user = new ConsoleAuthor();
        util.logUserError("You can't delete messages in the console!", "app: ConsoleChannel: bulkDelete", user, "");
    } 
    send(inputMsg) {
        if (inputMsg.constructor.name == "MessageEmbed") {
            //handle embeds (deconstruct them)
            console.log("Detected embed!");
        }
        else if (typeof inputMsg == "string") {
            //text
            console.log(inputMsg);
        }
        else {
            //error
            let user = new ConsoleAuthor();
            util.logUserError("Could not detect input.", "app: ConsoleChannel: bulkDelete", user, "");
        }
        //return a sent message
        let msg = {};
        msg.delete = function () { };
        return msg;
    }
}

class ConsoleMessage {
    constructor(content) {
        this.content = content;
        this.author = new ConsoleAuthor();
        this.channel = new ConsoleChannel();
    }
}

//Define all commands as objects
commands = [];
class Command {
    constructor(names, parameter, description, longDescription, example, module, func) {
        this.names = names;
        this.parameter = parameter;
        this.description = description;
        this.longDescription = longDescription;
        this.example = example;
        this.module = module;
        this.func = func;
    }
    names;
    parameter;
    description;
    longDescription;
    example;
    module;
    func;
}
{
    commands.push(Command(
        ["info", "i"],
        "",
        "Get Bot info",
        "Lists the GitHub link to the source code and provides a link so you can add the bot to your own server.",
        undefined,
        "main",
        function (message, args) { return info(message); }));
    commands.push(Command(
        ["help", "h"],
        "[<Module | Command>]",
        "Get help!",
        "If you enter a module, this command shows all affiliated commands in a list.\nIf you enter a command, an info embed will pop up.\nYou can enter multiple modules/commands (also mixed together) by separating them with spaces.\nDefaults to 'all', which lists all commands.",
        "?help main music purge ban",
        "main",
        function (message, args) { return help(message, args); }));
    commands.push(Command(
        ["modules", "mod"],
        "",
        "List all modules",
        "Lists all available modules you can request via the help function.",
        undefined,
        "main",
        function (message, args) { return listModules(message); }));
    commands.push(Command(
        ["play", "add"],
        "<YT-URL>",
        "Add a song",
        "Adds a song to the queue. If no queue exists, enters your voice channel (you have to be in one!) and starts playing.",
        "?play https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "music",
        function (message, args) { return music.execute(message, args); }));
    commands.push(Command(
        ["search"],
        "<query>",
        "Search YouTube",
        "Lists the first results of a youtube search.\nIf you enter a number as last argument, the function takes this as the number of results it will show. Default is 5.",
        "?search PlanetChili Hardware 3D 3\n>> Outputs the first 3 results for this query.",
        "music",
        function (message, args) { return music.search(message, args); }));
    commands.push(Command(
        ["playlist"],
        "<YT-URL>",
        "Add a YT-playlist",
        "Adds an entire YouTube-playlist to the queue. If no queue exists, enters your voice channel (you have to be in one!) and starts playing.",
        "?playlist https://www.youtube.com/playlist?list=PL2GCi6aTvU1I5fcBnHQuE1-Cbw-9zXGqb",
        "music",
        function (message, args) { return music.addPlaylist(message, args); }));
    commands.push(Command(
        ["pause", "p"],
        "",
        "Pause",
        "Immediatly pauses the music. Type '?resume' to continue.",
        undefined,
        "music",
        function (message, args) { return music.pause(message); }));
    commands.push(Command(
        ["resume", "res", "continue", "r"],
        "",
        "Resume",
        "Use this to continue playing after the music is paused.",
        undefined,
        "music",
        function (message, args) { return music.resume(message); }));
    commands.push(Command(
        ["rejoin"],
        "",
        "Rejoin voice channel",
        "If the bot drops out due to unknown reasons, try this to bring it back in.\nDespite best effort, this function often does not help.",
        undefined,
        "music",
        function (message, args) { return music.rejoin(message); }));
    commands.push(Command(
        ["skip", "s"],
        "<int = 1>",
        "Skip songs",
        "Skip one or more songs. The parameter dictates how many songs you will be skipping.",
        "?skip 3",
        "music",
        function (message, args) { return music.skip(message, args); }));
    commands.push(Command(
        ["unskip", "us"],
        "<int = 1>",
        "Unskip songs",
        "Skipped too much? Bot wasn't able to play the song? Unskip multiple songs to bring the back of the queue in front.",
        "?unskip 2",
        "music",
        function (message, args) { return music.unskip(message, args); }));
    commands.push(Command(
        ["queue", "q"],
        "<page [,endPage]>",
        "List songs",
        "List pages of the queue. A page contains 10 songs. Default is one.\nTo list the entire queue, enter 'all'.",
        "?queue 3 5\n>> Shows page 3 to 5.",
        "music",
        function (message, args) { return music.list(message, args); }));
    commands.push(Command(
        ["volume", "vol", "v"],
        "[<float | res>]",
        "Set/get the volume",
        "If you enter a number, this function sets the volume to this number.\nIf no number is entered, returns the active volume.\nIf you enter 'res', sets default (5).",
        "?volume 3",
        "music",
        function (message, args) { return music.vol(message, args); }));
    commands.push(Command(
        ["shuffle", "random", "randomize"],
        "",
        "Shuffle",
        "Change your monotone playlist to enjoy a better mix!",
        undefined,
        "music",
        function (message, args) { return music.shuffle(message); }));
    commands.push(Command(
        ["looping", "loop"],
        "[<true/false>]",
        "Set/get looping status",
        "Looping determines whether a played song is discarded or added at the end of the queue.\nEnter 'true' or 'false' to set the looping status. If no parameter is entered, returns the active status. Default is true.",
        undefined,
        "music",
        function (message, args) { return music.setLooping(message, args); }));
    commands.push(Command(
        ["count", "c", "number"],
        "",
        "Count songs",
        "Counts, how many songs there are in queue.",
        undefined,
        "music",
        function (message, args) { return music.count(message); }));
    commands.push(Command(
        ["now", "np"],
        "",
        "Show what is live",
        "Returns the title of the songs that is currently being played. To get a link, type '?link'.\nTo get who added the song, type '?who'.",
        undefined,
        "music",
        function (message, args) { return music.now(message); }));
    commands.push(Command(
        ["time", "t"],
        "",
        "Show song timer",
        "Displays the elapsed time of the song as well as the entire song length.",
        undefined,
        "music",
        function (message, args) { return music.time(message); }));
    commands.push(Command(
        ["link"],
        "<int = 1>",
        "Get a song link",
        "Returns the link of a song. Your parameter specifies, which one: enter a queue position. Defaults to the current song (1).",
        "?link 3",
        "music",
        function (message, args) { return music.link(message, args); }));
    commands.push(Command(
        ["again", "replay", "rp"],
        "",
        "Restart song",
        "Rewind time and start playing the currently live song again.",
        undefined,
        "music",
        function (message, args) { return music.again(message); }));
    commands.push(Command(
        ["playnow", "playdirect", "force"],
        "<YT-URL>",
        "Play a song instant",
        "Pushes URL to the front of the queue, ends current track (will then be 2nd place in the queue) and starts playing this requested song.",
        "?playnow https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "music",
        function (message, args) { return music.playDirect(message, args); }));
    commands.push(Command(
        ["who", "requested"],
        "",
        "Who added this?",
        "Displays and tags the user who added the song that is currently being played.",
        undefined,
        "music",
        function (message, args) { return music.requested(message); }));
    commands.push(Command(
        ["remove", "delete", "del"],
        "<int = 1>",
        "Remove a song",
        "Completely deletes a song from the queue. Your parameter is the queue position, the default is the song that is live.\nAttention if you want to remove multiple songs: This shifts songs that were positioned after this song one place to the front. To be safe, remove songs in descending order.",
        "?remove 3",
        "music",
        function (message, args) { return music.remove(message, args); }));
    commands.push(Command(
        ["duplicates", "removeDoubles"],
        "",
        "Remove duplicates",
        "Removes all songs with the same URL from the queue.",
        "music",
        function (message, args) { return music.removeDoubles(message); }));
    commands.push(Command(
        ["finish", "end"],
        "",
        "End playing - FINAL!",
        "Deletes queue but keeps the first song. As result, the active song will play to the end and then the bot will stop.",
        "music",
        function (message, args) { return music.finish(message); }));
    commands.push(Command(
        ["clear", "cls"],
        "",
        "Delete all - FINAL!",
        "Removes everything, ends currently playing track and drops out of the voice channel.",
        undefined,
        "music",
        function (message, args) { return music.clear(message); }));
    commands.push(Command(
        ["save", "write"],
        "<name>",
        "Save queue",
        "If there is no save with this name, creates a new file and writes the URLs.\nIf there is a save with this name, adds the URLs to that save.",
        undefined,
        "music",
        function (message, args) { return music.write(message, args); }));
    commands.push(Command(
        ["load", "l"],
        "<name>",
        "Load songs",
        "Loads a previously saved file. Adds all songs to the queue (does not delete it).",
        "?load music",
        "music",
        function (message, args) { return music.load(message, args); }));
    commands.push(Command(
        ["loadShuffled", "ls"],
        "<name>",
        "Load songs shuffled",
        "Loads a previously saved file. Adds all songs to the queue (does not delete it). Shuffles them before adding.",
        "?ls music",
        "music",
        function (message, args) { return music.loadShuffled(message, args); }));
    commands.push(Command(
        ["memory", "listLists", "mem"],
        "",
        "Show saved queues",
        "Lists the names of all available queues. Use load/loadShuffled <listName> to add one to the existing queue!",
        "?memory",
        "music",
        function (message, args) { return music.listLists(message); }));
    commands.push(Command(
        ["ban"],
        "<user, reason>",
        "Ban a user!",
        "Bans a user from the entire Discord Server. You need the permissions to evoke this command.",
        undefined,
        "moderator",
        function (message, args) { return mod.ban(message, args); }));
    commands.push(Command(
        ["purge"],
        "<int>",
        "Delete messages",
        "Deletes the last messages, you can enter up to 99. You need the permission to manage messages.",
        undefined,
        "moderator",
        function (message, args) { return mod.purge(message, args); }));
    commands.push(Command(
        ["kill"],
        "",
        "End bot",
        "Terminates the process of the bot completely. Only available to whitelisted users. Saves the current queue. Restore after restart via 'restore'.",
        undefined,
        "moderator",
        function (message, args) { return mod.kill(message); }));
    commands.push(Command(
        ["reactionRoles"],
        "[...]",
        "UNSAFE, DO NOT TRY",
        "Addes/Removes roles if a user reacts to a specific message.\nParameter: [rolesToAdd]; [rolesToRemove]; messageID; emoji",
        undefined,
        "moderator",
        function (message, args) { return mod.reactionRoles(message, args, reactionChecks); }));
    commands.push(Command(
        ["restore"],
        "",
        "Load last queue",
        "Loades the queue the bot saved when the last 'kill' command was executed.",
        undefined,
        "moderator",
        function (message, args) { return mod.restore(message); }));
    commands.push(Command(
        ["rps"],
        "<r|p|s>",
        "Play against the bot!",
        "Plays rock, paper, scissors against the bot.",
        undefined,
        "fun",
        function (message, args) { return fun.rps(message, args); }));
    commands.push(Command(
        ["flip"],
        "",
        "Flip a coin",
        "Will result in Heads (50%) or Tails (50%). If you need to make a decision...",
        undefined,
        "fun",
        function (message, args) { return fun.flip(message); }));
    commands.push(Command(
        ["randomColor", "randColor", "randomRGB", "randomcolor"],
        "",
        "Get a random color",
        "Displays an embed filled with RGB and hex code to a random color.",
        undefined,
        "fun",
        function (message, args) { return fun.randomColor(message); }));
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
            let list = [];
            list[0] = "";
            let listCounter = 0;
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
                        list[listCounter] += util.trimString(name, longestName);
                        list[listCounter] += " - ";
                        list[listCounter] += util.trimString(commands[j].description, longestDesc);
                        list[listCounter] += " - ";
                        list[listCounter] += commands[j].names.slice(1,commands[j].names.length).join(", ");
                        list[listCounter] += "\n";
                        if (list[listCounter].length >= 1700) {
                            listCounter++;
                            list[listCounter] = "```diff\n";
                        }
                    }
                }
            }
            text += count;
            text += " commands available +\n";
            text += util.trimString("Command <arguments>", longestName + 3);
            text += util.trimString("Description", longestDesc + 3);
            text += "Aliases\n";
            //attach command list
            text += list[0];
            text += "```";
            //send text
            message.channel.send(text);
            //send all other blocks
            list.splice(0, 1);
            for (block in list) {
                if (list[block] != "```diff\n") {
                    list[block] += "```";
                    message.channel.send(list[block]);
                }
            }
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
    }
    catch (err) {
        util.logErr(err, "message listener: final catch embrace", "None");
        message.channel.send("Something in the message listener went wrong.");
    }
});

// Create an event listener for new guild members
client.on('guildMemberAdd', member => {
    //only log new users on specific server, ignore all other
    if (member.guild.id != client.guilds.resolve('688081153361576013').id) {
        return;
    }
    // Send the message to a designated channel on a server:
    const channel = member.guild.channels.cache.find(ch => ch.name === 'dev-chat');
    // Do nothing if the channel wasn't found on this server
    if (!channel) return util.logErr("Did not find channel 'dev-chat' while trying to annouce new member!", "main: new member listener", "New user: " + member);
    // Send the message, mentioning the member
    return channel.send(`${member} is new on the server. <@688091839643123728> give them a role and a nickname!`);
});

//VERY IMPORTANT TO CALL THESE!!
client.login(token);

//look for raw input for reaction emojis
client.on('raw', packet => {
    // We don't want this to run on unrelated packets
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    // Grab the channel to check the message from
    try {
        client.channels.fetch(packet.d.channel_id).then(channel => {
            // Since we have confirmed the message is not cached, let's fetch it
            channel.messages.fetch(packet.d.message_id).then(message => {
                // Check which type of event it is before emitting
                if (packet.t === 'MESSAGE_REACTION_ADD') {
                    globalEvents.emit('messageReactionAddCustom', packet.d.emoji.name, packet.d.member, message);
                }
                if (packet.t === 'MESSAGE_REACTION_REMOVE') {
                    message.guild.members.fetch(packet.d.user_id).then(member => {
                        globalEvents.emit('messageReactionRemoveCustom', packet.d.emoji.name, member, message);
                    });
                }
            });
        });
    }
    catch (err) {
        util.logErr(err, "on raw packet", "None");
    };
});

globalEvents.on('messageReactionAddCustom', (reaction, user, msg) => {
    reactionChecks.forEach(item => {
        item.ReactionAdded(msg, user, reaction);
    });
});

globalEvents.on('messageReactionRemoveCustom', (reaction, user, msg) => {
    reactionChecks.forEach(item => {
        item.ReactionRemoved(msg, user, reaction);
    });
});

//Look for console input
rl.on('line', (input) => {
    let message = new ConsoleMessage(input);
    try {
        if (message.content.startsWith(prefix)) message.content = message.content.substr(1);
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
        util.logUserError("User did not enter a valid command.", "console message listener", message.author, "Parameter: " + util.arrToString(args, " "));
    }
    catch (err) {
        util.logErr(err, "console message listener: final catch embrace", "None");
    }
});