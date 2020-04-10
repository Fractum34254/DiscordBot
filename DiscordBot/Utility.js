//Node.js: File module
const fs = require('fs');
const os = require("os");
const path = require('path');
const objLine = require('readline');

function logErr(err, position, info) {
    var cDate = new Date();
    console.log("\n----[POSITION: " + position + "]----[ERROR]----[TIME: " + cDate.toString() + "]----------");
    console.log(err);
    console.log("[Additional Information] " + info);
    console.log("----------[ERROR END]----------\n");
}

function logInfo(info, position, addInfo) {
    var cDate = new Date();
    console.log("\n----[POSITION: " + position + "]----[INFO]----[TIME: " + cDate.toString() + "]----------");
    console.log(info);
    console.log("[Additional Information] " + addInfo);
    console.log("----------[INFO END]----------\n");
}

function logUserError(warn, position, user, info) {
    var cDate = new Date();
    console.log("\n----------[POSITION: " + position + "]----[USER ERROR]----[USER: " + user + "]----[TIME: " + cDate.toString() + "]----------");
    console.log(err);
    console.log("[Additional Information] " + info);
    console.log("----[USER ERROR END]----------\n");
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

function writeLineToFile(filePath, data) {
    var line = data + os.EOL;
    fs.writeFile(filePath, line, { flag: "a" },
        function (err) {
            if (err) throw err;
        });
}

function trimString(str, length, token) {
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

module.exports =
    {
        logErr: logErr,
        logUserError: logUserError,
        randomize: randomize,
        logInfo: logInfo,
        trimString: trimString
    }