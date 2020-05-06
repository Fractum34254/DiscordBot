const { prefix, token } = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

const music = require('./musicModule.js');
const fun = require('./funModule.js');
const util = require('./Utility.js');
const mod = require('./moderatorModule.js');

//Define all commands as objects
commands = [];
function initCommands() {
    commands.push({
        names: ["info", "i"],
        parameter: "",
        description: "Get Bot info",
        module: "main",
        func: function (message, args) { info(message); }
    });
    commands.push({
        names: ["help", "h"],
        parameter: "<Module = all>",
        description: "This menu",
        module: "main",
        func: function (message, args) { help(message, args); }
    });
    commands.push({
        names: ["modules", "mod"],
        parameter: "",
        description: "List all modules",
        module: "main",
        func: function (message, args) { listModules(message); }
    });
    commands.push({
        names: ["play", "add"],
        parameter: "<YT-URL>",
        description: "Add a song to the queue",
        module: "music",
        func: function (message, args) { music.execute(message, args); }
    });
    commands.push({
        names: ["search"],
        parameter: "<query, max = 5>",
        description: "Search YouTube",
        module: "music",
        func: function (message, args) { music.search(message, args); }
    });
    commands.push({
        names: ["playlist"],
        parameter: "<YT-URL>",
        description: "Add a YT-playlist to the queue",
        module: "music",
        func: function (message, args) { music.addPlaylist(message, args); }
    });
    commands.push({
        names: ["pause", "p"],
        parameter: "",
        description: "Pause the current song",
        module: "music",
        func: function (message, args) { music.pause(message); }
    });
    commands.push({
        names: ["resume", "res", "continue", "r"],
        parameter: "",
        description: "Resume after paused",
        module: "music",
        func: function (message, args) { music.resume(message); }
    });
    commands.push({
        names: ["rejoin", "force"],
        parameter: "",
        description: "Rejoin your voice channel",
        module: "music",
        func: function (message, args) { music.rejoin(message); }
    });
    commands.push({
        names: ["skip", "s"],
        parameter: "<int = 1>",
        description: "Skip (multiple) songs",
        module: "music",
        func: function (message, args) { music.skip(message, args); }
    });
    commands.push({
        names: ["unskip", "us"],
        parameter: "<int = 1>",
        description: "Unskip (multiple) songs",
        module: "music",
        func: function (message, args) { music.unskip(message, args); }
    });
    commands.push({
        names: ["q", "queue"],
        parameter: "<page | all [,endPage]>",
        description: "List the queue",
        module: "music",
        func: function (message, args) { music.list(message, args); }
    });
    commands.push({
        names: ["volume", "vol", "v"],
        parameter: "[<float | res>]",
        description: "Set/get the volume",
        module: "music",
        func: function (message, args) { music.vol(message, args); }
    });
    commands.push({
        names: ["shuffle", "random", "randomize"],
        parameter: "",
        description: "Shuffle the queue",
        module: "music",
        func: function (message, args) { music.shuffle(message); }
    });
    commands.push({
        names: ["looping", "loop"],
        parameter: "[<true/false>]",
        description: "Set/get looping status",
        module: "music",
        func: function (message, args) { music.setLooping(message, args); }
    });
    commands.push({
        names: ["count", "c", "number"],
        parameter: "",
        description: "Show size of the queue",
        module: "music",
        func: function (message, args) { music.count(message); }
    });
    commands.push({
        names: ["now", "np"],
        parameter: "",
        description: "Show what is on air",
        module: "music",
        func: function (message, args) { music.now(message); }
    });
    commands.push({
        names: ["time", "t"],
        parameter: "",
        description: "Show song timer",
        module: "music",
        func: function (message, args) { music.time(message); }
    });
    commands.push({
        names: ["link"],
        parameter: "<int = 1>",
        description: "Get the link to song nr.",
        module: "music",
        func: function (message, args) { music.link(message, args); }
    });
    commands.push({
        names: ["again", "replay", "rp"],
        parameter: "",
        description: "Play current song again",
        module: "music",
        func: function (message, args) { music.again(message); }
    });
    commands.push({
        names: ["playnow", "playdirect", "force"],
        parameter: "<YT-URL>",
        description: "Immediatly play a song",
        module: "music",
        func: function (message, args) { music.playDirect(message, args); }
    });
    commands.push({
        names: ["who", "requested"],
        parameter: "",
        description: "Show who added this song",
        module: "music",
        func: function (message, args) { music.requested(message); }
    });
    commands.push({
        names: ["remove", "delete", "del"],
        parameter: "<int = 1>",
        description: "Remove song nr. from the queue",
        module: "music",
        func: function (message, args) { music.remove(message, args); }
    });
    commands.push({
        names: ["duplicates", "removeDoubles"],
        parameter: "",
        description: "Remove all duplicates from queue",
        module: "music",
        func: function (message, args) { music.removeDoubles(message); }
    });
    commands.push({
        names: ["finish", "end"],
        parameter: "",
        description: "End after current song - FINAL!",
        module: "music",
        func: function (message, args) { music.finish(message); }
    });
    commands.push({
        names: ["clear", "cls"],
        parameter: "",
        description: "Clear the entire queue - FINAL!",
        module: "music",
        func: function (message, args) { music.clear(message); }
    });
    commands.push({
        names: ["save", "write"],
        parameter: "<name>",
        description: "Attach the queue to a file",
        module: "music",
        func: function (message, args) { music.write(message, args); }
    });
    commands.push({
        names: ["load", "l"],
        parameter: "<name>",
        description: "Add songs from file to the queue",
        module: "music",
        func: function (message, args) { music.load(message, args); }
    });
    commands.push({
        names: ["ban"],
        parameter: "<user, reason>",
        description: "Ban a user!",
        module: "moderator",
        func: function (message, args) { mod.ban(message, args); }
    });
    commands.push({
        names: ["purge"],
        parameter: "<int>",
        description: "Delete the last messages (up to 200)",
        module: "moderator",
        func: function (message, args) { mod.purge(message, args); }
    });
    commands.push({
        names: ["rps"],
        parameter: "<rock|paper|scissors>",
        description: "Play against the bot!",
        module: "fun",
        func: function (message, args) { fun.rps(message, args); }
    });
    commands.push({
        names: ["flip"],
        parameter: "",
        description: "Flip a coin",
        module: "fun",
        func: function (message, args) { fun.flip(message); }
    });
    commands.push({
        names: ["randomColor", "randColor", "randomRGB", "randomcolor"],
        parameter: "",
        description: "Get a random color",
        module: "fun",
        func: function (message, args) { fun.randomColor(message); }
    });
}

