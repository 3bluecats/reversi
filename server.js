/* Include static file webserver server */
/* Include the static file webserver library */
var static = require('node-static');
/* Include the http server library */
var http = require('http');
/* Assume that I am running on Heroku */
var port = process.env.PORT;
var directory = __dirname + '/public';
/* If I am not on Heroku, then I need to readjust the port and directory information, because port won't be set */
if(typeof port == 'undefined' || !port) {
  directory = './public';
  port = 8080;
}
/* Set up a static web-server that will deliver files from file system */
var file = new static.Server(directory);
/* Construct an http server that gets files from the file server */
var app = http.createServer(
  function(request, response) {
    request.addListener('end',
      function() {
        file.serve(request, response);
      }
    ).resume();
  }
).listen(port);
console.log('The server is running.');
/****************************************/
/*    Set up the web socket server     */
var io = require("socket.io").listen(app);
io.sockets.on("connection", function (socket) {
  function log() {
    var array = ["*** Server Log Message:"];
    for (var i = 0; i <arguments.length; i++) { 
        array.push(arguments[i]);
        console.log(arguments[i]);
    }
    socket.emit("log",array);
    socket.broadcast.emit("log",array);
  }
  log("A web site connected to the server");
  socket.on("disconnect", function (socket) {
    log('A web site disconnected from the server'); 
  });

  /*join_room command*/
  /*payload:
  {
    "room":room to join,
    "username":username of person joining
  }
  join_room_response:
  }
    "result": "success",
    "room":room joined,
    "username": username that joined,
    "membership":number of people in the room including the new one
}
or
{
    "result": "fail",
    "message":failure message
}
*/

  socket.on("join_room", function (payload){
    log("server received a command", "join_room",payload);
    if (("undefined"===typeof payload)|| !payload){
      var error_message="join_room had no payload, command aborted";
      log (error_message);
      socket.emit("join_room_response", {
                                            result:"fail",
                                            message:error_message
                                        });
      return;                                    
      }
      var room=payload.room;
      if (("undefined"===typeof room)|| !room){
        var error_message="join_room didn\'t specify a room, command aborted";
        log (error_message);
        socket.emit("join_room_response", {
                                              result:"fail",
                                              message:error_message
                                          });
        return; 
      }

      var username =payload.username;

      if (("undefined"===typeof username) || !username){
        var error_message="join_room didn\'t specify a username command aborted";
        log(error_message);
        socket.emit("join_room_response", {
                                              result:"fail",
                                              message:error_message
                                          });
        return;
      }
      
      var username=payload.username;
      if(("undefined"=== typeof username) || !username){
        var error_message="join_room didn\'t specify a username, command aborted";
        log (error_message);
        socket.emit("join_room_response",      {
                                                result:"fail",
                                                message:error_message
                                              });
        return;                                      
      }  
      
      var room=payload.room;
      if(("undefined"=== typeof room) || !room){
        var error_message="join_room didn\'t specify a room, command aborted";
        log (error_message);
        socket.emit("join_room_response",      {
                                                result:"fail",
                                                message:error_message
                                              });
        return;                                      
      }  



    socket.join(room);

    var roomObject=io.sockets.adapter.rooms[room];
    if(("undefined"===typeof roomObject)||!roomObject){
        var error_message="join_room couldn\'t create a room (internal error), command aborted";
        log(error_message);
        socket.emit("join_room_response",             {
                                                          result:"fail",
                                                          message: error_message
                                                      });
        return;
      }
      var numClients=roomObject.length;
      var success_data=       {
                                  result: "success",
                                  room: room,
                                  username:username,
                                  membership: (numClients+1)
                              };
      io.sockets.in(room).emit("join_room_response",success_data);
      log("Room"+room+"was just joined by"+username);                            
      });






/* send_message command */
/* payload:
      {
        "room": room to join,
        "username": username of person sending the message,
        "message": the message to send 
      }
      send_message_response: 
      {
        "result": "success",
        "username": username of the person that spoke, 
        "message": the message spoke
      }
      or
      {
        "result": "fail",
        "message": failure message
        ;

    */

      socket.on("send_message", function (payload){
        log("server received a command", "send_message",payload);
        if (("undefined"===typeof payload)|| !payload){
          var error_message="send_message had no payload, command aborted";
          log (error_message);
          socket.emit("send_message_response", {
                                                result:"fail",
                                                message:error_message
                                            });
          return;                                    
          }

          var room=payload.room;
          if (("undefined"===typeof room) || !room){
            var error_message="send_message didn\'t specify a room, command aborted";
            log (error_message);
            socket.emit("send_message_response", {
                                                  result:"fail",
                                                  message:error_message
                                              });
            return; 
          }
    
          var username =payload.username;
          if (("undefined"===typeof username) || !username){
            var error_message="send_message didn\'t specify a username command aborted";
            log(error_message);
            socket.emit("send_message_response", {
                                                  result:"fail",
                                                  message:error_message
                                              });
            return;
          }
          
          var message=payload.message;
          if(("undefined"=== typeof message) || !message){
            var error_message="send_message didn\'t specify a message, command aborted";
            log (error_message);
            socket.emit("send_message_response",      {
                                                    result:"fail",
                                                    message:error_message
                                                  });
            return;                                      
          }  
    
          var success_data= {
                                                    result:"success",
                                                    room:room,
                                                    username:username,
                                                    message:message
                                                
                                                  };
    
        io.sockets.in(room).emit("send_message_response",success_data);
                log("Message sent to room" + room + "by" + username + "success_data:"+JSON.stringify(success_data));                            
        });



/* invite command */
/* payload:
      {
        "requested_user": the socket id of the person to be invited
      }
      invite_response: 
      {
        "result": "success",
        "socket_id":the socket id of the person being invited
      }
      or
      {
        "result": "fail",
        "message": failure message
      } 
      invited:
      {
        "result": "success",
        "socket_id": the socket id of the person being invited 
      }
      or
      {
        "result":"fail",
        "message":failure message
      }
    
    */

   socket.on("invite",function (payload){
    log("invite with"+JSON.stringify(payload));

  /* Check to make sure that a payload was sent */
  
    if (("undefined"===typeof payload)|| !payload){
      var error_message= "invite had no payload, command aborted";
      log (error_message);
      socket.emit("invite_response", {
                                            result:"fail",
                                            message:error_message
                                        });
      return;                                    
    }

      /* Check that the message can be traced to a username */

      var username= players[socket.id].username;
      if (("undefined" === typeof username) || !username){
        var error_message="invite can\'t identify who sent the message";
        log (error_message);
        socket.emit("invite_response", {
                                              result:"fail",
                                              message: error_message
                                          });
        return; 
      }

      var requested_user = payload.requested_user;
      if (("undefined" === typeof requested_user) || !requested_user){
        var error_message="invite didn\'t specify a requested_user command aborted";
        log(error_message);
        socket.emit("invite_response", {
                                              result: "fail",
                                              message: error_message
                                          });
        return;
      }
      
      var room = players[socket.id].room;
      var roomObject = io.sockets.adapter.rooms[room];

      /*Make sure the user being invited is in the room*/
      if (!roomObject.sockets.hasOwnProperty(requested_user)){
        var error_message = "invite requested a user that wasn\'t in the room, command aborted";
        log (error_message);
        socket.emit("invite_response", {
                                                result:"fail",
                                                message: error_message
                                              });
      return;                                    
}  
      /* If everything is okay respond to the inviter that is was successful */
      var success_data= {
                                                result:"success",
                                                socket_id: requested_user
                        };

      socket.emit("invite_response", success_data);

      /* Tell the invitee that they have been invited */
      var success_data={
                                                result:"success",
                                                socket_id: socket.id
                                                };

      socket.to(requested_user).emit("invited", success_data);
      log("invite successful");
  });


}); 

