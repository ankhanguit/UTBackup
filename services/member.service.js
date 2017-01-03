/**
 * Created by panda94 on 09/12/2016.
 * Service , reference dynamic collection name, syntax :[ group_member_ + Id group]
 * F- joinGroup
 * F- leaveGroup
 * F- lockMember
 * F- findMember
 * F- findOne
 * F- getGroup
 * F- permitMember
 * F- getMember
 * F- addTask
 * F- getTask
 * F- addNote
 *
 * Update: 29/12/2016.
 */

var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var utils = require('logic/utils.logic');
var db = mongo.db(process.env.MONGODB_URI, { native_parser: true });

db.bind('members');
db.bind('groups');
var service = {};

service.join = joinGroup;
service.leave = leaveGroup;
service.permit = permitMember;
service.lock = lockMember;
service.findMember = findMember;
service.findOne = findOne;
service.getGroup = getGroup;
service.getMember = getMember;
service.addTask = addTask;
service.getTask = getTask;
service.addNote = addNote;

module.exports = service;

/**
 * Member join group
 * @param author
 * @param groupId
 * @param permit
 * @returns {*}
 */
function joinGroup(author, groupId, permit) {
    var deferred = Q.defer();

    var objInsert = {'MEMBER_ID': mongo.helper.toObjectID(author), 'JOIN_DATE' : new Date(), 'PERMIT' : permit , 'ROLE' : 7};
    var memberInsert = {
        'MEMBER_ID': mongo.helper.toObjectID(author),
        'GROUP_ID': mongo.helper.toObjectID(groupId),
		'MEMBER' : author,
        'JOIN_DATE' : new Date(),
        'PERMIT' : permit ,
        'ROLE' : 7,
    };

    // validation
    var groupDb = db.collection("group_member_" + groupId);

    // find member exist
    groupDb.findOne(
        { MEMBER_ID: mongo.helper.toObjectID(author)},
        function (err, member) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][group.service.js][joinGroup] : " + err.name + ': ' + err.message);
            }
			
            if (member) {
                // member already exists
                deferred.reject(utils.message("MSG001-MB-E"));
            } else {
                insertMember();
            }
        });

    // insert member
    function insertMember(){
        groupDb.insert(
            objInsert,
            function (err, doc) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][group.service.js][joinGroup] : " + err.name + ': ' + err.message);
                }

                db.members.insert(
                    memberInsert,
                    function (err, doc) {
                        if(err){
                            deferred.reject(utils.message("MSG002-CM-E"));
                            console.log("[" + new Date()  + "][group.service.js][joinGroup] : " + err.name + ': ' + err.message);
                        }

                        var msg = {success: true};
                        deferred.resolve(msg);
                    }
                );

            });
    }
    return deferred.promise;
}

/**
 * Member leave group
 * @param member_id
 * @param groupId
 * @returns {*}
 */
function leaveGroup(member_id, groupId) {
    var deferred = Q.defer();

    var groupDb = db.collection("group_member_" + groupId);

    // remove member from database
    groupDb.remove(
        {MEMBER_ID: mongo.helper.toObjectID(member_id)},
        function (err) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][group.service.js][leaveGroup] : " + err.name + ': ' + err.message);
            }

            db.members.remove(
                {MEMBER_ID: mongo.helper.toObjectID(member_id), GROUP_ID: mongo.helper.toObjectID(groupId)},
                function (err, doc) {
                    if(err){
                        deferred.reject(utils.message("MSG002-CM-E"));
                        console.log("[" + new Date()  + "][group.service.js][leaveGroup] : " + err.name + ': ' + err.message);
                    }

                    var msg = {success: true};
                    deferred.resolve(msg);
                }

            );
        });

		
    return deferred.promise;
}


/**
 * Permit member
 * @param member_Id
 * @param groupId
 * @returns {*}
 */
function permitMember(member_Id, groupId) {
    var deferred = Q.defer();
    var set = {
        PERMIT: 1
    };

    // validation
    var groupDb = db.collection("group_member_" + groupId);

    // update group member status
    groupDb.update(
        { MEMBER_ID: mongo.helper.toObjectID(member_Id) },
        { $set: set },
        function (err, doc) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][group.service.js][permitMember] : " + err.name + ': ' + err.message);
            }

            db.members.update(
                {MEMBER_ID: mongo.helper.toObjectID(member_Id), GROUP_ID: mongo.helper.toObjectID(groupId)},
                { $set: set },
                function (err, doc) {
                    if(err){
                        deferred.reject(utils.message("MSG002-CM-E"));
                        console.log("[" + new Date()  + "][group.service.js][permitMember] : " + err.name + ': ' + err.message);
                    }

                    var msg = {success: true};
                    deferred.resolve(msg);
                }

            );
        });
    return deferred.promise;
}


