const { prefix, token } = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

const music = require('./musicModule.js');

client.once("ready", () => {

    console.log("Ready!");

});

client.once("reconnecting", () => {

    console.log("Reconnecting!");

});

client.once("disconnect", () => {

    console.log("Disconnect!");

});

client.on("message", async message => {
    if (!message.content.startsWith(prefix)) return;

    message.content = message.content.substr(1);
    const args = message.content.split(" ");
    const first = args.shift();

    switch (first) {
        case "play":
        case "p":
            music.execute(message, args);
            break;
        case "skip":
            music.skip(message, args);
            break;
        case "pause":
            music.pause(message);
            break;
        case "queue":
            music.list(message, args);
            break;
        case "vol":
        case "volume":
        case "v":
            music.vol(message, args);
            break;
        case "again":
            music.again(message);
            break;
        case "looping":
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
        case "s":
            music.write(message, args);
            break;
        case "load":
        case "l":
            music.load(message, args);
            break;
        case "clear":
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
        default:
            message.channel.send("Please enter a valid command!");
    }

});

client.login(token);