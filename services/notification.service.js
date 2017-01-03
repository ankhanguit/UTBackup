/**
 * Created by panda94 on 02/01/2017.
 * Service , notification manager
 * F- push pust notification
 *
 * Update: 02/01/2017.
 */

var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var utils = require('logic/utils.logic');
var db = mongo.db(process.env.MONGODB_URI, { native_parser: true });

db.bind('users');

/*
var admin = require("firebase-admin");
var serviceAccount = require("serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://notificationtest-d278c.firebaseio.com/"
});
*/

var gcm = require('node-gcm');
var sender = new gcm.Sender(config.APIKey);

var service = {};
service.push = push;
module.exports = service;

/**
 * Push notification to member with id
 * @param userid
 * @param message (json)
 * @returns {*}
 */
function push(regIds, message) {
	var deferred = Q.defer();
	// ... or retrying 
	sender.send(message, { registrationTokens: regIds }, function (err, response) {
	  if(err) {
		  deferred.reject(err);
	  } else {
		  deferred.resolve(response);
	  }
	});
	return deferred.promise;
}