/**
 * Lock member
 * @param member_Id
 * @param groupId
 * @returns {*}
 */
function lockMember(member_Id, groupId) {
    var deferred = Q.defer();
    var set = {
        PERMIT: 0
    };

    // validation
    var groupDb = db.collection("group_member_" + groupId);

    // update group member status
    groupDb.update(
        { MEMBER_ID: mongo.helper.toObjectID(member_Id) },
        { $set: set },
        function (err, doc) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][group.service.js][lockMember] : " + err.name + ': ' + err.message);
            }

            db.members.update(
                {MEMBER_ID: mongo.helper.toObjectID(member_Id), GROUP_ID: mongo.helper.toObjectID(groupId)},
                { $set: set },
                function (err, doc) {
                    if(err){
                        deferred.reject(utils.message("MSG002-CM-E"));
                        console.log("[" + new Date()  + "][group.service.js][permitMember] : " + err.name + ': ' + err.message);
                    }

                    var msg = {success: true};
                    deferred.resolve(msg);
                }

            );
        });
    return deferred.promise;
}

/**
 * Find member by id from groupId
 * @param memberId
 * @param groupId
 */
function findMember(memberId, groupId){
    var deferred = Q.defer();

    // validation
    var groupDb = db.collection("group_member_" + groupId);

    // find member exist
    groupDb.aggregate([
            { $match: {'MEMBER_ID': mongo.helper.toObjectID(memberId)}},
            { $lookup: { from: "users", localField: "MEMBER_ID", foreignField: "_id", as: "AUTHOR_INFO"}},
            { $unwind : "$AUTHOR_INFO"},
            { $project: {
                MEMBER_ID : 1,
				PERMIT : 1,
                FIRSTNAME : "$AUTHOR_INFO.FIRSTNAME" ,
                LASTNAME : "$AUTHOR_INFO.LASTNAME",
                USERNAME: "$AUTHOR_INFO.USERNAME"}
            }
        ],
        function (err, member) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][group.service.js][joinGroup] : " + err.name + ': ' + err.message);
            }

            if (member) {
				
				db.groups.findOne(
					{ _id: mongo.helper.toObjectID(groupId)}, 
					function (err, group) {
						if (err){
							// database error
							deferred.reject(utils.message("MSG002-CM-E"));
							console.log("[" + new Date()  + "][member.service.js][findMember] : " + err.name + ': ' + err.message);
						}

						// check group
						if (group) {
							// member exists
							member[0].OPEN = group.OPEN;
							member[0].CLOSE = group.CLOSE;
							
							deferred.resolve(member[0]);
						} else {
							// group not found
							deferred.reject(utils.message("MSG001-GP-E"));
						}
				});
            } else {
                deferred.reject(utils.message("MSG002-MB-E"));
            }
        });

    return deferred.promise;
}

/**
 * Member find one
 * @param memberId
 * @param groupId
 * @returns {*}
 */
function findOne(memberId, groupId){
    var deferred = Q.defer();

    // validation
    var groupDb = db.collection("group_member_" + groupId);

    // find member exist
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
                deferred.resolve(member);
            }else{
                deferred.reject(utils.message("MSG003-MB-E"));
            }

        });

    return deferred.promise;
}

/**
 * get under group
 * @param memberId
 */
function getGroup(memberId){
    var deferred = Q.defer();
    // prepare query
    db.members.aggregate([
        { $match: {'MEMBER_ID': mongo.helper.toObjectID(memberId)}},
        { $lookup: { from: "groups", localField: "GROUP_ID", foreignField: "_id", as: "GROUP_INFO"}},
        { $unwind : "$GROUP_INFO"},
        { $project: { GROUP_ID : 1, CREATEDATE : 1, AUTHOR: "$GROUP_INFO.AUTHOR", NAME : "$GROUP_INFO.NAME", DESCRIPTION: "$GROUP_INFO.DESCRIPTION", CODE: "$GROUP_INFO.CODE"}}

    ],function (err, groups) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][member.service.js][getGroup] : " + err.name + ': ' + err.message);
        }

        // check result empty
        if(!_.isEmpty(groups)){
            deferred.resolve(groups);
        }else{
            // result null
            deferred.reject(utils.message("MSG007-MB-I"));
        }
    });

    return deferred.promise;
}

