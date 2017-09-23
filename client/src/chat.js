var ProfileManager = require('./profilemanager')
var io = require('socket.io-client')

function ChatApp () {
  var self = this
  self.roomsocket = null
  self.chatsocket = null
}

ChatApp.prototype.socketauth = function (socket) {
  socket.emit('authentication', {token: ProfileManager.token})
  socket.on('unauthorized', function (err) {
    console.log('There was an error with the authentication:', err.message)
  })
}

ChatApp.prototype.rooms = function (socket) {
  var self = this
  self.roomsocket = io('/rooms', { transports: ['websocket'] })
  // When socket connects, get a list of chatrooms
  self.roomsocket.on('connect', function () {
    self.socketauth(self.roomsocket)
    // Update rooms list upon emitting updateRoomsList event
    socket.on('updateRoomsList', function (room) {
      // Display an error message upon a user error(i.e. creating a room with an existing title)
      // $('.room-create p.message').remove();
      if (room.error != null) {
        // $('.room-create').append(`<p class="message error">${room.error}</p>`);
      } else {
        app.helpers.updateRoomsList(room)
      }
    })
    // Whenever the user hits the create button, emit createRoom event.
    // $('.room-create button').on('click', function(e) {
    //   var inputEle = $("input[name='title']");
    //   var roomTitle = inputEle.val().trim();
    //   if(roomTitle !== '') {
    //     socket.emit('createRoom', roomTitle);
    //     inputEle.val('');
    //   }
    // });
  })
}

ChatApp.prototype.chat = function (socket) {
  var self = this
  self.chatsocket = io('/chatroom', { transports: ['websocket'] })

  // When socket connects, join the current chatroom
  self.chatsocket.on('connect', function () {
    self.socketauth(self.chatsocket)

    self.chatsocket.emit('join', roomId)
    // Update users list upon emitting updateUsersList event
    self.chatsocket.on('updateUsersList', function (users, clear) {
      // $('.container p.message').remove();
      if (users.error != null) {
        // $('.container').html(`<p class="message error">${users.error}</p>`);
      } else {
        app.helpers.updateUsersList(users, clear)
      }
    })
    // Whenever the user hits the save button, emit newMessage event.
    // $(".chat-message button").on('click', function(e) {
    //   var textareaEle = $("textarea[name='message']");
    //   var messageContent = textareaEle.val().trim();
    //   if(messageContent !== '') {
    //     var message = {
    //       content: messageContent,
    //       username: username,
    //       date: Date.now()
    //     };
    //
    //     self.chatsocket.emit('newMessage', roomId, message);
    //     textareaEle.val('');
    //     app.helpers.addMessage(message);
    //   }
    // });

    // Whenever a user leaves the current room, remove the user from users list
    self.chatsocket.on('removeUser', function (userId) {
      // $('li#user-' + userId).remove();
      app.helpers.updateNumOfUsers()
    })

    // Append a new message
    self.chatsocket.on('addMessage', function (message) {
      app.helpers.addMessage(message)
    })
  })
}

var helpers = {
  encodeHTML: function (str) {
    return $('<div />').text(str).html()
  },
  // Update rooms list
  updateRoomsList: function(room){
    room.title = this.encodeHTML(room.title);
    var html = `<a href="/chat/${room._id}"><li class="room-item">${room.title}</li></a>`

    if (html === '') { return }

    if($(".room-list ul li").length > 0){
      $('.room-list ul').prepend(html);
    }else{
      $('.room-list ul').html('').html(html);
    }

    this.updateNumOfRooms();
  },

  // Update users list
  updateUsersList: function(users, clear){
    if(users.constructor !== Array){
      users = [users];
    }

    var html = '';
    for(var user of users) {
      user.username = this.encodeHTML(user.username);
      html += `<li class="clearfix" id="user-${user._id}">
      <img src="${user.picture}" alt="${user.username}" />
      <div class="about">
      <div class="name">${user.username}</div>
      <div class="status"><i class="fa fa-circle online"></i> online</div>
      </div></li>`;
    }

    if(html === ''){ return; }

    if(clear != null && clear == true){
      $('.users-list ul').html('').html(html);
    }else{
      $('.users-list ul').prepend(html);
    }

    this.updateNumOfUsers();
  },

  // Adding a new message to chat history
  addMessage: function(message){
    message.date      = (new Date(message.date)).toLocaleString();
    message.username  = this.encodeHTML(message.username);
    message.content   = this.encodeHTML(message.content);

    var html = `<li>
    <div class="message-data">
    <span class="message-data-name">${message.username}</span>
    <span class="message-data-time">${message.date}</span>
    </div>
    <div class="message my-message" dir="auto">${message.content}</div>
    </li>`;
    $(html).hide().appendTo('.chat-history ul').slideDown(200);

    // Keep scroll bar down
    $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
  },

  // Update number of rooms
  // This method MUST be called after adding a new room
  updateNumOfRooms: function(){
    var num = $('.room-list ul li').length;
    $('.room-num-rooms').text(num +  " Room(s)");
  },

  // Update number of online users in the current room
  // This method MUST be called after adding, or removing list element(s)
  updateNumOfUsers: function(){
    var num = $('.users-list ul li').length;
    $('.chat-num-users').text(num +  " User(s)");
  }
}

module.exports = new ChatApp()
