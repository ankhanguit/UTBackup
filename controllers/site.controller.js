/**
 * Created by panda94 on 09/12/2016.
 * Controller site middleware
 * F- Login: (http://host/site/login) : user login system
 * F- Register: (http://host/site/register) : user register account
 * F- Logout: (http://host/site/logout) : user logout system
 * F- Authentication: (http://host/site/authentication) : user check token
 *
 * Update: 10/12/2016.
 */


var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('config.json');

var utils = require('logic/utils.logic');
var tokenService = require('services/token.service');


/**
 * POST: user login
 * params: username, password
 */
router.post('/login', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/users/authenticate',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if(response.statusCode == 400) {
            // username or password is incorrect
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else if(response.statusCode == 200){
            // login successful
            res.status(200).json({'message':body.token , 'successful' : 'true', 'info' : body.user});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * POST: user register
 * params: username, password, phone, email
 */
router.post('/register', function (req, res) {
    // register using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/users/register',
        form: req.body,
        json: true
    }, function (error, response, body) {
        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        } else if(response.statusCode == 200){
            // register successful
            res.status(200).json({'message':utils.message("MSG001-ST-I") , 'successful' : 'true', 'info' : ''});
        }else if (response.statusCode == 400) {
            // username or email is already taken
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

/**
 * POST: user logout
 * params: author = Id User, token
 */
router.post('/logout', function (req, res) {
    // logout using api to maintain clean separation between layers
    if(req.body.author && req.body.token) {
        tokenService.delete(req.body.author, req.body.token).then(function (success) {
                if(success){
                    // logout successful
                    return res.status(200).json({'message':'' , 'successful' : 'true', 'info' : ''});
                }
            })
            .catch(function (err) {
                // system error
                return res.status(401).json({'message':utils.message("MSG005-ST-E") , 'successful' : 'false', 'info' : ''});
            });
    }else{
        // author or token invalid
        res.status(401).json({'message':utils.message("MSG004-ST-E") , 'successful' : 'false', 'info' : ''});
    }
});

/**
 * POST: user authenticate
 * params: token
 */
router.post('/authenticate', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    if(req.body.token) {
        tokenService.find(req.body.token).then(function (success) {
                if(success){
                    // check token successful
                    return res.status(200).json({'message':'' , 'successful' : 'true', 'info' : ''});
                }
            })
            .catch(function (err) {
                // system error
                return res.status(401).json({'message':utils.message("MSG005-ST-E") , 'successful' : 'false', 'info' : ''});
            });
    }else{
        // token invalid
        res.status(401).json({'message':utils.message("MSG004-ST-E") , 'successful' : 'false', 'info' : ''});
    }
});

module.exports = router;