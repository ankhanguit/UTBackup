/**
 * Created by panda94 on 09/12/2016.
 * Service , reference dynamic collection name, syntax :[ group_member_ + Id group]
 * F- addGroupMessage
 * F- getNewestMessage
 * F- getMessages
 * Update: 10/12/2016.
 */

var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var utils = require('logic/utils.logic');
var db = mongo.db(process.env.MONGODB_URI, { native_parser: true });

db.bind('message');

var service = {};

service.addGroupMessage = addGroupMessage;
service.getNewestMessage = getNewestMessage;
service.getMessages = getMessage;

module.exports = service;

/**
 * Group add message
 * @param author
 * @param groupId
 * @param message
 * @returns {*}
 */
function addGroupMessage(author, groupId, message) {
    var deferred = Q.defer();

    var objInsert = {'MEMBER_ID': mongo.helper.toObjectID(author), 'CREATE_DATE' : new Date(), 'MESSAGE' : message};
    // validation
    var messageDb = db.collection("group_message_" + groupId);


    messageDb.insert(
        objInsert,
        function (err, doc) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][message.service.js][addGroupMessage] : " + err.name + ': ' + err.message);
            }

            var msg = {success: true};
            deferred.resolve(msg);
        });

    return deferred.promise;
}
function getNewestMessage(groupId){
    var deferred = Q.defer();

    // validation
    var messageDb = db.collection("group_message_" + groupId);

    messageDb.aggregate([
            { $lookup: { from: "users", localField: "MEMBER_ID", foreignField: "_id", as: "AUTHOR_INFO"}},
            { $limit : 10 },
            { $unwind : "$AUTHOR_INFO"},
            { $project: {
                MESSAGE : 1,
                AUTHOR_FIRSTNAME : "$AUTHOR_INFO.FIRSTNAME" ,
                AUTHOR_LASTNAME : "$AUTHOR_INFO.LASTNAME",
                MEMBER_ID: 1,
                CREATE_DATE: 1
                }
            }
        ],
        function (err, doc) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][message.service.js][getNewestMessage] : " + err.name + ': ' + err.message);
            }

            deferred.resolve(doc);
        });

    return deferred.promise;
}

/**
 * get group chat messages
 * @param getBegin
 * @param getEnd
 * @param groupId
 * @param memberId
 * @returns {*}
 */
function getMessage(getBegin, getEnd, groupId, memberId){

    var deferred = Q.defer();

    // limit message get
    var limit = getEnd - getBegin;
    var begin = parseInt(getBegin, 10);
    var end = parseInt(getEnd, 10);

    // validation
    var messageDb = db.collection("group_message_" + groupId);

    // validation
    var groupDb = db.collection("group_member_" + groupId);

    groupDb.findOne(
        { MEMBER_ID: mongo.helper.toObjectID(memberId)},
        function (err, member) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][group.service.js][joinGroup] : " + err.name + ': ' + err.message);
            }

            // member exists
            if(member) {

                messageDb.count(
                    function (err, count) {
                        if (err){
                            // database error
                            deferred.reject(utils.message("MSG002-CM-E"));
                            console.log("[" + new Date()  + "][message.service.js][getMessage] : " + err.name + ': ' + err.message);
                        }

                        if(count > begin){
                            messageDb.aggregate([
                                    { $lookup: { from: "users", localField: "MEMBER_ID", foreignField: "_id", as: "AUTHOR_INFO"}},
                                    { $skip: begin},
                                    { $limit : limit },
                                    { $sort: {"CREATE_DATE": -1}},
                                    { $unwind : "$AUTHOR_INFO"},
                                    { $project: {
                                        MESSAGE : 1,
                                        AUTHOR_FIRSTNAME : "$AUTHOR_INFO.FIRSTNAME" ,
                                        AUTHOR_LASTNAME : "$AUTHOR_INFO.LASTNAME",
                                        AUTHOR_USERNAME: "$AUTHOR_INFO.USERNAME",
                                        MEMBER_ID: 1,
                                        CREATE_DATE: 1
                                    }
                                    }
                                ],
                                function (err, messages) {
                                    if (err){
                                        // database error
                                        deferred.reject(utils.message("MSG002-CM-E"));
                                        console.log("[" + new Date()  + "][message.service.js][getMessage] : " + err.name + ': ' + err.message);
                                    }

                                    deferred.resolve({messages: messages, count: count, remain: count - end});
                                });
                        }else{
                            deferred.reject(utils.message("MSG001-MS-E"));
                        }
                    });
            }else{
                deferred.reject(utils.message("MSG003-MB-E"));
            }

        });

    return deferred.promise;
}