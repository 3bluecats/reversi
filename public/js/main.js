    /* functions for general use */

    /* This function returns the value associated with 'whichParam' on the URL*/
    
    function getURLParameters (whichParam){

    var pageURL = window.location.search.substring(1);
    var pageURLVariables = pageURL.split('&');

    console.log('Inside getURLParameter() function');

    for (var i = 0; i<pageURLVariables.length; i++) {
        var parameterName = pageURLVariables[i].split('=');
        if (parameterName[0] == whichParam) {
            console.log('parameterName= ' + parameterName);
            return parameterName[1];
        }    
    }
}

    var username= getURLParameters('username');
    if('undefined' == typeof username || !username){
    username= 'Anonymous_'+Math.random();
}

var chat_room = getURLParameters('game_id');
if ('undefined' == typeof chat_room || !chat_room) {
  chat_room ='lobby';
}

/* Connect to the socket server */

        var socket = io.connect();

        /* What to do when the server sends me a log message */
    
        socket.on('log',function(array){
        console.log.apply(console,array);
    });

    /* What to do when the server responds that somone joined a room */
    socket.on('join_room_response',function(payload){
      if(payload.result == 'fail'){
          alert(payload.message);
          return;
      }
      /* If we are being notified that we joined the room, then ignore it */
      if (payload.socket_id == socket.id){
        return;
      }

      /* If someone joined then add a new row to the lobby table */
      var dom_elements = $('.socket_'+payload.socket_id);

        /* If we don't already have an entry for this person */
        if(dom_elements.length == 0) {
          var nodeA = $('<div></div>');
          nodeA.addClass('socket_'+payload.socket_id);
          
          var nodeB = $('<div></div>');
          nodeB.addClass('socket_'+payload.socket_id);
          
          var nodeC = $('<div></div>');
          nodeC.addClass('socket_'+payload.socket_id);
  
          nodeA.addClass('w-100');
          
          nodeB.addClass('col-9 text-right');
          nodeB.append('<h4>'+payload.username+'</h4>');
          
          nodeC.addClass('col-3 text-left');
          var buttonC = makeInviteButton(payload.socket_id);
          nodeC.append(buttonC);
  
          nodeA.hide();
  
          nodeB.hide();
  
          nodeC.hide();

          $('#players').append(nodeA,nodeB,nodeC);
          nodeA.slideDown(1000);
          nodeB.slideDown(1000);
          nodeC.slideDown(1000);
      }
  
  
      /* If we have seen the person who just joined (something weird happened) */
  
      else {
        uninvite(payload.socket_id);
          var buttonC = makeInviteButton(payload.socket_id);
          $('.socket_'+payload.socket_id+' button').replaceWith(buttonC);
          dom_elements.slideDown(1000);
      }

      /*manage the message that a new player has joined*/ 
      var newHTML = '<p>' +payload.username+' just entered the lobby</p>';
      var newNode = $(newHTML);
      newNode.hide();
      $('#messages').append(newNode);
      newNode.slideDown(1000);
    });

    /* What to do when the server says that somone has left the room */
    socket.on('player_disconnected',function(payload){
      if(payload.result == 'fail'){
          alert(payload.message);
          return;
      }
      /* If we are being notified that we left the room, then ignore it */
      if (payload.socket_id == socket.id){
        return;
      }

      /* If someone joined left the room then animate out all their content */
      var dom_elements = $('.socket_'+payload.socket_id);

        /* If something exists */
        if(dom_elements.length != 0) {
          dom_elements.slideUp(1000);
      }
  
  
      /* Manage the message that the player has left */
      var newHTML = '<p>' +payload.username+' has left the lobby</p>';
      var newNode = $(newHTML);
      newNode.hide();
      $('#messages').append(newNode);
      newNode.slideDown(1000);
    });

   /*Send an invite message to the server*/
    
   function invite (who){
    var payload= {};
    payload.requested_user = who;

    console.log('***Client Log Message: \'invite\' payload: '+JSON.stringify(payload));
    socket.emit('invite',payload);
  }

  /* Handle an invite response after sending an invite message to the server*/
  socket.on('invite_response',function(payload){
    
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    var newNode=makeInvitedButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
}); 


  /* Handle an invite response after sending an invite message to the server*/
  socket.on('invited',function(payload){
    
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    var newNode=makePlayButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

 /*******/
    /*Send an uninvite message to the server*/
    
    function uninvite (who) {
      var payload= {};
      payload.requested_user = who;
  
      console.log('***Client Log Message: \'uninvite\' payload: '+JSON.stringify(payload));
      socket.emit('uninvite',payload);
  }
      /* Handle an uninvite response after sending an invite message to the server*/

      socket.on('uninvite_response',function(payload){
          if (payload.result == 'fail') {
              alert(payload.message);
          return;
      }

      var newNode = makeInviteButton(payload.socket_id);
      $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
  });   
  
      /* Handle a notification that we have been uninvited*/
      socket.on('uninvited',function(payload){
          if (payload.result == 'fail'){
              alert(payload.message);
          return;
      }
      
      var newNode = makeInviteButton(payload.socket_id);
      $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
  
  });

   /*Send game_start message to the server*/
    
    function game_start (who) {
      var payload= {};
      payload.requested_user = who;
  
      console.log('***Client Log Message: \'game start\' payload: '+JSON.stringify(payload));
      socket.emit('game_start',payload);
  }
     
  
      /* Handle a notification that we have been engaged*/
      socket.on('game_start_response',function(payload){
          if (payload.result == 'fail'){
              alert(payload.message);
          return;
      }
      
      var newNode = makeEngagedButton(payload.socket_id);
      $('.socket_'+payload.socket_id+' button').replaceWith(newNode);

     /*Jump to a new page */
     window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
  });

  function send_message() {
    var payload = {};
    payload.room = chat_room;
    payload.message = $('#send_message_holder').val();
    console.log('*** Client Log Messsage: \'send message\' payload: '+JSON.stringify(payload));
    socket.emit('send_message', payload);
} 

    socket.on('send_message_response',function(payload){
      if(payload.result == 'fail'){
          alert(payload.message);
          return;
      }
      var newHTML = '<p><b>'+payload.username+'says: </b>'+payload.message+'</p>';
      var newNode = $(newHTML)
      newNode.hide()
      $('#messages').append(newNode);
      newNode.slideDown(1000);
    });

   
function makeInviteButton(socket_id) {
  var newHTML = '<button type=\'button\' class=\'btn btn-outline-primary\'>Invite</button>';
  var newNode = $(newHTML);
  newNode.click(function(){
  invite(socket_id);
});
return (newNode);
}

function makeInvitedButton(socket_id) {
var newHTML = '<button type=\'button\' class=\'btn btn-primary\'> Invited </button>';
var newNode = $(newHTML);
newNode.click(function(){
  uninvite(socket_id);
});
return (newNode);
}

function makePlayButton(socket_id) {
var newHTML = '<button type=\'button\' class=\'btn btn-success\'> Play </button>';
var newNode = $(newHTML);
newNode.click(function(){
  game_start(socket_id);
});
return(newNode);
}

function makeEngagedButton() {
var newHTML = '<button type=\'button\' class=\'btn btn-danger\'>Engaged</button>';
var newNode = $(newHTML);
return (newNode);
}

    $(function(){ 
      /* Defines values coming in from server payload */
      var payload = {};
      payload.room = chat_room;
      payload.username = username;
      console.log('*** Client Log Message: \'join_room\' payload: '+JSON.stringify(payload));

      /* Sending message to server saying we want to join a room. */
      socket.emit('join_room',payload);
    });

    var old_board = [
      ['?','?','?','?','?','?','?','?'],
      ['?','?','?','?','?','?','?','?'],
      ['?','?','?','?','?','?','?','?'],
      ['?','?','?','?','?','?','?','?'],
      ['?','?','?','?','?','?','?','?'],
      ['?','?','?','?','?','?','?','?'],
      ['?','?','?','?','?','?','?','?'],
      ['?','?','?','?','?','?','?','?']
    ];

    socket.on('game_update', function(payload){
      console.log('*** Client Log Message: \'game_update\'\n\tpayload:'+JSON.stringify(payload));

       /*Check for a board update */
       if(payload.result == 'fail') {
        console.log(payload.message);
        window.location.href = 'lobby.html?username='+username;
        return;
      }

        /*Check for a good board in the payload*/
        var board = payload.game.board;
        if( 'undefined' == typeof board || !board){
         console.log('internal error: received malformed board update from the server');
        return;
      }
       
       /*Update color */
        /*Animate changes to the board*/
        var row,column;
        for(row = 0; row < 8; row++){
          for(column = 0; column < 8; column++){
            /*If the board space has changed */
          if(old_board[row][column] != board[row][column]){
            if(old_board[row][column] == '?' && board [row][column] == ' '){
              $('#'+row+'_'+column).html('<img src="assets/images/empty.gif" alt="empty square"/>');
            }
            else if(old_board[row][column] == '?' && board[row][column] == 'w'){
              $('#'+row+'_'+column).html('<img src="assets/images/empty_to_white.gif" alt="white square"/>');
            }
            else if(old_board[row][column] == '?' && board[row][column] == 'b'){
              $('#'+row+'_'+column).html('<img src="assets/images/empty_to_black.gif" alt="black square"/>');
            }
            else if(old_board[row][column] == ' ' && board[row][column] == 'w'){
              $('#'+row+'_'+column).html('<img src="assets/images/empty_to_white.gif" alt="white square"/>');
            }
            else if(old_board[row][column] == ' ' && board[row][column] == 'b'){
              $('#'+row+'_'+column).html('<img src="assets/images/empty_to_black.gif" alt="black square"/>');
            }
            else if(old_board[row][column] == 'w' && board[row][column] == ' '){
              $('#'+row+'_'+column).html('<img src="assets/images/white_to_empty.gif" alt="empty square"/>');
            }
            else if(old_board[row][column] == 'b' && board[row][column] == ' '){
              $('#'+row+'_'+column).html('<img src="assets/images/black_to_empty.gif" alt="empty square"/>');
            }
            else if(old_board[row][column] == 'w' && board[row][column] == 'b'){
              $('#'+row+'_'+column).html('<img src="assets/images/white_to_black.gif" alt="black square"/>');
            }
            else if(old_board[row][column] == 'b' && board[row][column] == 'w'){
              $('#'+row+'_'+column).html('<img src="assets/images/black_to_white.gif" alt="white square"/>');
            }
            else{
              $('#'+row+'_'+column).html('<img src="assets/images/error.gif" alt="error"/>');
            }
          }
        }
      }
      old_board = board;
    });