//common functions (error handling etc)
const util = require('./Utility.js');
//for embeds
const Discord = require('discord.js');

function flip(message) {
    n = Math.round(Math.random());
    if (n == 0) {
        return message.channel.send("Heads!");
    }
    return message.channel.send("Tails!");
}

function rps(message, args) {
    //no argument
    if (args.length == 0) {
        util.logUserError("User called function without parameter.", "fun: rps", message.author, "None");
        return message.channel.send("I won't be playing against myself!");
    }
    //choose: 0 -> rock, 1 -> scissors, 2 -> paper
    n = Math.floor(Math.random() * 3);
    switch (n) {
        case 0:
            message.channel.send("Rock!");
            break;
        case 1:
            message.channel.send("Scissors!");
            break;
        case 2:
            message.channel.send("Paper!");
            break;
    }
    var delta = 0;
    switch (args[0]) {
        case "rock":
        case "Rock":
        case "r":
            delta = 0 - n;
            break;
        case "scissors":
        case "Scissors":
        case "s":
            delta = 1 - n;
            break;
        case "paper":
        case "Paper":
        case "p":
            delta = 2 - n;
            break;
        default:
            util.logUserError("User entered missspelled parameter.", "fun: rps: switch args[0]", message.author, "Parameter: " + util.arrToString(args, " "));
            return message.channel.send("What did you show?");
            break;
    }
    switch (delta) {
        case -2:
        case 1:
            return message.channel.send("I won!");
            break;
        case -1:
        case 2:
            return message.channel.send("You won!");
            break;
        case 0:
            return message.channel.send("Tie!");
            break;
    }
}

function randomColor(message) {
    r = Math.floor(Math.random() * 256);
    g = Math.floor(Math.random() * 256);
    b = Math.floor(Math.random() * 256);
    hex = util.rgbToHex(r, g, b);

    embed = new Discord.MessageEmbed();
    embed.setColor(hex);
    embed.setTitle("Your color:");
    embed.addField('Hex', hex, true);
    embed.addField('RGB', r.toString(10) + " " + g.toString(10) + " " + b.toString(10), true);
    embed.setFooter("Meme God Bot by Fractum#3592");
	embed.setTimestamp();
    message.channel.send(embed);
}

module.exports = {
    flip: flip,
    rps: rps,
    randomColor: randomColor
}