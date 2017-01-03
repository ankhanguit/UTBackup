/**
 * Created by panda94 on 09/12/2016.
 * Service , reference collection groups
 * F- getById
 * F- findByName
 * F- create
 * F- update
 * F- getList
 * F- _delete
 * F- updateSchedule
 * F- updatePreparation
 * F- getSchedule
 * F- getPreparation
 * F- addMember
 * F- removeMember
 * F- getNotes
 *
 * Update: 29/12/2016.
 */

var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var utils = require('logic/utils.logic');
var gcm = require('node-gcm');
var db = mongo.db(process.env.MONGODB_URI, { native_parser: true });

db.bind('groups');

var memberService = require('services/member.service');
var notificationService = require('services/notification.service');

var service = {};

service.getById = getById;
service.getByName = findByName;
service.getSchedule = getSchedule;
service.getPreparation = getPreparation;
service.create = create;
service.update = update;
service.updateSchedule = updateSchedule;
service.updatePreparation = updatePreparation;
service.updateStatus = updateStatus;
service.addMember = addMember;
service.removeMember = removeMember;
service.get = getList;
service.delete = _delete;
service.getNotes = getNotes;

module.exports = service;

/**
 * Get group by id
 * @param _id
 * @returns {*}
 */
function getById(_id) {
    var deferred = Q.defer();

    // find group by id
    db.groups.findById(_id, function (err, group) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.group.js][getById] : " + err.name + ': ' + err.message);
        }

        if (group) {
            // return user (without hashed password)
            deferred.resolve(group);
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

/**
 * Create group
 * @param groupParam
 * @returns {*}
 */
function create(groupParam) {
    var deferred = Q.defer();

    var groupCode = utils.random(4,'#A');

    // set group object to group params
    var set = {
        AUTHOR:mongo.helper.toObjectID(groupParam.author),
        NAME:groupParam.name,
        DESCRIPTION:groupParam.description,
        START_DATE: groupParam.startdate,
        END_DATE: groupParam.enddate,
        SCHEDULE: "",
        PREPARE: "",
        START_LOCATED: {
            longitude: groupParam.start_located_longitude,
            latitude: groupParam.start_located_latitude,
            name: groupParam.start_located_name
        },
        END_LOCATED: {
            longitude: groupParam.end_located_longitude,
            latitude: groupParam.end_located_latitude,
            name: groupParam.end_located_name
        },
        CODE: groupCode,
        STATUS: "0",
        LOCK: "0",
		OPEN: "0",
		CLOSE: "0",
        CREATEDATE: new Date(),
        UPDATEDATE: new Date(),
        UPDATE_PREPARATION_DATE: new Date(),
        UPDATE_SCHEDULE_DATE: new Date(),
        _PRIVATE: groupParam._private
    };

    // insert group profile to database
    db.groups.insert(
        set,
        function (err, doc) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][user.group.js][create] : " + err.name + ': ' + err.message);
            }

            memberService.join(groupParam.author, doc.ops[0]._id, 7)
                .then(function (subMsg) {

                    // return group profile without STATUS, LOCK
                    var group = _.omit(doc.ops[0], 'STATUS', 'LOCK');
                    deferred.resolve({group: group});

                }).catch(function (subErr) {
                deferred.reject(subErr);
            });
        });

    return deferred.promise;
}

/**
 * Update group profile
 * @param _id
 * @param groupParam
 * @returns {*}
 */
function update(_id, groupParam) {
    var deferred = Q.defer();
    var author = groupParam.author;

    // set update file to group object
    var set = {
        NAME: groupParam.name,
        DESCRIPTION: groupParam.description,
        START_DATE: groupParam.startdate,
        END_DATE: groupParam.enddate,
        START_LOCATED: {
            longitude: groupParam.start_located_longitude,
            latitude: groupParam.start_located_latitude,
            name: groupParam.start_located_name
        },
        END_LOCATED: {
            longitude: groupParam.end_located_longitude,
            latitude: groupParam.end_located_latitude,
            name: groupParam.end_located_name
        },
        _PRIVATE: groupParam._private,
        UPDATEDATE: new Date()
    };

    // find group exist
    db.groups.findById(_id, function (err, group) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.group.js][update] : " + err.name + ': ' + err.message);
        }

        // check group exist
        if (group && group.AUTHOR == author) {
            // update group
            groupUpdate();
        } else {
            // group not found
            deferred.reject(utils.message("MSG001-GP-E"));
        }
    });

    // update group profile
    function groupUpdate(){
        db.groups.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][user.group.js][update] : " + err.name + ': ' + err.message);
                }

                var msg = {success: true};
                deferred.resolve(msg);
            });
    }


    return deferred.promise;
}

