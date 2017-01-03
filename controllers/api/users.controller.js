/**
 * Created by panda94 on 09/12/2016.
 * Controller site handle
 *
 * F- AuthenticateUser: (http://host/api/users/authenticate), middleware: (http://host/site/login) : user login system
 * F- RegisterUser: (http://host/api/users/register), middleware: (http://host/site/register) : user register account
 * F- GetCurrentUser: (http://host/site/current)
 * F- UpdateUser: (http://host/api/users/update), middleware: (http://host/user/update) : update user profile
 * F- RequestChangePassword: (http://host/api/users/requestChangePassword),
 *      middleware: (http://host/user/requestChangePassword) : request code new password
 * F- ValidateDynamicCode: (http://host/api/users/validateDynamicCode),
 *      middleware: (http://host/user/validateDynamicCode) : validate code new password
 * F- NewPassword: (http://host/api/users/newPassword), middleware: (http://host/user/newPassword) : new password (forgot case)
 * F- UpdatePassword (http://host/api/users/updatePassword), middleware: (http://host/user/updatePassword) : update password
 * F- UploadAvatar (http://host/api/users/uploadAvatar), middleware: (http://host/user/uploadAvatar) : save or update user avatar
 * F- GetAvatar (http://host/api/users/getAvatar), middleware: (http://host/user/getAvatar) : get user avatar
 * F- Search (http://host/api/users/search), middleware: (http://host/user/search) : search users by username, firstname, lastname
 * F- View (http://host/api/users/view), middleware: (http://host/user/view) : view user profile
 * F- Regid (http://host/api/users/reqid), middleware: (http://host/user/regid) : update reg id
 *
 * Update: 10/12/2016.
 */

var config = require('config.json');
var express = require('express');
var router = express.Router();

var userService = require('services/user.service');
var avatarService = require('services/avatar.service');
var tokenService = require('services/token.service');
var sendmailLogic = require('logic/sendmail.logic');
var utils = require('logic/utils.logic');
var _ = require('lodash');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

// routes
router.post('/authenticate', authenticateUser);
router.post('/register', registerUser);
router.post('/getAvatar', getAvatar);
router.post('/uploadAvatar', uploadAvatar);
router.post('/requestChangePassword' , requestChangePassword);
router.post('/validateDynamicCode' , validateDynamicCode);
router.post('/search' , search);
router.post('/view' , view);
router.put('/regid' , updateReg);
router.put('/newPassword' , newPassword);
router.put('/updatePassword' , updatePassword);
router.get('/current', getCurrentUser);
router.put('/update', updateUser);
router.delete('/:_id', deleteUser);

module.exports = router;

/**
 * POST: user login
 * @param req: username, password
 * @param res
 */
