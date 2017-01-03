/**
 * Created by panda94 on 09/12/2016.
 * Service , reference collection token
 * F- authenticate
 * F- create
 * F- _delete
 * F- findToken
 * F- checkTokenAuthor
 *
 * Update: 10/12/2016.
 */

var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(process.env.MONGODB_URI, { native_parser: true });

db.bind('token');

var utils = require('logic/utils.logic');

var service = {};

service.authenticate = authenticate;
service.create = create;
service.delete = _delete;
service.find = findToken;
service.checkToken = checkTokenAuthor;

module.exports = service;

/**
 * Check token exist
 * @param token
 * @returns {*}
 */
function authenticate(token) {
    var deferred = Q.defer();

    // find token exist
    db.token.findOne({ TOKEN: token }, function (err, tokenMsg) {
        if (err) {
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][token.service.js][authenticate] : " + err.name + ': ' + err.message);
        }

        if (tokenMsg) {
            // authentication successful
            deferred.resolve(tokenMsg);
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

/**
 * create token when login
 * @param author
 * @param token
 * @returns {*}
 */
function create(author, token) {
    var deferred = Q.defer();

    // validation, find token exist
    db.token.findOne(
        { TOKEN: token },
        function (err, token) {
            if (err) {
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][token.service.js][create] : " + err.name + ': ' + err.message);
            }

            // check token exist
            if (token) {
                // token already exists
                deferred.reject('Token ' + token + ' is already taken');
            } else {
                // create token
                createToken();
            }
        });

    // create token
    function createToken() {
        var objInsert = {'AUTHOR': author, 'TOKEN' : token};
        // insert token to database
        db.token.insert(
            objInsert,
            function (err, doc) {
                if (err) {
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][token.service.js][createToken] : " + err.name + ': ' + err.message);
                }
                deferred.resolve();
            });
    }

    return deferred.promise;
}

/**
 * Delete token
 * @param author
 * @param token
 * @returns {*}
 * @private
 */
function _delete(author, token) {
    var deferred = Q.defer();

    // remove token from database
    db.token.remove(
        {AUTHOR: author, TOKEN: token},
        function (err) {
            if (err) {
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][token.service.js][_delete] : " + err.name + ': ' + err.message);
            }

            deferred.resolve('Token ' + token + ' match');
        });

    return deferred.promise;
}

/**
 * find token
 * @param token
 * @returns {*}
 */
function findToken(token){
    var deferred = Q.defer();
    // validation
    db.token.findOne(
        { TOKEN: token },
        function (err, token) {
            // database error
            if (err) {
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][token.service.js][findToken] : " + err.name + ': ' + err.message);
            }

            if (token) {
                // token already exists
                deferred.resolve('Token ' + token + ' match');
            } else {
                deferred.reject('Token ' + token + ' no match');
            }
        });
    return deferred.promise;
}

/**
 * Check token author, with user id and token
 * @param author
 * @param token
 * @returns {*}
 */
function checkTokenAuthor(author, token){
    var deferred = Q.defer();
    var flag;

    // validation
    db.token.findOne(
        { TOKEN: token , AUTHOR: author},
        function (err, token) {
            if (err) {
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][token.service.js][checkTokenAuthor] : " + err.name + ': ' + err.message);
            }

            // check token exits
            if (token) {
                // validate success
                flag = {success: true};
                deferred.resolve(flag);
            } else {
                deferred.reject(utils.message("MSG001-TK-E"));
            }
        });
    return deferred.promise;
}