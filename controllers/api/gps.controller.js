/**
 * Created by panda94 on 11/21/2016.
 * Controller gps handle
 *
 * F- get: (http://host/gps/get), middleware: (http://host/gps/get) : get gps stocked
 *
 * Update: 11/21/2016.
 */

var config = require('config.json');
var express = require('express');
var router = express.Router();
var utils = require('logic/utils.logic');

var gpsService = require('services/gps.service');
var tokenService = require('services/token.service');

// routes
router.post('/get', getGps);

module.exports = router;

/**
 * get gps stocked
 * @param req: author = Id member, token, group = group Id , key
 * @param res
 */
function getGps(req, res) {

    var author = req.body.author;
    var token = req.body.token;
    var group = req.body.group;
    var key = req.body.key;

    // check token
    tokenService.checkToken(author, token)
        .then(function (subMsg) {
            getGpsStocked();
        }).catch(function (subErr) {
        res.status(400).send(subErr);
    });

    // add member to group
    function getGpsStocked(){
        gpsService.get(author, group, key)
            .then(function (gps) {
                res.status(200).send({gps: gps});
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    }
}
