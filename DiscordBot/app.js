const { prefix, token } = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

const music = require('./musicModule.js');
const util = require('./Utility.js');

function help(message) {
    //list all commands
    commands = [];
    commands.push({ name: "play <YT-URL>", description: "Add song to the queue", aliases: "add" });
    commands.push({ name: "search <query, max = 5>", description: "Search for a query on YouTube", aliases: "" });
    commands.push({ name: "playlist <YT-URL>", description: "Add a YT-playlist to the queue", aliases: "" });
    commands.push({ name: "pause", description: "Pause the current song", aliases: "p" });
    commands.push({ name: "resume", description: "Resume after paused", aliases: "res, continue" });
    commands.push({ name: "skip <int = 1>", description: "Skip multiple songs", aliases: "s" });
    commands.push({ name: "queue <page = 1 | all>", description: "Show the queue", aliases: "q" });
    commands.push({ name: "volume <float = 5.0>", description: "Set the volume", aliases: "vol, v" });
    commands.push({ name: "shuffle", description: "Shuffle the queue", aliases: "random, randomize" });
    commands.push({ name: "looping [<true/false>]", description: "Set looping status, if no parameter shows status", aliases: "loop" });
    commands.push({ name: "count", description: "Show size of the queue", aliases: "c, number" });
    commands.push({ name: "now", description: "Show what is currently being played", aliases: "np" });
    commands.push({ name: "again", description: "Play current song again", aliases: "replay, rp" });
    commands.push({ name: "playnow <YT-URL>", description: "Immediatly play a song", aliases: "playdirect, force" });
    commands.push({ name: "who", description: "Show who requested this song", aliases: "requested" });
    commands.push({ name: "remove <int = 1>", description: "Remove song Nr.", aliases: "delete, del" });
    commands.push({ name: "duplicates", description: "Remove all duplicates from queue", aliases: "removeDoubles" });
    commands.push({ name: "clear", description: "Clear the entire queue - FINAL!", aliases: "cls" });
    commands.push({ name: "save <name>", description: "Attach the queue to a file", aliases: "write" });
    commands.push({ name: "load <name>", description: "Attach songs from a file to the queue", aliases: "l" });
    commands.push({ name: "help", description: "This menu", aliases: "h" });

    //find longest name, description
    longNameInd = 0;
    longDescInd = 0;
    for (i = 0; i < commands.length; i++) {
        if (commands[i].name.length > commands[longNameInd].name.length) {
            longNameInd = i;
        }
        if (commands[i].description.length > commands[longDescInd].description.length) {
            longDescInd = i;
        }
    }
    const nameSize = commands[longNameInd].name.length;
    const descSize = commands[longDescInd].description.length;

    //create command list
    commandList = "```diff\n";
    const cur = `+ Currently, there are ${commands.length} commands available +\n`;
    commandList += cur;
    commandList += util.trimString("Command <arguments>", nameSize + 3, " ");
    commandList += util.trimString("Description", descSize + 3, " ");
    commandList += "Aliases\n";
    for (i = 0; i < commands.length; i++) {
        commandList += util.trimString(commands[i].name, nameSize, " ");
        commandList += " - ";
        commandList += util.trimString(commands[i].description, descSize, " ");
        commandList += " - ";
        commandList += commands[i].aliases;
        commandList += "\n";
    }
    commandList += "```";
    
    return message.channel.send(commandList);
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
    const args = message.content.split(" ");
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
            help(message);
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