/**
 * Created by panda94 on 11/21/2016.
 * Controller gps middleware
 * F- Get: (http://host/gps/get) : get member gps from db
 *
 * Update: 11/21/2016.
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
router.post('/get', function (req, res) {
    // authenticate using api to maintain clean separation between layers
    request.post({
        url: config.apiUrl + '/gps/get',
        form: req.body,
        json: true
    }, function (error, response, body) {

        if (error) {
            // system error
            res.status(401).json({'message':utils.message("MSG001-CM-I") , 'successful' : 'false', 'info' : ''});
        }else if( response.statusCode == 200) {
            // get gps stocked successful
            res.status(200).json({'message':utils.message("MSG001-JP-I") , 'successful' : 'true', 'info' : body.gps});
        }else if(response.statusCode == 400){
            // database error, check token error, member not exist
            res.status(400).json({'message':response.body , 'successful' : 'false', 'info' : ''});
        }else{
            // status exception
            res.status(500).json({'message':utils.message("MSG003-CM-E"), 'successful' : 'false', 'info' : ''});
        }
    });
});

module.exports = router;