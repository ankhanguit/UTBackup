/**
 * Created by panda94 on 09/12/2016.
 * Service , reference collection users
 * F- authenticate
 * F- getById
 * F- create
 * F- update
 * F- validateDynamicCode
 * F- newPassword
 * F- _delete
 * F- updatePassword
 * F- updateDynamicCode
 * F- search
 * F- updateReg
 *
 * Update: 12/11/2016.
 */

var config = require('config.json');
var utils = require('logic/utils.logic');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(process.env.MONGODB_URI, { native_parser: true });

db.bind('users');

var service = {};

service.authenticate = authenticate;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;
service.updateDynamicCode = updateDynamicCode;
service.validateDynamicCode = validateDynamicCode;
service.newPassword = newPassword;
service.updatePassword = updatePassword;
service.search = search;
service.updateReg = updateRegId;

module.exports = service;

/**
 * Check user login
 * @param username
 * @param password
 * @returns {*}
 */
function authenticate(username, password) {
    var deferred = Q.defer();

    // find user
    db.users.findOne({ USERNAME: username }, function (err, user) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.service.js][authenticate] : " + err.name + ': ' + err.message);
        }

        // check password
        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash' ,'STATUS', 'LOCK'));
        } else {
            // authentication failed
            deferred.reject(utils.message("MSG003-ST-E"));
        }
    });

    return deferred.promise;
}

/**
 * get user by id
 * @param _id
 * @returns {*}
 */
function getById(_id) {
    var deferred = Q.defer();

    // find user by id
    db.users.findById(_id, function (err, user) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.service.js][getById] : " + err.name + ': ' + err.message);
        }

        // check exist user
        if (user) {
            // return user
            deferred.resolve(user);
        } else {
            // user not found
            deferred.reject(utils.message("MSG001-UR-E"));
        }
    });

    return deferred.promise;
}

/**
 * Create user account
 * @param userParam
 * @returns {*}
 */
function create(userParam) {
    var deferred = Q.defer();

    // find account exist
    db.users.findOne(
        { USERNAME: userParam.username, EMAIL:userParam.email },
        function (err, user) {
            // database error
            if (err){
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][user.service.js][create] : " + err.name + ': ' + err.message);
            }

            // check exist user
            if (user) {
                // username already exists
                deferred.reject(utils.message("MSG001-ST-E", userParam.username));
            } else {
                // create new account
                createUser();
            }
        });

    function createUser() {
        // set user object to userParam
        var set = {
            USERNAME:userParam.username,
            PASSWORD:userParam.password,
            PHONE:userParam.phone,
            EMAIL: userParam.email,
            FIRSTNAME: userParam.firstname,
            LASTNAME: userParam.lastname,
            BIRTHDAY: "",
            GENDER: "",
            ADDRESS: "",
            DYNAMICCODE: "",
            STATUS: "0",
            LOCK: "0",
			REG_ID : "",
            CREATEDATE: new Date(),
            UPDATEDATE: new Date()
        };
        var user = _.omit(set, 'PASSWORD');

        // add hashed password to user object
        user.hash = bcrypt.hashSync(userParam.password, 10);

        // insert user to database
        db.users.insert(
            user,
            function (err, doc) {
                if (err) {
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][user.service.js][create] : " +err.name + ': ' + err.message);
                }

                deferred.resolve();
            });
    }

    return deferred.promise;
}

/**
 * Update user profile
 * @param _id
 * @param userParam
 * @returns {*}
 */
function update(_id, userParam) {
    var deferred = Q.defer();

    // find exist account
    db.users.findById(_id, function (err, user) {
        if (err) {
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.service.js][update] : " + err.name + ': ' + err.message);
        }

        // check exist user
        if (user) {
            // update user
            updateUser();
        } else {
            deferred.reject(utils.message("MSG001-UR-E"));
        }
    });

    function updateUser() {
        // fields to update
        var set = {
            FIRSTNAME: userParam.firstname,
            LASTNAME: userParam.lastname,
            BIRTHDAY: userParam.birthday,
            GENDER: userParam.gender,
            ADDRESS: userParam.address,
            UPDATEDATE: new Date()
        };

        // update account to database
        db.users.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) {
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][user.service.js][update] : " + err.name + ': ' + err.message);
                }

                deferred.resolve();
            });
    }

    return deferred.promise;
}

/**
 * Validate code for new password
 * @param _id
 * @param code
 * @returns {*}
 */
function validateDynamicCode(_id, code){
    var deferred = Q.defer();

    // find exist account
    db.users.findById(_id, function (err, user) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.service.js][validateDynamicCode] : " + err.name + ': ' + err.message);
        }

        // check dynamic code
        if (user && user.DYNAMICCODE == code) {
            // update account status
            updateStatus();
        } else {
            // user not found
            deferred.reject(utils.message("MSG002-UR-E"));
        }
    });

    function  updateStatus() {
        // fields to update
        var set = {
            STATUS: "1"
        };

        // update account status to database
        db.users.update(
        { _id: mongo.helper.toObjectID(_id) },
        { $set: set },
        function (err, doc) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][user.service.js][validateDynamicCode] : " + err.name + ': ' + err.message);
            }

            flag = {success: true};
            deferred.resolve(flag);
        });
    }

    return deferred.promise;
}

