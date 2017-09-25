var ProfileManager = require('./profilemanager')
var io = require('socket.io-client')
var request = require('request')

function ChatApp (roomdom, chatdom) {
  var self = this
  self.socket = null
  self.roomDom = roomdom
  self.chatDom = chatdom
  self.roomId = null

  // set room list
  request({
    method: 'GET',
    url: 'http://localhost:3000/chat/rooms',
    headers:
    {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'x-key': ProfileManager.profile.email,
      'x-access-token': ProfileManager.token
    },
    json: true
  }, function (error, response, body) {
    // console.log('get rooms' + JSON.stringify(body))
    if (error) throw new Error(error)
    for (var key in body.rooms) {
      if (body.rooms.hasOwnProperty(key)) {
        // console.log('room: ' + JSON.stringify(body.rooms[key]))
        helpers.updateRoomsList(self, body.rooms[key])
      }
    }
    self.socket = io()
    self.socket.on('connect', function () {
      self.socketauth(self.socket)
      self.setRoomList()
      self.setChat()
    })
  })
}

ChatApp.prototype.socketauth = function (socket) {
  console.log('is connected?')
  socket.emit('authentication', {token: ProfileManager.token})
  socket.on('unauthorized', function (err) {
    console.log('There was an error with the authentication:', err.message)
    console.log('refresh the page')
  })
}

ChatApp.prototype.setRoomList = function () {
  var self = this

  var roomCreate = document.getElementById('room-create')
  // Update rooms list upon emitting updateRoomsList event
  self.socket.on('updateRoomsList', function (room) {
    // console.log('socket: ' + JSON.stringify(room))
    // Display an error message upon a user error(i.e. creating a room with an existing title)
    if (room.error != null) {
      roomCreate.insertAdjacentHTML('beforeend', '<p class="message error">' + room.error + '</p>')
    } else {
      helpers.updateRoomsList(self, room)
    }
  })
  // Whenever the user hits the create button, emit createRoom event.
  document.getElementById('room-create-button').addEventListener('click', function (e) {
    console.log('button click')
    var inputel = document.getElementById('room-create-name')
    var roomTitle = inputel.value.trim() // remove white space from name
    self.socket.emit('createRoom', roomTitle)
    inputel.value = ''
  })
}

ChatApp.prototype.setChat = function () {
  var self = this
  var msgContainer = document.getElementById('chat-history')
  // Update users list upon emitting updateUsersList event
  self.socket.on('updateUsersList', function (users, clear) {
    console.log('socket: ' + JSON.stringify(users))
    if (!self.roomId) return
    if (users.error != null) {
      msgContainer.insertAdjacentHTML('beforeend', '<p class="message error">' + users.error + '</p>')
    } else {
      helpers.updateUsersList(users, clear)
    }
  })
  // Whenever the user hits the save button, emit newMessage event.
  document.getElementById('chat-message-button').addEventListener('click', function (e) {
    if (!self.roomId) return
    var inputel = document.getElementById('chat-message-text')
    var messageContent = inputel.value.trim() // remove white space from name
    if (messageContent !== '') {
      var message = {
        content: messageContent,
        username: ProfileManager.profile.username,
        userId: ProfileManager.profile.userId,
        date: Date.now()
      }

      self.socket.emit('newMessage', self.roomId, message)
      inputel.value = ''
      helpers.addMessage(message)
    }
  })

  // Whenever a user leaves the current room, remove the user from users list
  self.socket.on('removeUser', function (userId) {
    if (!self.roomId) return
    var el = document.getElementById('user-' + userId)
    console.log('remove user ' + userId)
    el.parentNode.removeChild(el)
    helpers.updateNumOfUsers()
  })

  // Append a new message
  self.socket.on('addMessage', function (message) {
    if (!self.roomId) return
    helpers.addMessage(message)
  })
}

ChatApp.prototype.joinRoom = function (roomId, roomTitle) {
  var self = this
  if (self.roomId) {
    self.socket.emit('leaveRoom', self.roomId)
    helpers.clearChatScreen()
  }
  self.roomId = roomId
  document.getElementById('chat-room-title').innerText = roomTitle
  self.socket.emit('join', self.roomId)
}

var helpers = {
  encodeHTML: function (str) {
    return document.createElement('a').appendChild(document.createTextNode(str)).parentNode.innerHTML
  },
  decodeHTML: function (html) {
    var a = document.createElement('a')
    a.innerHTML = html
    return a.textContent
  },
  // Update rooms list
  updateRoomsList: function (chatapp, room) {
    room.title = this.encodeHTML(room.title)

    var el = document.createElement('a')
    el.href = '#'
    el.addEventListener('click', function (e) {
      chatapp.joinRoom(room._id, room.title)
      return false
    })
    el.innerHTML = '<li class="room-item">' + room.title + '</li>'

    // document.getElementById('room-list').firstChild.insertAdjacentHTML('afterbegin', html)
    document.getElementById('room-list').getElementsByTagName('ul')[0].appendChild(el)
    this.updateNumOfRooms()
  },
  // Update users list
  updateUsersList: function (users, clear) {
    if (users.constructor !== Array) {
      users = [users]
    }
    console.log('user ' + JSON.stringify(users))

    var html = ''
    for (var user of users) {
      user.username = this.encodeHTML(user.username)
      html += `<li class="clearfix" id="user-${user.userId}">
      <img src="${user.picture}" alt="${user.username}" />
      <div class="about">
      <div class="name">${user.username}</div>
      <div class="status"><i class="fa fa-circle online"></i> online</div>
      </div></li>`
    }

    if (html === '') { return }

    if (clear != null && clear === true) {
      var el = document.getElementById('users-list').getElementsByTagName('ul')[0]
      while (el.firstChild) { el.removeChild(el.firstChild) }
      el.innerHTML = html
    } else {
      document.getElementById('users-list').getElementsByTagName('ul')[0].insertAdjacentHTML('afterbegin', html)
    }

    this.updateNumOfUsers()
  },

  // Adding a new message to chat history
  addMessage: function (message) {
    message.date = (new Date(message.date)).toLocaleString()
    message.username = this.encodeHTML(message.username)
    message.content = this.encodeHTML(message.content)

    var html = `<li>
    <div class="message-data">
    <span class="message-data-name">${message.username}</span>
    <span class="message-data-time">${message.date}</span>
    </div>
    <div class="message my-message" dir="auto">${message.content}</div>
    </li>`
    document.getElementById('chat-history').getElementsByTagName('ul')[0].insertAdjacentHTML('beforeend', html)

    // Keep scroll bar down
    var objDiv = document.getElementById('chat-history')
    objDiv.scrollTop = objDiv.scrollHeight
  },

  clearChatScreen: function () {
    var el = document.getElementById('users-list').getElementsByTagName('ul')[0]
    while (el.firstChild) { el.removeChild(el.firstChild) }
    var el2 = document.getElementById('chat-history').getElementsByTagName('ul')[0]
    while (el2.firstChild) { el2.removeChild(el2.firstChild) }
  },

  // Update number of rooms
  // This method MUST be called after adding a new room
  updateNumOfRooms: function () {
    var objCount = document.getElementById('room-list').getElementsByTagName('ul')[0].childNodes.length
    document.getElementById('room-num-rooms').innerText = (objCount - 5) + ' Room(s)'
  },

  // Update number of online users in the current room
  // This method MUST be called after adding, or removing list element(s)
  updateNumOfUsers: function () {
    var objCount = document.getElementById('users-list').getElementsByTagName('ul')[0].childNodes.length
    document.getElementById('chat-num-users').innerText = objCount + ' User(s)'
  }
}

module.exports = ChatApp
