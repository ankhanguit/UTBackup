/**
 * Created by panda94 on 10/26/2016.
 *
 * Service , reference collection name avatars
 * F- Save
 * F- Get
 *
 * Update: 10/23/2016.
 */

var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var utils = require('logic/utils.logic');
var db = mongo.db(process.env.MONGODB_URI, { native_parser: true });

db.bind('avatars');

var service = {};

service.save = saveAvatar;
service.get = getAvatar;

module.exports = service;

/**
 * Save or Update user avatar
 * @param user_id
 * @param avatar
 * @returns {*}
 */
function saveAvatar(user_id, avatar){

    var deferred = Q.defer();

    var avatarSet = {
        'USER_ID': mongo.helper.toObjectID(user_id),
        'AVATAR': avatar,
        'CREATE_DATE': new Date(),
        'UPDATE_DATE': new Date()
    };

    // find avatar exist
    db.avatars.findOne(
        { 'USER_ID': mongo.helper.toObjectID(user_id)},
        function (err, gavatar) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][avatar.service.js][saveAvatar] : " + err.name + ': ' + err.message);
            }

            if (gavatar) {
                // member already exists
                updateAvatar();
            } else {
                insertAvatar();
            }
        });

    // insert avatar
    function insertAvatar(){
        db.avatars.insert(
            avatarSet,
            function (err, doc) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][avatar.service.js][saveAvatar] : " + err.name + ': ' + err.message);
                }

                var msg = {success: true};
                deferred.resolve(msg);
            });
    }

    // update avatar
    function updateAvatar(){
        db.avatars.update(
            { 'USER_ID': mongo.helper.toObjectID(user_id)},
            { $set: avatarSet },
            function (err, doc) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][avatar.service.js][saveAvatar] : " + err.name + ': ' + err.message);
                }

                var msg = {success: true};
                deferred.resolve(msg);
            });
    }
    return deferred.promise;
}

/**
 * get User avatar
 * @param user_id
 * @returns {*}
 */
function getAvatar(user_id){
    var deferred = Q.defer();

    db.avatars.findOne(
        { 'USER_ID': mongo.helper.toObjectID(user_id)},
        function (err, gavatar) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][avatar.service.js][saveAvatar] : " + err.name + ': ' + err.message);
            }

            if (gavatar) {
                deferred.resolve(gavatar);
            } else {
                deferred.reject(utils.message("MSG006-UR-E"));
            }
        });

    return deferred.promise;
}
