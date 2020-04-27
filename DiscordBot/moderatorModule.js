//common functions (error handling etc)
const util = require('./Utility.js');

function ban(message, args) {
    if (!message.member.permissions.has('BAN_MEMBERS')) {
        util.logUserError("User tried to ban, but did not have the permissions to.", "moderator: ban", message.member, "Parameters: " + util.arrToString(args, " "));
        return message.channel.send("You are not allowed to ban users!");
    }
    if (args.length == 0) {
        util.logUserError("No parameters.", "moderator: ban", message.member, "None");
        return message.channel.send("You need to enter a parameter!");
    }
    const user = message.mentions.users.first();
    if (user) {
        const member = message.guild.member(user);
        if (member) {
            member.ban({ reason: util.arrToString(args.subarray(1), " ") })
                .then(() => {
                    util.logInfo(`${member.user.tag} was banned by ${message.member.user.tag}!`, "moderator: ban", "Parameters: " + util.arrToString(args, " "));
                    return message.channel.send(`Successfully banned ${member.user.tag}`);
                })
                .catch(err => {
                    util.logUserError(err, "moderator: ban", message.member, "Parameters: " + util.arrToString(args, " "));
                    return message.channel.send(`Unable to ban ${member.user.tag}!`);
                });
        } else {
            util.logUserError("User tried to ban another user that is not a part of this server.", "moderator: ban", message.member, "Parameter: " + util.arrToString(args, " "));
            return message.channel.send(`${user.tag} is not a part of this server!`);
        }
    }
    else {
        util.logUserError("User tried to ban an unknown user.", "moderator: ban", message.member, "Parameter: " + util.arrToString(args, " "));
        return message.channel.send(`I didi not find a valid user in your statement!`);
    }
}

function purge(message, args) {
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        util.logUserError("User tried to delete messages, but did not have the permissions to.", "moderator: purge", message.member, "Parameters: " + util.arrToString(args, " "));
        return message.channel.send("You are not allowed to delete messages!");
    }
    if (args.length == 0) {
        util.logUserError("No parameters.", "moderator: purge", message.member, "None");
        return message.channel.send("You need to enter a parameter!");
    }
    if (isNaN(args[0])) {
        util.logUserError("User entered invalid parameter: no number.", "moderator: purge", message.member, "Parameters: " + util.arrToString(args, " "));
        return message.channel.send("Invalid parameter: " + args[0] + " is not a number!");
    }
    if (args[0] <= 0) {
        util.logUserError("User entered invalid parameter: negative number / zero.", "moderator: purge", message.member, "Parameters: " + util.arrToString(args, " "));
        return message.channel.send("Invalid parameter: " + args[0] + " is not positive!");
    }
    if (args[0] > 200) {
        util.logUserError("User wanted to delete more than 200 messages.", "moderator: purge", message.member, "Parameters: " + util.arrToString(args, " "));
        return message.channel.send(args[0] + " is bigger than the allowed amount (200)!");
    }
    args[0] = parseInt(args[0], 10);
    try {
        message.channel.bulkDelete(args[0]).then(messages => {
            util.logInfo(`${message.member.user.tag} deleted  ${messages.size} messages in ${message.channel.name}.`, "moderator: purge", "Parameter: " + util.arrToString(args, " "));
            return message.channel.send(`Deleted ${messages.size} messages`);
        });
    }
    catch (err) {
        util.logErr(err, "moderator: purge: bulkDelete", "Parameter: " + util.arrToString(args, " "));
        return message.channel.send("Unable to delete messages!");
    }
}

module.exports = {
    ban: ban,
    purge: purge
}