/**
 * Delete group
 * @param _id
 * @param author
 * @returns {*}
 * @private
 */
function _delete(_id, author) {
    var deferred = Q.defer();

    // find group exist
    db.groups.findById(_id, function (err, group) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.group.js][_delete] : " + err.name + ': ' + err.message);
        }

        // check exist group and match author = user id
        if (group && group.AUTHOR == author) {
            // remove group
            groupRemove();
        } else {
            // group not found
            deferred.reject(utils.message("MSG002-GP-E"));
        }
    });

    // remove group from database
    function groupRemove(){
        db.groups.remove(
            { _id: mongo.helper.toObjectID(_id) },
            function (err) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][user.group.js][_delete] : " + err.name + ': ' + err.message);
                }

                var msg = {success: true};
                deferred.resolve(msg);
            });
    }

    return deferred.promise;
}

/**
 * Get list group own by user
 * @param author
 * @returns {*}
 */
function getList(author) {
    var deferred = Q.defer();

    // find group
    db.groups.find({AUTHOR: mongo.helper.toObjectID(author)}).toArray( function (err, groups) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.group.js][getList] : " + err.name + ': ' + err.message);
        }

        // check result list
        if (!_.isEmpty(groups)) {
            for (i = 0; i < groups.length; i++) {
                groups[i] = _.omit(groups[i], 'STATUS', 'LOCK', 'CREATEDATE', 'UPDATEDATE');
            }
            deferred.resolve(groups);
        }else{
            // get groups result null
            deferred.reject(utils.message("MSG004-GP-I"));
        }

    });

    return deferred.promise;
}

/**
 * Search group by name (public function)
 * @param groupName
 * @returns {*}
 */
function findByName(groupName){
    var deferred = Q.defer();
    // prepare query
    db.groups.aggregate([
        { $match: {$and: [{'NAME': new RegExp(groupName, "i")}, {'_PRIVATE':"0"}]}},
        { $lookup: { from: "users", localField: "AUTHOR", foreignField: "_id", as: "AUTHOR_INFO"}},
        { $limit : 20 },
        { $unwind : "$AUTHOR_INFO"},
        { $project: { 
			NAME : 1, 
			DECRIPTION : 1, 
			START_DATE: 1,
			END_DATE: 1,
			SCHEDULE: 1,
			PREPARE: 1,
			START_LOCATED: 1,
			END_LOCATED: 1,
			OPEN: 1,
			CLOSE: 1,
			CREATEDATE: 1,
			UPDATEDATE: 1,
			UPDATE_PREPARATION_DATE: 1,
			UPDATE_SCHEDULE_DATE: 1,
			_PRIVATE: 1,
			AUTHOR_FIRSTNAME : "$AUTHOR_INFO.FIRSTNAME" ,
			AUTHOR_LASTNAME : "$AUTHOR_INFO.LASTNAME" , 
			CODE: 1
			}
		}

    ],function (err, groups) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.group.js][findByName] : " + err.name + ': ' + err.message);
        }

        // check result empty
		if(!_.isEmpty(groups)){
			deferred.resolve(groups);
        }else{
            // result null
            deferred.reject(utils.message("MSG002-GP-I"));
        }
    });
    return deferred.promise;
}


/**
 * Update schedule
 * @param _id
 * @param groupParam
 * @returns {*|promise}
 */
function updateSchedule(_id, groupParam) {
    var deferred = Q.defer();
    var author = groupParam.author;

    // set update file to group object
    var set = {
        SCHEDULE: groupParam.schedule,
        UPDATE_SCHEDULE_DATE: new Date()
    };

    // find group exist
    db.groups.findById(_id, function (err, group) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.group.js][update] : " + err.name + ': ' + err.message);
        }

        // check group exist
        if (group && group.AUTHOR == author) {
            // update group
            groupUpdate();
        } else {
            // group not found
            deferred.reject(utils.message("MSG001-GP-E"));
        }
    });

    // update group profile
    function groupUpdate(){
        db.groups.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][user.group.js][update] : " + err.name + ': ' + err.message);
                }

                var msg = {success: true};
                deferred.resolve(msg);
            });
    }


    return deferred.promise;
}

/**
 * update Preparation
 * @param _id
 * @param groupParam
 * @returns {*|promise}
 */
