/**
 * Created by panda94 on 10/26/2016.
 *
 * Service , filtering
 * F- Save
 * F- Get
 *
 * Update: 01/01/2017.
 */

var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var utils = require('logic/utils.logic');
var db = mongo.db(process.env.MONGODB_URI, { native_parser: true });

var ObjectId = require('mongodb').ObjectID;
db.bind('members');
db.bind('groups');
var g = require('ger');
var esm = new g.MemESM();
var ger = new g.GER(esm);

var service = {};
service.recommend = recommend;

module.exports = service;

/**
 * group recommend
 * @param userId
 */
function recommend(userId) {
	var deferred = Q.defer();
	
	var groupsIds;
	var destinationss;
	
	getFriendInfo(userId)
		.then(function (groupsId) {
			groupsIds = groupsId;
			
			getDesInfo(userId).
				then(function (destinations) {
					destinationss = destinations;
					db.groups.aggregate([
						{$match : {$or: [{_id: {$in : groupsIds}}, {DECRIPTION :{$in : destinations}}, {NAME :{$in : destinations}},{END_LOCATED : {$elemMatch : { name : {$in : destinations}}}}]}},
					],function(err, results){
						if(err) {
							// database error
							console.log("[" + new Date()  + "][collaborative_filtering.service.js][recommend] : " + err.name + ': ' + err.message);
						}
						
						deferred.resolve(results);
					});
					
				}).catch(function (subErr) {
					
				});
        }).catch(function (subErr) {
			
		});

	return deferred.promise;
}

/**
*	Get groups id array from friend info
*/
var getFriendInfo = function(userId) {
	var deferred = Q.defer();
	
	db.members.aggregate([
	{$match : {MEMBER_ID : mongo.helper.toObjectID(userId)}},
	{$lookup : { from : "members" , localField: "GROUP_ID", foreignField : "GROUP_ID", as : "MEMBERS_INFO" }},
	{$limit :  1000},
	{$unwind : "$MEMBERS_INFO"} ,
	{$project : {
		FRIEND_ID : "$MEMBERS_INFO.MEMBER_ID",
		_id : 0
		}
	},
	{$group : { _id : "$FRIEND_ID"}},
	],function(err, results){
		if(err) {
            // database error
            console.log("[" + new Date()  + "][collaborative_filtering.service.js][recommend] : " + err.name + ': ' + err.message);
		}

		var result = [];
		results.forEach(function(member) { result.push(mongo.helper.toObjectID(member._id)) });
		
		db.members.aggregate([
		{$match : {MEMBER_ID : {$in : result}}},
		{$lookup : { from : "members" , localField: "GROUP_ID", foreignField : "GROUP_ID", as : "MEMBERS_INFO" }},
		{$limit :  1000},
		{$unwind : "$MEMBERS_INFO"} ,
		{$project : {
			namespace : {$concat : ["friend"]}, 		
			person : "$MEMBER", 
			action : {$concat : ["friend"]}, 
			thing : "$MEMBERS_INFO.MEMBER", 
			expires_at : {$concat : ["2020-01-01"]},
			_id : 0
			}},
		],function(err, subResults){
			if(err) {
				// database error
				console.log("[" + new Date()  + "][collaborative_filtering.service.js][recommend] : " + err.name + ': ' + err.message);
			}
			
			get_result_recommend(subResults);
		});
	});
	
	function get_result_recommend(results) {
		ger.initialize_namespace("friend")
				.then( function() {
					return ger.events(results)
				})
				.then( function() {
					// What things might alice like?
					return ger.recommendations_for_person("friend", userId , {actions: {
						friend: 1
					},
						similarity_search_size: 50,
						neighbourhood_size: 20,
						recommendations_per_neighbour: 10
					})
				})
				.then( function(recommendations) {

					var membersId = [];
					recommendations.recommendations.forEach(function(recFriend) { 
						  membersId.push(mongo.helper.toObjectID(recFriend.thing));
					});
					
					db.members.aggregate([
						{$match : {MEMBER_ID : {$in : membersId}}},
						{$project : {
							GROUP_ID : 1,
							_id : 0
							}},
						{$group : { _id : "$GROUP_ID"}},
						],function(err, subResults){
							if(err) {
								// database error
								console.log("[" + new Date()  + "][collaborative_filtering.service.js][recommend] : " + err.name + ': ' + err.message);
							}
							
							var groupsId = []
							
							subResults.forEach(function(recGroup) { groupsId.push(mongo.helper.toObjectID(recGroup._id));});
							deferred.resolve(groupsId);	
					});
				});
	}
	
	return deferred.promise;
}

/**
* get destinations info from user info
*/
var getDesInfo = function(userId) {
	var deferred = Q.defer();
	
	db.members.aggregate([
	{$lookup : { from : "groups" , localField: "GROUP_ID", foreignField : "_id", as : "GROUPS_INFO" }},
	{$limit :  1000},
	{$unwind : "$GROUPS_INFO"} ,
	{$project : { 
		namespace : {$concat : ["Destination"]}, 
		person : "$MEMBER", 
		action : {$concat : ["likes"]}, 
		thing : "$GROUPS_INFO.END_LOCATED.name", 
		expires_at : "$GROUPS_INFO.END_DATE",
		_id : 0
		}},
	],function(err, results){
		if(err) {
            // database error
            console.log("[" + new Date()  + "][collaborative_filtering.service.js][recommend] : " + err.name + ': ' + err.message);
		}
		
		get_result_recommend(results);
	});

	
	function get_result_recommend(results) {
		ger.initialize_namespace("Destination")
				.then( function() {
					return ger.events(results)
				})
				.then( function() {
					// What things might alice like?
					return ger.recommendations_for_person("Destination", userId , {actions: {
						likes: 1
					},
						similarity_search_size: 50,
						neighbourhood_size: 20,
						recommendations_per_neighbour: 10
					})
				})
				.then( function(recommendations) {

					var destinations = [];
					recommendations.recommendations.forEach(function(recDes) { 
						  destinations.push(new RegExp(recDes.thing, "i"));
					});
					
					deferred.resolve(destinations);
				})
	}
	
	return deferred.promise;
}