/**
 * User set new password with dynamic code, and account status
 * @param _id
 * @param password
 * @returns {*}
 */
function newPassword(_id, password){
    var deferred = Q.defer();

    // find exist account
    db.users.findOne({ _id: mongo.helper.toObjectID(_id) , STATUS:"1" }, function (err, user) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.service.js][newPassword] : " + err.name + ': ' + err.message);
        }

        // check user exits
        if (user) {
            // update password
            updateUser();
        } else {
            deferred.reject(utils.message("MSG005-UR-E"));
        }
    });

    // update user password
    function updateUser() {

        // fields to update
        // add hashed password to user object
        var set = {
            hash: bcrypt.hashSync(password, 10),
            STATUS: "0",
            DYNAMICCODE: ""
        };

        // update user password to database
        db.users.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][user.service.js][newPassword] : " + err.name + ': ' + err.message);
                }

                flag = {success: true};
                deferred.resolve(flag);
            });
    }

    return deferred.promise;
}

/**
 * Update user password with current password
 * @param _id
 * @param password
 * @returns {*}
 */
function updatePassword(_id, password){
    var deferred = Q.defer();

    // fields to update
    // add hashed password to user object
    var set = {
        hash: bcrypt.hashSync(password, 10)
    };

    // update password to database
    db.users.update(
        { _id: mongo.helper.toObjectID(_id) },
        { $set: set },
        function (err, doc) {
            if (err){
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][user.service.js][updatePassword] : " + err.name + ': ' + err.message);
            }

            flag = {success: true};
            deferred.resolve(flag);
        });


    return deferred.promise;
}

/**
 * Register code for set new password
 * @param _id
 * @param code
 * @returns {*}
 */
function updateDynamicCode(_id, code) {
    var deferred = Q.defer();

    // set field
    var set = {
        DYNAMICCODE: code
    };

    // update user password to database
    db.users.update(
        { _id: mongo.helper.toObjectID(_id) },
        { $set: set },
        function (err, doc) {
            if (err){
                // database error
                deferred.reject(utils.message("MSG002-CM-E"));
                console.log("[" + new Date()  + "][user.service.js][updateDynamicCode] : " + err.name + ': ' + err.message);
            }
            deferred.resolve();
        });
    return deferred.promise;
}

/**
 * delete account physical
 * @param _id
 * @returns {*}
 * @private
 */
function _delete(_id) {
    var deferred = Q.defer();

    // remove account from database
    db.users.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            // database error
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}

/**
 * find user
 * @param text
 */
function search(text) {
    var deferred = Q.defer();
    // prepare query
    db.users.aggregate([
            { $match: {$or: [{ USERNAME:  new RegExp(text, "i")}, { FIRSTNAME: new RegExp(text, "i") },  { LASTNAME: new RegExp(text, "i") }]}},
            { $lookup: { from: "avatars", localField: "_id", foreignField: "USER_ID", as: "AVATAR_INFO"}},
            { $limit : 10 },
            { $unwind : "$AVATAR_INFO"},
            { $project: { _id: 1, USERNAME : 1, FIRSTNAME : 1, LASTNAME : 1, EMAIL: 1, PHONE: 1, AVATAR : "$AVATAR_INFO.AVATAR"}}

    ],function (err, users) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.service.js][find] : " + err.name + ': ' + err.message);
        }

        // check result empty
        if(!_.isEmpty(users)){
            deferred.resolve(users);
        }else{
            // result null
            deferred.reject(utils.message("MSG008-UR-I"));
        }
    });
    return deferred.promise;
}

/**
 * Update REG ID.
 * @param username
 * @param password
 * @param regid
 * @returns {*}
 */
function updateRegId(username, password, regid) {
    var deferred = Q.defer();

    // find user
    db.users.findOne({ USERNAME: username }, function (err, user) {
        if (err){
            // database error
            deferred.reject(utils.message("MSG002-CM-E"));
            console.log("[" + new Date()  + "][user.service.js][updateRegId] : " + err.name + ': ' + err.message);
        }

        // check password
        if (user && bcrypt.compareSync(password, user.hash)) {
            
			db.users.update(
            { _id: user._id },
            { $set: {REG_ID : regid} },
            function (err, doc) {
                if (err){
                    // database error
                    deferred.reject(utils.message("MSG002-CM-E"));
                    console.log("[" + new Date()  + "][user.service.js][updateRegId] : " + err.name + ': ' + err.message);
                }

                flag = {success: true};
                deferred.resolve(flag);
            });
			
        } else {
            // authentication failed
            deferred.reject(utils.message("MSG003-ST-E"));
        }
    });

    return deferred.promise;
}
