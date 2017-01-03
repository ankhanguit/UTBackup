var tokenService = require('services/token.service');
var memberService = require('services/member.service');
var gpsService = require('services/gps.service');

module.exports = function(app,io) {

    var map = io.of('/map').on('connection', function (socket) {

        socket.on('mConnect', function(data) {

            var userId = data.userId;
            var token = data.token;
            var groupId = data.groupId;
            var longitude  = data.longitude ;
            var latitude = data.latitude;

            // check token
            tokenService.checkToken(userId, token)
                .then(function (subMsg) {
                    // check member login
                    memberService.findMember(userId, groupId)
                        .then(function (member) {

                            // show log new member
                            console.log("New member join GROUP MAP: " + data.groupId + "with ID: " + data.userId);


                            // setting socket information
                            socket.userid = userId;
                            socket.firstname = member.FIRSTNAME;
                            socket.lastname = member.LASTNAME;
							socket.username = member.USERNAME;
							socket.permit = member.PERMIT;
							socket.gopen = member.OPEN;
							socket.gclose = member.CLOSE;
                            socket.longitude = 0;
                            socket.latitude = 0;
                            socket.room = groupId;
							
							if(member.OPEN == "1" && member.CLOSE == "0") {

								// Add the client to the room
								socket.join(groupId);

								// create data set for response
								var dataRes = {
									message: "new member join map group",
									success: "true",
									flag: "new-member",
									data: {
										userId: socket.userid,
										firstname: socket.firstname,
										lastname: socket.lastname,
										username: socket.username,
										permit: socket.permit,
										longitude : longitude ,
										latitude: latitude
									}
								};

								// broadcast message
								map.in(data.groupId).emit('mConnect', dataRes);
							}

                        }).catch(function (subErr) {
                        // create data set for response
                        var dataRes = {message:subErr , success: "false", flag: "login", data:""};

                        // login fail, send fail login message
                        socket.emit('mConnect',dataRes);
                    });
                }).catch(function (subErr) {
                // create data set for response
                var dataRes = {message:subErr , success: "false", flag: "login", data:""};

                // login fail, send fail login message
                socket.emit('mConnect',dataRes);
            });
        });

        socket.on('mLocation', function(data) {

			if(socket.permit != 0 && socket.gopen == "1" && socket.gclose == "0") {
				var longitude  = data.longitude ;
				var latitude = data.latitude;
				var flag = data.flag;
				var time = new Date();
				var userId = socket.userid;
				var groupId = socket.room;
				var message = data.message;

				socket.latitude = latitude;
				socket.longitude = longitude;

				gpsService.add(userId, groupId, flag, latitude, longitude, message)
					.then(function (msg) {
						map.in(socket.room).emit('mLocation', {
							message: "Send broadcast location successful",
							success: "true",
							flag: flag,
							data: {
								userId : socket.userid,
								username: socket.username,
								permit: socket.permit,
								firstname: socket.firstname,
								lastname: socket.lastname,
								longitude : longitude ,
								latitude: latitude,
								time: time
							}
						});
					}).catch(function (subErr) {

					socket.emit('mLocation', {
						message: "Can't save your location",
						success: "false",
						flag: "save-false",
						data: ""
					});

				});
			}
        });

        socket.on('disconnect', function () {
            console.log(socket.username + ' disconnected');
            // create data set for response
            var dataRes = {
                message: "A member leave room",
                success: "true",
                flag: "member-leave",
                data: {
                    userId : socket.userid,
                    username: socket.username,
                    firstname: socket.firstname,
                    lastname: socket.lastname,
					permit: socket.permit,
                    longitude : socket.longitude ,
                    latitude: socket.latitude
                }
            };

            // broadcast message
            map.in(socket.room).emit('mLocation', dataRes);
        });
    });
};