function updatePreparation(_id, groupParam) {
    var deferred = Q.defer();
    var author = groupParam.author;

    // set update file to group object
    var set = {
        PREPARATION: groupParam.preparation,
        UPDATE_PREPARATION_DATE: new Date()
    };

    // find group exist
    db.groups.findById(_id, function (err, group) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.group.js][update] : " + err.name + ': ' + err.message);
        }

        // check group exist
        if (group && group.AUTHOR == author) {
            // update group
            groupUpdate();
        } else {
            // group not found
            deferred.reject(utils.message("MSG001-GP-E"));
        }
    });

    // update group profile
    function groupUpdate(){
        db.groups.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][user.group.js][update] : " + err.name + ': ' + err.message);
                }

                var msg = {success: true};
                deferred.resolve(msg);
            });
    }
    return deferred.promise;
}

/**
 * get group Schedule
 * @param member_id
 * @param _id
 * @returns {*}
 */
function getSchedule(member_id, _id){
    var deferred = Q.defer();

    memberService.findOne(member_id, _id)
        .then(function (member) {
			
			if(member.PERMIT != 0) {
				// find group by id
				db.groups.findById(_id, function (err, group) {
					if (err){
						// database error
						deferred.reject(utils.message("MSG002-CM-E"));
						console.log("[" + new Date()  + "][user.group.js][getGroupSchedule] : " + err.name + ': ' + err.message);
					}

					if (group) {
						// return schedule
						deferred.resolve({SCHEDULE: group.SCHEDULE , UPDATE_SCHEDULE_DATE: group.UPDATE_SCHEDULE_DATE, AUTHOR: group.AUTHOR});
					} else {
						// user not found
						deferred.reject(utils.message("MSG001-GP-E"));
					}
				});
			} else {
				deferred.reject(utils.message("MSG003-MB-E"));
			}
        }).catch(function (subErr) {
        deferred.reject(subErr);
    });

    return deferred.promise;
}

/**
 * get group Preparation
 * @param member_id
 * @param _id
 * @returns {*}
 */
function getPreparation(member_id, _id){
    var deferred = Q.defer();

    memberService.findOne(member_id, _id)
        .then(function (member) {
			
			if(member.PERMIT != 0) {
				// find group by id
				db.groups.findById(_id, function (err, group) {
					if (err){
						// database error
						deferred.reject(utils.message("MSG002-CM-E"));
						console.log("[" + new Date()  + "][user.group.js][getGroupSchedule] : " + err.name + ': ' + err.message);
					}

					if (group) {
						// return preparation
						deferred.resolve({PREPARATION: group.PREPARATION , UPDATE_PREPARATION_DATE: group.UPDATE_PREPARATION_DATE, AUTHOR: group.AUTHOR});
					} else {
						// user not found
						deferred.reject(utils.message("MSG001-GP-E"));
					}
				});
			} else {
				deferred.reject(utils.message("MSG003-MB-E"));
			}
        }).catch(function (subErr) {
        deferred.reject(subErr);
    });

    return deferred.promise;
}

/**
 * Add member to group, only group owner can
 * @param _id
 * @param author
 * @param memberId
 */
function addMember(_id, author, memberId) {
    var deferred = Q.defer();

    // find group exist
    db.groups.findById(_id, function (err, group) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.group.js][addMember] : " + err.name + ': ' + err.message);
        }

        // check group author
        if (group && group.AUTHOR == author) {
            // add group member
            addGroupMember()
        } else {
            // group not found
            deferred.reject(utils.message("MSG001-GP-E"));
        }
    });

    // update group profile
    function addGroupMember(){
        memberService.join(memberId, _id, 1)
            .then(function (subMsg) {
                deferred.resolve(subMsg);
            }).catch(function (subErr) {
            deferred.reject(subErr);
        });
    }

    return deferred.promise;
}

/**
 * Remove member from group, only group owner can
 * @param _id
 * @param author
 * @param memberId
 */
function removeMember(_id, author, memberId) {
	var deferred = Q.defer();

    // find group exist
    db.groups.findById(_id, function (err, group) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.group.js][removeMember] : " + err.name + ': ' + err.message);
        }

        // check group author
        if (group && group.AUTHOR == author) {
            // remove group member
            removeGroupMember()
        } else {
            // group not found
            deferred.reject(utils.message("MSG001-GP-E"));
        }
    });

    // remove group profile
    function removeGroupMember(){
        memberService.leave(memberId, _id)
            .then(function (subMsg) {
                deferred.resolve(subMsg);
            }).catch(function (subErr) {
            deferred.reject(subErr);
        });
    }

    return deferred.promise;
}

