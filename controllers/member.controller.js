/**
 * Created by panda94 on 09/12/2016.
 * Controller member middleware
 * F- Join: (http://host/member/join) : add member to group
 * F- Leave: (http://host/member/leave) : member leave group
 * F- Permit: (http://host/member/permit) : permit member join group
 * F- Lock: (http://host/member/lock) : lock member
 * F- getGroup (http://host/member/getGroup) : get list affiliated  groups
 * F- getMember (http://host/member/getMember) : get all members in group
 * F- addTask (http://host/member/addTask) : add member task
 * F- getTask (http://host/member/getTask) : get member task
 * F- addNote (http://host/member/getTask) : add member note
 *
 * Update: 10/12/2016.
 */

var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('config.json');

var utils = require('logic/utils.logic');

/**
 * POST: join group
 * params: author = Id member, token, group = Id group
 */
router.post('/join', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/members/join',
        form: req.body,
        json: true
    }, function (error, response, body) {

        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if( response.statusCode == 200) {
            // join group successful
            res.status(200).json({'message':utils.message("MSG001-MB-I") , 'successful' : 'true', 'info' : ''});
        }else if(response.statusCode == 400){
            // database error, check token error, member exist
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * DELETE: leave group
 * params: author = Id member, token, group = Id group
 */
router.delete('/leave', function (req, res) {
    // register using api to maintain clean separation between layers
    request.delete({
        url: config.apiUrl + '/members/leave',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if (response.statusCode == 200) {
            // leave group successful
            return res.status(200).json({'message':utils.message("MSG002-MB-I") , 'successful' : 'true', 'info' : ''});
        }else if(response.statusCode == 400){
            // database error, check token error
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * POST: permit member
 * params: author = Id group own user, token, group = Id group, member = Id member
 */
router.post('/permit', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/members/permit',
        form: req.body,
        json: true
    }, function (error, response, body) {

        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if( response.statusCode == 200) {
            // permit member successful
            res.status(200).json({'message':utils.message("MSG003-MB-I") , 'successful' : 'true', 'info' : ''});
        }else if(response.statusCode == 400){
            // database error, check token error
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        } else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * POST: lock member
 * params: author = Id group own user, token, group = Id group, member = Id member
 */
router.post('/lock', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/members/lock',
        form: req.body,
        json: true
    }, function (error, response, body) {

        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if( response.statusCode == 200) {
            // lock member successful
            res.status(200).json({'message':utils.message("MSG004-MB-I") , 'successful' : 'true', 'info' : ''});
        }else if(response.statusCode == 400){
            // database error, check token error
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        } else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * POST: get list group
 * params: author = Id user, token
 */
router.post('/getGroup', function (req, res) {
    // register using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/members/getGroup',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if (response.statusCode == 200) {
            // get under groups successful
            return res.status(200).json({'message':utils.message("MSG006-MB-I") , 'successful' : 'true', 'info' : body.groups});
        }else if(response.statusCode == 400){
            // database error, get groups result null
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * POST: get all members in group
 * params: author = Id user, token
 */
router.post('/getMember', function (req, res) {
    // register using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/members/getMember',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if (response.statusCode == 200) {
            // get under groups successful
            return res.status(200).json({'message':utils.message("MSG008-MB-I") , 'successful' : 'true', 'info' : body.members});
        }else if(response.statusCode == 400){
            // database error, get groups result null
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * POST: add member task
 * params: author = Id user, token, Id = groupId, memberId, task
 */
router.post('/addTask', function (req, res) {
    // register using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/members/addTask',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if (response.statusCode == 200) {
            // add task successful
            return res.status(200).json({'message':utils.message("MSG009-MB-I") , 'successful' : 'true', 'info' : ""});
        }else if(response.statusCode == 400){
            // database error, get groups result null
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * POST: get member task
 * params: author = Id user, Id = groupId
 */
router.post('/getTask', function (req, res) {
    // register using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/members/getTask',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if (response.statusCode == 200) {
            // get task successful
            return res.status(200).json({'message':utils.message("MSG010-MB-I") , 'successful' : 'true', 'info' : body.task});
        }else if(response.statusCode == 400){
            // database error, get groups result null
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * POST: add member note
 * params: author = memberId, token, id = Id group, note
 */
router.post('/note', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/members/addNote',
        form: req.body,
        json: true
    }, function (error, response, body) {

        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if( response.statusCode == 200) {
            // add member note successful
            res.status(200).json({'message':utils.message("MSG011-MB-I") , 'successful' : 'true', 'info' : ''});
        }else if(response.statusCode == 400){
            // database error, check token error
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        } else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

module.exports = router;