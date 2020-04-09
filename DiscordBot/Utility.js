//Node.js: File module
const fs = require('fs');
const os = require("os");
const path = require('path');
const objLine = require('readline');

function logErr(err, position, info) {
    var cDate = new Date();
    console.log("\n----[POSITION: " + position + "]----[ERROR]----[TIME: " + cDate.getHours() + ":" + cDate.getMinutes() + ":" + cDate.getSeconds() + cDate.getMilliseconds() + "]----------");
    console.log(err);
    console.log("[Additional Information] " + info);
    console.log("----------[ERROR END]----------\n");
}

function logUserError(warn, position, user, info) {
    var cDate = new Date();
    console.log("\n----------[POSITION: " + position + "]----[USER ERROR]----[USER: " + user + "]----[TIME: " + cDate.getHours() + ":" + cDate.getMinutes() + ":" + cDate.getSeconds() + cDate.getMilliseconds() + "]----------");
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

module.exports =
    {
        logErr: logErr,
        logUserError: logUserError,
        randomize: randomize
    }