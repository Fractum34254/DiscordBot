const { prefix, token } = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

const music = require('./musicModule.js');
const fun = require('./funModule.js');
const util = require('./Utility.js');
const mod = require('./moderatorModule.js');
const main = require('./mainModule.js');

//Define all commands as objects
commands = [];
function initCommands() {
    commands.push({
        names: ["help", "h"],
        parameter: "<Module = all>",
        description: "This menu",
        module: "main",
        func: function (message, args) { main.help(message, args); }
    });
    commands.push({
        names: ["modules", "mod"],
        parameter: "",
        description: "List all modules",
        module: "main",
        func: function (message, args) { main.listModules(message); }
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
        names: ["resume", "res", "continue"],
        parameter: "",
        description: "Resume after paused",
        module: "music",
        func: function (message, args) { music.resume(message); }
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
        names: ["queue", "q"],
        parameter: "<page = 1 | all>",
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
        names: ["again", "replay", "rp"],
        parameter: "",
        description: "Play current song again",
        module: "music",
        func: function (message, args) { music.again(message); }
    });
    commands.push({
        names: ["playnow", "playdirect", "force"],
        parameter: "<YT-URL>",
        description: "Add a song to the front of the queue and play it",
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
        func: function (message, args) { music.execute(message, args); }
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
        description: "Attach songs from a file to the queue",
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
        description: "Delete the last messages up to 200",
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