function authenticateUser(req, res) {
    userService.authenticate(req.body.username, req.body.password)
        .then(function (user) {
            // authentication successful
            var token = jwt.sign({ sub: user._id }, config.secret);
            createToken(user._id.toString(), token);
            res.status(200).send({ user: user , token: token });
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * POST: user register
 * @param req: username, password, phone, email
 * @param res
 */
function registerUser(req, res) {
    userService.create(req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * Get Current user
 * @param req
 * @param res
 */
function getCurrentUser(req, res) {
    userService.getById(req.user.sub)
        .then(function (user) {
            if (user) {
                res.send(user);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * PUT: update user profile
 * @param req: firstname, lastname, birthday, gender, address, token , userId
 * @param res
 */
function updateUser(req, res) {
    var author = req.body.id;
    var token = req.body.token;

    // check token and userId match with database
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            console.log("validate user authenticate success");

            userService.update(author, req.body)
                .then(function () {
                    res.sendStatus(200);
                })
                .catch(function (err) {
                    res.status(400).send(err);
                });
        }).catch(function (subErr) {
        res.status(400).send(subErr)
    });
}

/**
 * POST: request code new password
 * @param req: id = Id user
 * @param res
 */
function requestChangePassword(req, res){
    var userId = req.body.id;
    console.log("request change password, userid = " + userId);

    userService.getById(userId)
        .then(function (user) {
            sendMail(user.EMAIL, user._id, req, res);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * POST: validate code new password
 * @param req: id = Id user, code
 * @param res
 */
function validateDynamicCode(req, res){
    var userId = req.body.id;
    var code = req.body.code;
    console.log("[" + new Date()  + "][users.controller.js][validateDynamicCode] : " +
        "validate code change password, user id = " + userId + " - code: " + code);

    userService.validateDynamicCode(userId , code)
        .then(function (msg) {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * PUT: new password
 * @param req: id = Id user, password
 * @param res
 */
function newPassword(req, res){
    var userId = req.body.id;
    var password = req.body.password;
    console.log("change password, userid = " + userId);

    userService.newPassword(userId , password)
        .then(function (msg) {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * PUT: update password
 * @param req: id = Id user, password; newpassword
 * @param res
 */
function updatePassword(req, res){
    var userId = req.body.id;
    var password = req.body.password;
    var newpassword = req.body.newpassword;

    userService.getById(userId).then(function (user) {
            if (user && bcrypt.compareSync(password, user.hash)) {
                userService.updatePassword(userId, newpassword)
                    .then(function (msg) {
                        res.sendStatus(200);
                    })
                    .catch(function (err) {
                        res.status(400).send(err);
                    });
            } else {
                res.status(400).send(utils.message("MSG003-UR-E"));
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * DELETE: delete user
 * @param req: userId
 * @param res
 */
function deleteUser(req, res) {
    var userId = req.user.sub;
    if (req.params._id !== userId) {
        // can only delete own account
        res.status(401).send('You can only delete your own account');
    }

    userService.delete(userId)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * POST: save or update user avatar
 * @param req:  userId, token, avatar
 * @param res
 */
function uploadAvatar(req, res) {
    var author = req.body.author;
    var token = req.body.token;


    // check token and userId match with database
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            avatarService.save(author, req.body.avatar)
                .then(function () {
                    res.sendStatus(200);
                })
                .catch(function (err) {
                    res.status(400).send(err);
                });
        }).catch(function (subErr) {
        res.status(400).send(subErr)
    });
}

/**
 * POST: get user avatar
 * @param req:  userId
 * @param res
 */
function getAvatar(req, res) {
    var author = req.body.author;

    avatarService.get(author)
        .then(function (avatar) {
            res.status(200).send({avatar: avatar});
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * Search users by username, firstname, lastname
 * @param req: name =  username, firstname, lastname (prefix)
 * @param res
 */
function search(req, res){

    var name = req.body.name;
    userService.search(name)
        .then(function (users) {
            res.status(200).send({users: users});
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * View user profile
 * @param req: author, token, id
 * @param res
 */
function view(req, res){

    var author = req.body.author;
    var token = req.body.token;
    var id = req.body.id;

    // check token and userId match with database
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            userService.getById(id)
                .then(function (user) {
                    res.status(200).send({user: _.omit(user, 'hash' ,'STATUS', 'LOCK', 'DYNAMICCODE')});
                })
                .catch(function (err) {
                    res.status(400).send(err);
                });
        }).catch(function (subErr) {
        res.status(400).send(subErr)
    });
}

/**
 * function : create token when login successful
 * @param author
 * @param token
 */
function createToken(author, token){
    tokenService.create(author, token)
        .then(function (subMsg) {
        }).catch(function (subErr) {

    });
}

/**
 * Send code new password to user email
 * @param receiver
 * @param userId
 * @param req
 * @param res
 */
function sendMail(reciever, userId, req, res){
    var code = Math.floor(1000 + Math.random() * 9000);
    var text = "Your code to change password is : " + code;
    console.log("User change password with code: " + code);

    sendmailLogic.sendmail(reciever, text)
        .then(function (success) {
                updateDynamicCode(userId, code, res);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * update dynamic code
 * @param userId
 * @param code
 */
function updateDynamicCode(userId, code, res){
    userService.updateDynamicCode(userId, code)
        .then(function (user) {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

/**
 * PUT: update reg id
 * @param req: username, password, regid
 * @param res
 */
function updateReg(req, res) {
    userService.updateReg(req.body.username, req.body.password, req.body.regid)
        .then(function (msg) {
            // authentication successful
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
		
	
}