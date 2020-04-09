const { prefix, token } = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

const music = require('./musicModule.js');

function help(message) {
    text = "";
    text += "```fix\nHelp menu - overview\n```\n";
    text += "```\nCurrently, there are 18 commands available:\n";
    text += "command <arguments>        - Description                                       - Aliases\n";
    text += "play <YT-URL>              - Add song to the queue                             - p\n";
    text += "pause                      - Pause                                             - \n";
    text += "resume                     - Resume after paused                               - res, continue\n";
    text += "skip <int = 1>             - Skip multiple songs                               - \n";
    text += "queue <page = 1 | all>     - Show the queue                                    - q\n";
    text += "volume <int = 5>           - Change the volume                                 - v, vol\n";
    text += "shuffle                    - Shuffle the queue                                 - random, randomize\n";
    text += "looping [<true/false>]     - Set looping status, if no parameter shows status  - \n";
    text += "count                      - Show size of the queue                            - c, number\n";
    text += "now                        - Show what is live                                 - np\n";
    text += "again                      - Play current song again                           - \n";
    text += "who                        - Show who requested this song                      - requested\n";
    text += "remove <int = 1>           - Remove song nr.                                   - delete, del\n";
    text += "duplicates                 - Remove all duplicated from queue                  - removeDoubles\n";
    text += "clear                      - Clear the entire queue - FINAL!                   - \n";
    text += "save <name>                - Attach the queue to a file                        - write, s\n";
    text += "load <name>                - Attach songs from a file to the queue             - l\n";
    text += "help                       - This menu                                         - \n";
    text += "```";
    return message.channel.send(text);
}

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
        case "q":
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
        case "duplicates":
        case "removeDoubles":
            music.removeDoubles(message);
            break;
        case "help":
            help(message);
            break;
        default:
            message.channel.send("Please enter a valid command!");
    }

});

client.login(token);