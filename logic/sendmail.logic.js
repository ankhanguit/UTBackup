var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var nodemailer = require('nodemailer');
var logic = {};

logic.sendmail = sendmail;

module.exports = logic;

function sendmail(reciever, body) {
    var deferred = Q.defer();

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: config.transporter, // Transporter email id
            pass: config.transporterPass // Transporter password
        }
    });

    var mailOptions = {
        from: 'uitgomailer@gmail.com', // sender address
        to: reciever, // list of receivers
        subject: 'UITGO Change password', // Subject line
        text: body //, // plaintext body
        // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log("[" + new Date()  + "][sendmail.logic][sendmail] : " +  error);
            deferred.reject("Send mail has error");
        }else{
            console.log('Message sent: ' + info.response);
            var msg = {success : true};
            deferred.resolve(msg);
        }
    });

    return deferred.promise;
}