//Define all modules as objects
modules = [];
function initModules() {
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
        names: ["Moderator", "moderator", "mod", "Mod"],
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
    //if listing all, do a certain order:
    if (args.find(function (elem) { return (elem == "all"); })) {
        args = [];
        for (i = 0; i < modules.length; i++) {
            args.push(modules[i].names[0]);
        }
    }
    //replace all inputs with the first name of the module --> unified names
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
        if (!found) {
            util.logUserError("User entered non-registered module", "main: help", message.member, "Current parameter: " + args[i] + " | All parameters: " + util.arrToString(args, " "));
            return message.channel.send("Unknown module: " + util.arrToString(args, " "));
        }
    }
    //remove duplicates to avoid spam (only list every module once)
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

    //loop trough all modules and compose individual blocks
    for (a = 0; a < args.length; a++) {
        i = 0;
        foundModule = false;
        for (j = 0; j < modules.length && !foundModule; j++) {
            if (args[a] === modules[j].names[0]) {
                i = j;
                foundModule = true;
            }
        }
        if (!foundModule) {
            util.logErr("Unknown module despite of testing!", "main: help: compose blocks", "None");
            return message.channel.send("Something went terribly wrong :(");
        }
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
    util.logUserError("User did not enter a valid command.", "message listener", message.member, "Parameter: " + util.arrToString(args, " "));
    message.channel.send("Please enter a valid command!");
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
initCommands();
initModules();
client.login(token);