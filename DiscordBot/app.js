const { prefix, token } = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

const music = require('./musicModule.js');
const util = require('./Utility.js');

function help(message, args) {
    //no arguments: print all
    if (args.length == 0) {
        args.push("all");
    }
    //array of arrays of commands
    commands = [];
    //name array
    names = [];

    //if listing all, do a certain order:
    if (args.find(function (elem) { return (elem == "all"); })) {
        args = ["main", "music"];
    }

    //remove duplicates to avoid spam
    for (i = 0; i < args.length; i++) {
        for (j = i + 1; j < args.length; j++) {
            if (args[j] == args[i]) {
                args.splice(j--, 1);
            }
        }
    }
    
    for (i = 0; i < args.length; i++) {
        moduleCommands = [];
        switch (args[i]) {
            case "music":
                //add name to names array
                names.push("MUSIC MODULE");
                //list all music commands
                moduleCommands.push({ name: "play <YT-URL>", description: "Add song to the queue", aliases: "add" });
                moduleCommands.push({ name: "search <query, max = 5>", description: "Search for a query on YouTube", aliases: "" });
                moduleCommands.push({ name: "playlist <YT-URL>", description: "Add a YT-playlist to the queue", aliases: "" });
                moduleCommands.push({ name: "pause", description: "Pause the current song", aliases: "p" });
                moduleCommands.push({ name: "resume", description: "Resume after paused", aliases: "res, continue" });
                moduleCommands.push({ name: "skip <int = 1>", description: "Skip multiple songs", aliases: "s" });
                moduleCommands.push({ name: "unskip <int = 1>", description: "Unskip multiple songs", aliases: "us" });
                moduleCommands.push({ name: "queue <page = 1 | all>", description: "Show the queue", aliases: "q" });
                moduleCommands.push({ name: "volume <float = 5.0>", description: "Set the volume", aliases: "vol, v" });
                moduleCommands.push({ name: "shuffle", description: "Shuffle the queue", aliases: "random, randomize" });
                moduleCommands.push({ name: "looping [<true/false>]", description: "Set looping status, if no parameter shows status", aliases: "loop" });
                moduleCommands.push({ name: "count", description: "Show size of the queue", aliases: "c, number" });
                moduleCommands.push({ name: "now", description: "Show what is currently being played", aliases: "np" });
                moduleCommands.push({ name: "again", description: "Play current song again", aliases: "replay, rp" });
                moduleCommands.push({ name: "playnow <YT-URL>", description: "Immediatly play a song", aliases: "playdirect, force" });
                moduleCommands.push({ name: "who", description: "Show who requested this song", aliases: "requested" });
                moduleCommands.push({ name: "remove <int = 1>", description: "Remove song Nr.", aliases: "delete, del" });
                moduleCommands.push({ name: "duplicates", description: "Remove all duplicates from queue", aliases: "removeDoubles" });
                moduleCommands.push({ name: "clear", description: "Clear the entire queue - FINAL!", aliases: "cls" });
                moduleCommands.push({ name: "save <name>", description: "Attach the queue to a file", aliases: "write" });
                moduleCommands.push({ name: "load <name>", description: "Attach songs from a file to the queue", aliases: "l" });
                break;
            case "main":
                //add name to names array
                names.push("MAIN MODULE");
                //list all main commands
                moduleCommands.push({ name: "help <Module = all>", description: "This menu", aliases: "h" });
                break;
            default:
                util.logUserError("User entered non-registered module", "help", message.member, "Parameter: " + args[i]);
                return message.channel.send("Unknown module: " + args[i]);
        }
        commands.push(moduleCommands);
    }

    //find longest name, description over all shown commands
    nameSize = 0;
    descSize = 0;
    for (p = 0; p < commands.length; p++) {
        for (i = 0; i < commands[p].length; i++) {
            nameSize = Math.max(commands[p][i].name.length, nameSize)
            descSize = Math.max(commands[p][i].description.length, descSize);
        }
    }

    //for every command array in commands, make a seperate paragraph
    for (p = 0; p < commands.length; p++) {
        //create command list
        commandList = "```diff\n";
        const name = "+ " + names[p] + " +\n";
        commandList += name;
        const cur = `+ Currently, there are ${commands[p].length} commands available +\n`;
        commandList += cur;
        commandList += util.trimString("Command <arguments>", nameSize + 3, " ");
        commandList += util.trimString("Description", descSize + 3, " ");
        commandList += "Aliases\n";
        for (i = 0; i < commands[p].length; i++) {
            commandList += util.trimString(commands[p][i].name, nameSize, " ");
            commandList += " - ";
            commandList += util.trimString(commands[p][i].description, descSize, " ");
            commandList += " - ";
            commandList += commands[p][i].aliases;
            commandList += "\n";
        }
        commandList += "```";
        message.channel.send(commandList);
    }
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

    switch (first) {
        case "play":
        case "add":
            music.execute(message, args);
            break;
        case "skip":
        case "s":
            music.skip(message, args);
            break;
        case "unskip":
        case "us":
            music.unskip(message, args);
            break;
        case "pause":
        case "p":
            music.pause(message);
            break;
        case "queue":
        case "q":
            music.list(message, args);
            break;
        case "vol":
        case "volume":
        case "v":
            music.vol(message, args);
            break;
        case "again":
        case "replay":
        case "rp":
            music.again(message);
            break;
        case "looping":
        case "loop":
            music.setLooping(message, args);
            break;
        case "shuffle":
        case "random":
        case "randomize":
            music.shuffle(message);
            break;
        case "now":
        case "np":
            music.now(message);
            break;
        case "remove":
        case "delete":
        case "del":
            music.remove(message, args);
            break;
        case "resume":
        case "res":
        case "continue":
            music.resume(message);
            break;
        case "save":
        case "write":
            music.write(message, args);
            break;
        case "load":
        case "l":
            music.load(message, args);
            break;
        case "clear":
        case "cls":
            music.clear(message);
            break;
        case "count":
        case "c":
        case "number":
            music.count(message);
            break;
        case "who":
        case "requested":
            music.requested(message);
            break;
        case "duplicates":
        case "removeDoubles":
            music.removeDoubles(message);
            break;
        case "help":
        case "h":
            help(message, args);
            break;
        case "playnow":
        case "playdirect":
        case "force":
            music.playDirect(message, args);
            break;
        case "search":
            music.search(message, args);
            break;
        case "playlist":
            music.addPlaylist(message, args);
            break;
        default:
            message.channel.send("Please enter a valid command!");
    }

});

client.login(token);