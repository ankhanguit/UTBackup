var config = require('config.json');
var express = require('express');
var router = express.Router();
var tokenService = require('services/token.service');

// routes
router.post('/create', createToken);
router.delete('/delete:token', deleteToken);

module.exports = router;

function deleteToken(req, res) {
    var token = req.param.token;

    tokenService.delete(token)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function createToken(req, res) {
    var token = req.param.token;

    tokenService.create(token)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}