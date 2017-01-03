require('rootpath')();
var express = require('express');
var app = express();
var socket = require('socket.io');
var session = require('express-session');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('config.json');

var raccoon = require('raccoon');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: config.secret, resave: false, saveUninitialized: true }));

// use JWT auth to secure the api
app.use('/api', expressJwt({ secret: config.secret }).unless({ path: [
    '/api/users/authenticate',
    '/api/users/register',
    '/api/users/update',
    '/api/users/requestChangePassword',
    '/api/users/validateDynamicCode',
    '/api/users/updatePassword',
    '/api/users/newPassword',
    '/api/users/uploadAvatar',
    '/api/users/getAvatar',
    '/api/users/search',
    '/api/users/view',
	'/api/users/regid',
    '/api/groups/add',
    '/api/groups/update',
    '/api/groups/updateSchedule',
    '/api/groups/updatePreparation',
    '/api/groups/getSchedule',
    '/api/groups/getPreparation',
    '/api/groups/getMessages',
    '/api/groups/get',
    '/api/groups/search',
    '/api/groups/delete',
    '/api/groups/addMember',
    '/api/groups/removeMember',
	'/api/groups/getNotes',
	'/api/groups/open',
	'/api/groups/close',
    '/api/members/leave',
    '/api/members/permit',
    '/api/members/lock',
    '/api/members/join',
    '/api/members/getGroup',
    '/api/members/getMember',
    '/api/members/addTask',
    '/api/members/getTask',
	'/api/members/addNote',
    '/api/gps/get'

] }));

// routes
app.use('/site', require('./controllers/site.controller'));
app.use('/user', require('./controllers/user.controller'));
app.use('/group', require('./controllers/group.controller'));
app.use('/member', require('./controllers/member.controller'));
app.use('/gps', require('./controllers/gps.controller'));
app.use('/api/users', require('./controllers/api/users.controller'));
app.use('/api/groups', require('./controllers/api/groups.controller'));
app.use('/api/members', require('./controllers/api/members.controller'));
app.use('/api/gps', require('./controllers/api/gps.controller'));

// make '/app' default route
app.get('/', function (req, res) {
    return res.redirect('/site/login');
});

// start server
var server = app.listen(8080, function () {
    console.log('Start server successful in port : ' + server.address().port);
});


var io = socket.listen(server);
require('./socket/routes')(app, io);
require('./socket/map.socket')(app, io);