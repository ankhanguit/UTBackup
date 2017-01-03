/**
 * Created by panda94 on 09/12/2016.
 * Controller site middleware
 * F- Update: (http://host/user/update) : user update profile
 * F- Delete: (http://host/user/delete) : logic delete user account
 * F- RequestChangePassword: (http://host/user/requestChangePassword) : user require change password (forgot password)
 * F- ValidateDynamicCode: (http://host/user/validateDynamicCode) : user check change password code
 * F- NewPassword (http://host/user/newpassword) : user register new password (forgot password)
 * F- UpdatePassword (http://host/user/updatepassword) : user update password
 * F- UploadAvatar (http://host/user/uploadAvatar) : user upload avatar
 * F- GetAvatar (http://host/user/getAvatar) : user get avatar
 * F- Search (http://host/user/search) : search users by username, firstname, lastname
 * F- View (http://host/user/view) : view user profile
 * F- Regid (http://host/user/regid) : update reg id
 * Update: 15/12/2016.
 */

var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('config.json');
var nodemailer = require('nodemailer');


var utils = require('logic/utils.logic');

var sendmailLogic = require('logic/sendmail.logic');


/**
 * PUT: user update profile
 * params: firstname, lastname, email, address, gender, id, token
 */
router.put('/update', function (req, res) {
    // update user using api to maintain clean separation between layers
    request.put({
        url: config.apiUrl + '/users/update',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if(response.statusCode == 200){
            // update user successful
            res.status(200).json({'message':utils.message("MSG002-UR-I"), 'successful': 'true', 'info': ""});
        }else if(response.statusCode == 400){
            // database error, validate user error, update user error
            res.status(400).json({'message':response.body  , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }

    });
});


/**
 * DELETE: delete logic user
 * params:
 * -N : incomplete
 */
router.get('/delete', function (req, res) {
    var text = "Your code to change password is : 2568";
    sendmailLogic.sendmail("anhkhanguit@gmail.com", text)
        .then(function (success) {
            if (success) {
                res.status(200).json({'message':'Send mail successful' , 'successful' : 'true', 'info' : ''});
            }else {
                res.status(200).json({'message':'Send mail failure' , 'successful' : 'false', 'info' : ''});
            }
        })
        .catch(function (err) {
            res.status(200).json({'message':'Send mail failure' , 'successful' : 'false', 'info' : ''});
        });
});


/**
 * POST: user request new password
 * params: id = Id user
 */
router.post('/requestChangePassword', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/users/requestChangePassword',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if(response.statusCode == 200){
            // request new code for change password successful
            res.status(200).json({'message':utils.message("MSG001-UR-I"), 'successful': 'true', 'info': ''});
        }else if(response.statusCode == 400){
            // database error, check token login error, update new code error
            res.status(400).json({'message':response.body, 'successful': 'false', 'info': ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }

    });
});

/**
 * POST: user validate dynamic code, get from request change password
 * params: userId, code
 */
router.post('/validateDynamicCode', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/users/validateDynamicCode',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if(response.statusCode == 200){
            // validate new password code successful
            res.status(200).json({'message':utils.message("MSG003-UR-I"), 'successful': 'true', 'info': ''});
        }else if(response.statusCode == 400){
            // database error, find user error
            res.status(400).json({'message':response.body, 'successful': 'false', 'info': ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }

    });
});

/**
 * PUT: user register new password
 * params: id = Id user, password
 */
router.put('/newPassword', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.put({
        url: config.apiUrl + '/users/newPassword',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if(response.statusCode == 200){
            // user set new password successful
            res.status(200).json({'message':utils.message("MSG005-UR-I"), 'successful': 'true', 'info': ''});
        }else if(response.statusCode == 400){
            // database error, check account permit set new password fail
            res.status(400).json({'message':response.body, 'successful': 'false', 'info': ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }

    });
});

/**
 * PUT: user update password
 * params: id = Id user, password, newpassword, repassword
 */
router.put('/updatePassword', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    var newpassword = req.body.newpassword;
    var repassword = req.body.repassword;

    if(newpassword == repassword) {

        request.put({
            url: config.apiUrl + '/users/updatePassword',
            form: req.body,
            json: true
        }, function (error, response, body) {
            if (error) {
                // system error
                res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
            }else if (response.statusCode == 200) {
                // update password successful
                res.status(200).json({'message':utils.message("MSG004-UR-I"), 'successful': 'true', 'info': ''});
            }else if (response.statusCode == 400) {
                // database error, check password error
                res.status(400).json({'message':response.body, 'successful': 'false', 'info': ''});
            }else{
                // status exception
                res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
            }
        });
    }else{
        // form validate error
        res.status(501).json({'message':utils.message("MSG004-UR-E"), 'successful': 'false', 'info': ''});
    }
});

/**
 * POST: user upload image for avatar
 * params: userId, token, avatar
 */
router.post('/uploadAvatar', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/users/uploadAvatar',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if(response.statusCode == 200){
            // upload avatar successful
            res.status(200).json({'message':utils.message("MSG006-UR-I"), 'successful': 'true', 'info': ''});
        }else if(response.statusCode == 400){
            // database error, find user error
            res.status(400).json({'message':response.body, 'successful': 'false', 'info': ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }

    });
});

/**
 * POST: user get avatar
 * params: userId
 */
router.post('/getAvatar', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/users/getAvatar',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if(response.statusCode == 200){
            // get avatar successful
            res.status(200).json({'message':utils.message("MSG007-UR-I"), 'successful': 'true', 'info': body.avatar});
        }else if(response.statusCode == 400){
            // database error, find user error
            res.status(400).json({'message':response.body, 'successful': 'false', 'info': ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }

    });
});

/**
 * POST: search users by username, firstname, lastname (public)
 * params: name = username, firstname, lastname (prefix)
 */
router.post('/search', function (req, res) {
    // register using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/users/search',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if (response.statusCode == 200) {
            // search has result
            return res.status(200).json({'message':utils.message("MSG009-UR-I") , 'successful' : 'true', 'info' : body.users});
        }else if(response.statusCode == 400){
            // database error, result search null
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * POST: view user profile
 * params: author, token, id
 */
router.post('/view', function (req, res) {
    // register using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/users/view',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if (response.statusCode == 200) {
            // get user profile successful
            return res.status(200).json({'message':utils.message("MSG010-UR-I") , 'successful' : 'true', 'info' : body.user});
        }else if(response.statusCode == 400){
            // database error, result search null
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * PUT: user register new password
 * params: id = Id user, password
 */
router.put('/regid', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.put({
        url: config.apiUrl + '/users/regid',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if(response.statusCode == 200){
            // update regid successful
            res.status(200).json({'message':utils.message("MSG011-UR-I"), 'successful': 'true', 'info': ''});
        }else if(response.statusCode == 400){
            // database error, check account failure
            res.status(400).json({'message':response.body, 'successful': 'false', 'info': ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }

    });
});

module.exports = router;