/**
 * Get all members in group
 * @param group_id
 * @returns {*|promise}
 */
function getMember(groupId, memberId){
    var deferred = Q.defer();

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

                // get all members
                groupDb.aggregate([
                        { $lookup: { from: "users", localField: "MEMBER_ID", foreignField: "_id", as: "MEMBER_INFO"}},
                        { $unwind : "$MEMBER_INFO"},
                        { $project: {
                            MEMBER_ID : 1,
                            JOIN_DATE: 1,
                            ROLE: 1,
                            TASK: 1,
							PERMIT: 1,
                            FIRSTNAME : "$MEMBER_INFO.FIRSTNAME" ,
                            LASTNAME : "$MEMBER_INFO.LASTNAME",
                            USERNAME: "$MEMBER_INFO.USERNAME",
                            PHONE:"$MEMBER_INFO.PHONE" }
                        }
                    ],
                    function (err, members) {
                        if (err){
                            // database error
                            deferred.reject(utils.message("MSG002-CM-E"));
                            console.log("[" + new Date()  + "][group.service.js][getMember] : " + err.name + ': ' + err.message);
                        }

                        if (!_.isEmpty(members)) {
                            // member exists
                            deferred.resolve(members);
                        } else {
                            deferred.reject(utils.message("MSG003-MB-E"));
                        }
                    });
            }else{
                deferred.reject(utils.message("MSG003-MB-E"));
            }

        });

    return deferred.promise;
}
/**
 * Add member task
 * @param groupId
 * @param memberId
 * @param task
 * @returns {*|promise}
 */
function addTask(groupId, memberId, task) {

    var deferred = Q.defer();

    var set = {
        TASK: task
    };

    // validation
    var groupDb = db.collection("group_member_" + groupId);

    groupDb.findOne(
        { MEMBER_ID: mongo.helper.toObjectID(memberId)},
        function (err, member) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][group.service.js][addTask] : " + err.name + ': ' + err.message);
            }

            // member exists
            if(member && member.PERMIT != 0) {
                groupDb.update(
                    { MEMBER_ID: mongo.helper.toObjectID(memberId) },
                    { $set: set },
                    function (err, doc) {
                        if (err){
                            // database error
                            deferred.reject(utils.message("MSG002-CM-E"));
                            console.log("[" + new Date()  + "][group.service.js][lockMember] : " + err.name + ': ' + err.message);
                        }
                        var msg = {success: true};
                        deferred.resolve(msg);
                    });

            }else{
                deferred.reject(utils.message("MSG003-MB-E"));
            }
        });

    return deferred.promise;
}

/**
 * Get member task
 * @param groupId
 * @param memberId
 * @param task
 * @returns {*|promise}
 */
function getTask(groupId, memberId) {

    var deferred = Q.defer();

    // validation
    var groupDb = db.collection("group_member_" + groupId);

    groupDb.findOne(
        { MEMBER_ID: mongo.helper.toObjectID(memberId)},
        function (err, member) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][group.service.js][getTask] : " + err.name + ': ' + err.message);
            }

            // member exists
            if(member && member.PERMIT != 0) {
                deferred.resolve(member.TASK);
            }else{
                deferred.reject(utils.message("MSG003-MB-E"));
            }
        });

    return deferred.promise;
}

/**
 * Add member note
 * @param groupId
 * @param memberId
 * @param note
 * @returns {*|promise}
 */
function addNote(groupId, memberId, note) {

    var deferred = Q.defer();

    var set = {
        NOTE: note
    };

    // validation
    var groupDb = db.collection("group_member_" + groupId);

    groupDb.findOne(
        { MEMBER_ID: mongo.helper.toObjectID(memberId)},
        function (err, member) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][group.service.js][addNote] : " + err.name + ': ' + err.message);
            }

            // member exists
            if(member && member.PERMIT != 0) {
                groupDb.update(
                    { MEMBER_ID: mongo.helper.toObjectID(memberId) },
                    { $push: set },
                    function (err, doc) {
                        if (err){
                            // database error
                            deferred.reject(utils.message("MSG002-CM-E"));
                            console.log("[" + new Date()  + "][group.service.js][addNote] : " + err.name + ': ' + err.message);
                        }
                        var msg = {success: true};
                        deferred.resolve(msg);
                    });

            }else{
                deferred.reject(utils.message("MSG003-MB-E"));
            }
        });

    return deferred.promise;
}