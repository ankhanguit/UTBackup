/**
 * Created by panda94 on 11/21/2016.
 *
 * Service , reference dynamic collection name, syntax :[ gps_member_ + Id group]
 * F- add
 * F- get
 *
 * Update: 11/21/2016.
 */

var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var utils = require('logic/utils.logic');
var db = mongo.db(process.env.MONGODB_URI, { native_parser: true });

db.bind('avatars');

var service = {};

service.add = addGps;
service.get = getGps;

module.exports = service;

/**
 * Add group member gps
 * @param user_id
 * @param group_id
 * @param key
 * @param latitude
 * @param longitude
 * @param message
 * @returns {*|promise}
 */
function addGps(user_id, group_id, key, latitude, longitude, message){

    var deferred = Q.defer();

    var gpsDb = db.collection("group_gps_" + group_id);
    var memberDb = db.collection("group_member_" + group_id);

    var gpsSet = {
        'USER_ID': mongo.helper.toObjectID(user_id),
        'GROUP_ID': mongo.helper.toObjectID(group_id),
        'KEY': key,
        'LATITUDE': latitude,
        'LONGITUDE': longitude,
        'MESSAGE' : message,
        'CREATE_DATE': new Date()
    };

    // find member exist
    memberDb.findOne(
        { MEMBER_ID: mongo.helper.toObjectID(user_id)},
        function (err, member) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][gps.service.js][addGps] : " + err.name + ': ' + err.message);
            }

            if (member && member.PERMIT != 0) {

                // insert gps information to database
                insertGps();
            } else {

                // member not found
                deferred.reject(utils.message("MSG001-JP-E"));
            }
        });

    // insert gps
    function insertGps(){
        gpsDb.insert(
            gpsSet,
            function (err, doc) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][gps.service.js][addGps] : " + err.name + ': ' + err.message);
                }

                var msg = {success: true};
                deferred.resolve(msg);
            });
    }

    return deferred.promise;
}

/**
 * Get gps by key
 * @param user_id
 * @param group_id
 * @param key
 * @returns {*|promise}
 */
function getGps(user_id, group_id, key){
    var deferred = Q.defer();

    var gpsDb = db.collection("group_gps_" + group_id);
    var memberDb = db.collection("group_member_" + group_id);

    if(key == "ALL") {
        key = '';
    }

    // find member exist
    memberDb.findOne(
        { MEMBER_ID: mongo.helper.toObjectID(user_id)},
        function (err, member) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][gps.service.js][getGps] : " + err.name + ': ' + err.message);
            }

            if (member) {

                // insert gps information to database
                getGpsWithKey();
            } else {

                // member not found
                deferred.reject(utils.message("MSG001-JP-E"));
            }
        });

    function getGpsWithKey() {
        gpsDb.aggregate([
                { $match: {'KEY': new RegExp(key, "i")}},
                { $lookup: { from: "users", localField: "USER_ID", foreignField: "_id", as: "AUTHOR_INFO"}},
                { $unwind : "$AUTHOR_INFO"},
                { $project: {
                    USER_ID : 1,
                    GROUP_ID : 1,
                    CREATE_DATE : 1,
                    LATITUDE: 1,
                    LONGITUDE: 1,
                    KEY: 1,
                    MESSAGE: 1,
                    FIRSTNAME : "$AUTHOR_INFO.FIRSTNAME" ,
                    LASTNAME : "$AUTHOR_INFO.LASTNAME",
                    USERNAME: "$AUTHOR_INFO.USERNAME"}
                }
            ],
            function (err, gps) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][gps.service.js][getGps] : " + err.name + ': ' + err.message);
                }

                if (!_.isEmpty(gps)) {
                    // empty jsp result
                    deferred.resolve(gps);
                } else {
                    deferred.reject(utils.message("MSG002-JP-E"));
                }
            });
    }

    return deferred.promise;
}
