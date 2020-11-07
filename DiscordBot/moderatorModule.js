//common functions (error handling etc)
const util = require('./Utility.js');
//music function (for killSave)
const music = require('./musicModule.js');

function ban(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "moderator: ban", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to ban a member, DMs are not allowed!");
    }
    if (!message.member.permissions.has('BAN_MEMBERS')) {
        util.logUserError("User tried to ban, but did not have the permissions to.", "moderator: ban", message.author, "Parameters: " + util.arrToString(args, " "));
        return message.channel.send("You are not allowed to ban users!");
    }
    if (args.length == 0) {
        util.logUserError("No parameters.", "moderator: ban", message.author, "None");
        return message.channel.send("You need to enter a parameter!");
    }
    const user = message.mentions.users.first();
    if (user) {
        const member = message.guild.member(user);
        if (member) {
            member.ban({ reason: util.arrToString(args.slice(1), " ") })
                .then(() => {
                    util.logInfo(`${member.user.tag} was banned by ${message.member.user.tag}!`, "moderator: ban", "Parameters: " + util.arrToString(args, " "));
                    return message.channel.send(`Successfully banned ${member.user.tag}`);
                })
                .catch(err => {
                    util.logUserError(err, "moderator: ban", message.author, "Parameters: " + util.arrToString(args, " "));
                    return message.channel.send(`Unable to ban ${member.user.tag}!`);
                });
        } else {
            util.logUserError("User tried to ban another user that is not a part of this server.", "moderator: ban", message.author, "Parameter: " + util.arrToString(args, " "));
            return message.channel.send(`${user.tag} is not a part of this server!`);
        }
    }
    else {
        util.logUserError("User tried to ban an unknown user.", "moderator: ban", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send(`I did not find a valid user in your statement!`);
    }
}

function purge(message, args) {
    //check for guild --> no DMs allowed!
    if (!message.guild) {
        util.logUserError("User was not in a guild: command executed in DM", "moderator: purge", message.author, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("You have to be in a server channel to bul delete messages, DMs are not allowed!");
    }
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        util.logUserError("User tried to delete messages, but did not have the permissions to.", "moderator: purge", message.author, "Parameters: " + util.arrToString(args, " "));
        return message.channel.send("You are not allowed to delete messages!");
    }
    if (args.length == 0) {
        util.logUserError("No parameters.", "moderator: purge", message.author, "None");
        return message.channel.send("You need to enter a parameter!");
    }
    if (isNaN(args[0])) {
        util.logUserError("User entered invalid parameter: no number.", "moderator: purge", message.author, "Parameters: " + util.arrToString(args, " "));
        return message.channel.send("Invalid parameter: " + args[0] + " is not a number!");
    }
    if (args[0] <= 0) {
        util.logUserError("User entered invalid parameter: negative number / zero.", "moderator: purge", message.author, "Parameters: " + util.arrToString(args, " "));
        return message.channel.send("Invalid parameter: " + args[0] + " is not positive!");
    }
    if (args[0] > 200) {
        util.logUserError("User wanted to delete more than 200 messages.", "moderator: purge", message.author, "Parameters: " + util.arrToString(args, " "));
        return message.channel.send(args[0] + " is bigger than the allowed amount (200)!");
    }
    args[0] = parseInt(args[0], 10) + 1;
    try {
        message.channel.bulkDelete(args[0]).then(messages => {
            util.logInfo(`${message.member.user.tag} deleted  ${messages.size-1} messages in ${message.channel.name}.`, "moderator: purge", "Parameter: " + util.arrToString(args, " "));
            return message.channel.send(`Deleted ${messages.size - 1} messages`).then(msg => { msg.delete({ timeout: 5000})});
        });
    }
    catch (err) {
        util.logErr(err, "moderator: purge: bulkDelete", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Unable to delete messages!");
    }
}

function kill(message) {
    if (message.author.id != "292056469384331276") {
        util.logUserError("User tried to terminate Bot but did not have the right to do so.", "moderator: kill", message.author, "None");
        return message.channel.send(`Only <@292056469384331276> can terminate the bot!`);
    }
    //killSave
    music.killSave();
    util.logInfo("Bot terminated.", "moderator: kill", "None");
    message.channel.send("Shutting down...");
    setTimeout((function () {
        return process.kill(process.pid);
    }), 1000);
    return;
}

module.exports = {
    ban: ban,
    purge: purge,
    kill: kill
}