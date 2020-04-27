function listModules(message) {
    mods = "Available modules: " + modules[0].names[0];
    for (i = 1; i < modules.length; i++) {
        mods += ", ";
        mods += modules[i].names[0];
    }
    mods += ".";
    return message.channel.send(mods);
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