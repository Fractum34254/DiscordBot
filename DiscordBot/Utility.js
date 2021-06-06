//********************************** INCLUDES **********************************//
const fs = require('fs');
const os = require("os");

//***************************** STRING MANIPULATION *****************************//
module.exports.centerString = function centerString(str, len, pad = "=") {
    addLen = (len - str.length) / 2
    str.padStart(addLen, pad)
    str.padEnd(addLen, pad)
    return str
}

module.exports.trimString = function trimString(str, length, token = " ") {
    str = str.slice(0, length)
    str = str.padEnd(length, token)
    return str;
}

module.exports.trimStringFront = function trimStringFront(str, length, token = " ") {
    str = str.slice(-length)
    str = str.padStart(length, token)
    return str;
}

module.exports.arrToString = function arrToString(arr, spacing = " ") {
    let str = arr[0]
    for (let i = 1; i < arr.length; i++) {
        str += spacing
        str += arr[i]
    }
    return (typeof str === 'undefined') ? "" : str;
}

module.exports.secondsToTimeString = function secondsToTimeString(sec) {
    const min = Math.floor(sec / 60)
    sec -= min * 60
    return (min + ":" + trimStringFront(sec.toString(10), 2, "0"));
}

//***************************** ARRAY MANIPULATION ******************************//
module.exports.randomize = function randomize(array) {
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

//****************************** FILE MANIPULATION ******************************//
module.exports.addLineToFile = function addLineToFile(filePath, data) {
    var line = data + os.EOL;
    fs.writeFile(filePath, line, { flag: "a" },
        function (err) {
            if (err) throw err;
        });
}

module.exports.overrideFile = function overrideFile(filePath, data) {
    var line = data + os.EOL;
    fs.writeFile(filePath, line, { flag: "w" },
        function (err) {
            if (err) throw err;
        });
}

//****************************** VALUE MANIPULATION ******************************//
module.exports.rgbToHex = function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

module.exports.hexToRgb = function hexToRgb(hex) {
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

//***************************** CONSOLE MANIPULATION *****************************//
const red = '\x1b[31m'
const orange = '\x1b[33m'
const green = '\x1b[32m'
const white = '\x1b[0m'

function logInConsole(data, position, addInfo, title = "info", color = green) {
    const cDate = new Date()
    const titleEnd = centerString((title + " end").toUpperCase(), 60)
    title = centerString(title.toUpperCase(), 60)
    console.log(`\n${color}${title}${white}`)
    console.log(`${trimString("[POSITION]", 15)}${position}`)
    console.log(`${trimString("[TIME]", 15)}${cDate.toString()}`)
    console.log(`${trimString("[DATA]", 15)}${data}`)
    if (!(typeof addInfo === 'undefined')) console.log(`${trimString("[ADD. INFO]", 15)}${addInfo}`)
    console.log(`\n${color}${titleEnd}${white}`)
}

module.exports.logErr = function logErr(err, position, info) {
    logInConsole(err, position, info, "error", red)
}

module.exports.logUserErr = function logUserErr(warn, position, user, info) {
    let data = `User: ${user}`
    if (!(typeof info === 'undefined')) data += `, Info: ${info}`
    logInConsole(warn, position, data, "user error", orange)
}

module.exports.logInfo = function logInfo(info, position, addInfo) {
    logInConsole(info, position, addInfo)
}