/**
 * Get member notes
 * @param groupId
 * @param memberId
 * @returns {*|promise}
 */
function getNotes(groupId, memberId) {

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
				groupDb.aggregate([
					{ $lookup: { from: "users", localField: "MEMBER_ID", foreignField: "_id", as: "MEMBER_INFO"}},
					{ $unwind : "$MEMBER_INFO"},
					{ $project: { MEMBER_ID : 1, MEMBER_FIRSTNAME : "$MEMBER_INFO.FIRSTNAME", MEMBER_LASTNAME : "$MEMBER_INFO.LASTNAME" , NOTE: 1}}

				],function (err, notes) {
					if (err){
						// database error
						deferred.reject(utils.message("MSG015-CM-E"));
						console.log("[" + new Date()  + "][user.group.js][getNotes] : " + err.name + ': ' + err.message);
					}

					// check result empty
					if(!_.isEmpty(notes)){
						deferred.resolve(notes);
					}else{
						// result null
						deferred.reject(utils.message("MSG002-GP-I"));
					}
				});
            }else{
                deferred.reject(utils.message("MSG003-MB-E"));
            }
        });

    return deferred.promise;
}

/**
 * change group status
 * @param _id
 * @param groupParam
 * @param gOpen : set group start activity
 * @param gClose: set group stop activity
 * @returns {*|promise}
 */
function updateStatus(_id, author, gOpen, gClose) {
    var deferred = Q.defer();
	var set = {};
	var message = new gcm.Message();							
								
    // set update file to group object
	if(gOpen != null) {
		set.OPEN = "1";
	}
	
	if(gClose != null) {
		set.CLOSE = "1";
	}
	
    // find group exist
    db.groups.findById(_id, function (err, group) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.group.js][updateStatus] : " + err.name + ': ' + err.message);
        }

        // check group exist
        if (group && group.AUTHOR == author) {
            // update group status
            groupUpdateStatus(group.NAME);
        } else {
            // group not found
            deferred.reject(utils.message("MSG001-GP-E"));
        }
    });

    // update group status
    function groupUpdateStatus(gName){
		
		if(gOpen != null) {
			var bodyMsg = utils.message("MSG002-NF-I", gName);
			message.addData('tag','open_group');
			message.addData('message',utils.message("MSG003-NF-I"));
			message.addData('info',_id);
			
			message.addNotification({
			  title: 'New Activity',
			  body: bodyMsg,
			  icon: 'ic_launcher'
			});
		}
		
		if(gClose != null) {
			var bodyMsg = utils.message("MSG001-NF-I", gName);
			message.addData('tag','close_group');
			message.addData('message',utils.message("MSG004-NF-I"));
			message.addData('info',_id);
			
			message.addNotification({ 
			  title: 'Close Activity',
			  body: bodyMsg,
			  icon: 'ic_launcher'
			});
		}
		
        db.groups.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][user.group.js][updateStatus] : " + err.name + ': ' + err.message);
                }
				
				var groupDb = db.collection("group_member_" + _id);
				groupDb.aggregate([
                        { $lookup: { from: "users", localField: "MEMBER_ID", foreignField: "_id", as: "MEMBER_INFO"}},
                        { $unwind : "$MEMBER_INFO"},
                        { $project: {
                            REG_ID:"$MEMBER_INFO.REG_ID",
							MEMBER_ID : 1,
							_id : 0
							}
                        }
                    ],
                    function (err, members) {
                        if (err){
                            // database error
                            deferred.reject(utils.message("MSG002-CM-E"));
                            console.log("[" + new Date()  + "][group.service.js][getMember] : " + err.name + ': ' + err.message);
                        }

                        if (!_.isEmpty(members)) {
							
							var regIds = [];
                            members.forEach(function(mem) { 					
								if(mem.MEMBER_ID != author) {
									regIds.push(mem.REG_ID);
								}
							});
							
							if (!_.isEmpty(regIds)) {								
								notificationService.push(regIds, message)
								.then(function (respone) {
									console.log("OK ... message was send " + respone);
									deferred.resolve(respone);
								})
								.catch(function (err) {
									console.log("send notification has an error " + err );
									deferred.reject(err);
								});
							}else {
								deferred.reject(utils.message("MSG003-MB-E"));
							}
	
                        } else {
                            deferred.reject(utils.message("MSG003-MB-E"));
                        }
                    });
            });
    }
    return deferred.promise;
}
