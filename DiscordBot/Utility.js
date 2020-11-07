//Node.js: File module
const fs = require('fs');
const os = require("os");
const path = require('path');
const objLine = require('readline');

function logErr(err, position, info) {
    var cDate = new Date();
    console.log('\n\x1b[31m%s\x1b[0m', '----------------------------[ERROR]-----------------------------');
    console.log("[POSITION] " + position + "\n[TIME]     " + cDate.toString() + "\n[MESSAGE]");
    console.log(err);
    console.log("[Additional Information] " + info);
    console.log('\n\x1b[31m%s\x1b[0m', '---------------------------[ERROR END]--------------------------');
}

function logInfo(info, position, addInfo) {
    var cDate = new Date();
    console.log("\n\x1b[32m%s\x1b[0m", "-----------------------------[INFO]-----------------------------");
    console.log("[POSITION] " + position + "\n[TIME]     " + cDate.toString() + "\n[MESSAGE]");
    console.log(info);
    console.log("[Additional Information] " + addInfo);
    console.log("\n\x1b[32m%s\x1b[0m", "---------------------------[INFO END]---------------------------");
}

function logUserError(warn, position, user, info) {
    var cDate = new Date();
    console.log("\n\x1b[33m%s\x1b[0m", "--------------------------[USER ERROR]--------------------------");
    console.log("[POSITION] " + position + "\n[TIME]     " + cDate.toString() + "\n[USER]     " + user.tag  + "\n[MESSAGE]");
    console.log(warn);
    console.log("[Additional Information] " + info);
    console.log("\n\x1b[33m%s\x1b[0m", "------------------------[USER ERROR END]------------------------");
}

function randomize(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function addLineToFile(filePath, data) {
    var line = data + os.EOL;
    fs.writeFile(filePath, line, { flag: "a" },
        function (err) {
            if (err) throw err;
        });
}

function overrideFile(filePath, data) {
    var line = data + os.EOL;
    fs.writeFile(filePath, line, { flag: "w" },
        function (err) {
            if (err) throw err;
        });
}

function trimString(str, length, token) {
    if (!token) {
        token = " ";
    }
    if (str.length == length) {
        return str;
    }
    if (str.length < length) {
        while (str.length < length) {
            str += token;
        }
        return str;
    }
    while (str.length > length) {
        str = str.slice(0, -1);
    }
    return str;
}

function trimStringFront(str, length, token) {
    if (!token) {
        token = " ";
    }
    if (str.length == length) {
        return str;
    }
    if (str.length < length) {
        while (str.length < length) {
            str = token + str;
        }
        return str;
    }
    while (str.length > length) {
        str = str.slice(1);
    }
    return str;
}

function arrToString(arr, spacing, none) {
    if (!none) none = "";
    if (arr.length == 0) return none;
    if (!spacing) spacing = " ";
    str = arr[0];
    for (let i = 1; i < arr.length; i++) {
        str += spacing;
        str += arr[i];
    }
    return str;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function secondsToTimeString(sec) {
    var min = 0;
    while (sec >= 60) {
        min++;
        sec -= 60;
    }
    return (min + ":" + trimStringFront(sec.toString(10), 2, "0"));
}

module.exports =
    {
        logErr: logErr,
        logUserError: logUserError,
        randomize: randomize,
        logInfo: logInfo,
        trimString: trimString,
        addLineToFile: addLineToFile,
        overrideFile: overrideFile,
        arrToString: arrToString,
        rgbToHex: rgbToHex,
        hexToRgb: hexToRgb,
        secondsToTimeString: secondsToTimeString
    }