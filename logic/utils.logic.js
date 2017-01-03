var config = require('config.json');
var _MESSAGE = require('message.json');
var _ = require('lodash');
var Q = require('q');
var logic = {};

logic.random = random;
logic.message = message;

module.exports = logic;

function random(length, chars) {

    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';

    var result = '';
    for (var i = length; i > 0; --i){
        result += mask[Math.round(Math.random() * (mask.length - 1))];
    }

    return result;
}
function message(msg) {
    var args = [].slice.call(arguments, 1),
        i = 0;

    var str = _MESSAGE[msg];
    return str.replace(/%s/g, function() {
        return args[i++];
    });
}