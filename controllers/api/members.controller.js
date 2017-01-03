/**
 * Created by panda94 on 09/12/2016.
 * Controller member handle
 *
 * F- JoinGroup: (http://host/api/members/join), middleware: (http://host/member/join) : member join group
 * F- LeaveGroup: (http://host/api/members/leave), middleware: (http://host/member/leave) : member leave group
 * F- PermitMember: (http://host/members/permit) , middleware: (http://host/member/permit) : permit member join group
 * F- LockMember: (http://host/api/members/lock), middleware: (http://host/member/lock) : lock member from group own
 * F- getGroup: (http://host/api/members/getGroup), middleware: (http://host/member/getGroup) : get list affiliated  groups
 * F- getMember: (http://host/api/members/getMember), middleware: (http://host/member/getMember) : get all members in groups
 * F- addTask: (http://host/api/members/addTask), middleware: (http://host/member/addTask) : add member task
 * F- getTask: (http://host/api/members/getTask), middleware: (http://host/member/getTask) : get member task
 * F- AddNote: (http://host/api/members/addNote), middleware: (http://host/member/note) : add member note
 * 
 * Update: 29/12/2016.
 */

var config = require('config.json');
var express = require('express');
var router = express.Router();
var utils = require('logic/utils.logic');

var memberService = require('services/member.service');
var tokenService = require('services/token.service');
var groupService = require('services/group.service');

// routes
router.post('/join', joinGroup);
router.delete('/leave', leaveGroup);
router.post('/permit', permission);
router.post('/lock', lock);
router.post('/getGroup', getGroup);
router.post('/getMember', getMember);
router.post('/addTask', addTask);
router.post('/getTask', getTask);
router.post('/addNote', addNote);

module.exports = router;

/**
 * Member join group
 * @param req: author = Id member, token, group = group Id
 * @param res
 */
function joinGroup(req, res) {

    var author = req.body.author;
    var token = req.body.token;
    var group = req.body.group;

    // check token
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            join();
        }).catch(function (subErr) {
            res.status(400).send(subErr);
    });

    // add member to group
    function join(){
		groupService.getById(group)
		.then(function (groups) {
                if(groups._PRIVATE == 0) {
					memberService.join(author, group, 0)
						.then(function (msg) {
							res.sendStatus(200);
						})
						.catch(function (err) {
							res.status(400).send(err);
						});
				} else {
					res.status(400).send(utils.message("MSG016-GP-I"));
				}
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }
}

/**
 * Member leave group
 * @param req: author = Id member, token, group = Id group
 * @param res
 */
function leaveGroup(req, res) {
    var groupId = req.body.group;
    var author = req.body.author;
    var token = req.body.token;

    // check token
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            leave()
        }).catch(function (subErr) {
            res.status(400).send(subErr);
    });

    // remove member from group
    function leave(){
        memberService.leave(groupId, author)
            .then(function (msg) {
                res.sendStatus(200);
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }

}

/**
 * Permit member
 * @param req: author = Id group own, token, group = Id group, member = Id member
 * @param res
 */
function permission(req, res) {

    var author = req.body.author;
    var token = req.body.token;
    var group = req.body.group;
    var member_id = req.body.member;

    // check token
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            permit();
        }).catch(function (subErr) {
            res.status(400).send(subErr);
    });

    // update member status
    function permit(){
        memberService.permit(member_id, group)
            .then(function (msg) {
                res.sendStatus(200);
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }
}

/**
 * Lock member
 * @param req: author = Id group own, token, group = Id group, member = Id member
 * @param res
 */
function lock(req, res) {

    var author = req.body.author;
    var token = req.body.token;
    var group = req.body.group;
    var member_id = req.body.member;

    // check token
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            lockMember();
        }).catch(function (subErr) {
            res.status(400).send(subErr);
    });

    // update member status
    function lockMember(){
        memberService.lock(member_id, group)
            .then(function (msg) {
                res.sendStatus(200);
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }
}

/**
 * get list affiliated  groups
 * @param req: author = Id user, token,
 * @param res
 */
function getGroup(req, res){

    var author = req.body.author;
    var token = req.body.token;

    // check token
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            getListGroups();
        }).catch(function (subErr) {
        res.status(400).send(subErr);
    });

    // get list group
    function getListGroups(){
        memberService.getGroup(author)
            .then(function (groups) {
                res.status(200).send({groups: groups});
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }
}

/**
 * get all members in groups
 * @param req: author = Id user, token, id = Id group
 * @param res
 */
function getMember(req, res){

    var author = req.body.author;
    var token = req.body.token;
    var group_id = req.body.id;

    // check token
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            getListMembers();
        }).catch(function (subErr) {
        res.status(400).send(subErr);
    });

    // get list group
    function getListMembers(){
        memberService.getMember(group_id, author)
            .then(function (members) {
                res.status(200).send({members: members});
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }
}

/**
 * Add member task
 * @param req: author = Id user, token, id = Id group, memberId, task
 * @param res
 */
function addTask(req, res){

    var author = req.body.author;
    var token = req.body.token;
    var group_id = req.body.id;
    var member_id = req.body.memberId;
    var task = req.body.task;

    // check token
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            addMemberTask();
        }).catch(function (subErr) {
        res.status(400).send(subErr);
    });

    // add member task
    function addMemberTask(){
        memberService.addTask(group_id, member_id, task)
            .then(function (msg) {
                res.sendStatus(200);
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }
}

/**
 * Get member task
 * @param req: author = Id user, token, id = Id group
 * @param res
 */
function getTask(req, res){

    var author = req.body.author;
    var token = req.body.token;
    var group_id = req.body.id;

    // check token
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            getMemberTask();
        }).catch(function (subErr) {
        res.status(400).send(subErr);
    });

    // get member task
    function getMemberTask(){
        memberService.getTask(group_id, author)
            .then(function (task) {
                res.status(200).send({task: task});
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }
}

/**
 * Add member note
 * @param req: author = Id user, token, id = Id group, note
 * @param res
 */
function addNote(req, res){

    var author = req.body.author;
    var token = req.body.token;
    var group_id = req.body.id;
	var note = req.body.note;

    // check token
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            addNote();
        }).catch(function (subErr) {
        res.status(400).send(subErr);
    });

    // add member note
    function addNote(){
        memberService.addNote(group_id, author, note)
            .then(function (msg) {
                res.sendStatus(200);
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }
}

