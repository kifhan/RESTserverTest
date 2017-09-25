var socketio = require('socket.io')
// var User = require('../webserver/models/User')
// var RoomManager = require('./roommanager')

var socketioAuth = require('socketio-auth')
var authconfig = require('./socketauth')

var Room = require('../webserver/models/roommodel')

module.exports = function (server) {
  var io = socketio.listen(server)
  socketioAuth(io, {
    authenticate: authconfig.authenticate,
    postAuthenticate: authconfig.postAuthenticate,
    disconnect: authconfig.disconnect,
    timeout: 5000
  })

  // io.on('connection', function (socket) {
  //   socket.on('join', function (message) {
  //   })
  //
  //   socket.on('chat message', function (msg) {
  //     io.emit('chat message', msg)
  //   })
  //
  //   socket.on('disconnect', function () {
  //     console.log('Client has disconnected: ' + socket.id)
  //   })
  // })

  // Rooms namespace
  io.on('connection', function (socket) {
    // Create a new room
    socket.on('createRoom', function (title) {
      Room.findOne({'title': new RegExp('^' + title + '$', 'i')}, function (err, room) {
        if (err) throw err
        if (room) {
          socket.emit('updateRoomsList', { error: 'Room title already exists.' })
        } else {
          Room.create({
            title: title,
            ownerId: socket.client.profile.userId,
            permission: 'public'
          }, function (err, newRoom) {
            if (err) throw err
            socket.emit('updateRoomsList', newRoom)
            socket.broadcast.emit('updateRoomsList', newRoom)
          })
        }
      })
    })

    // Join a chatroom
    socket.on('join', function (roomId) {
      Room.findById(roomId, function (err, room) {
        if (err) throw err
        if (!room) {
          // Assuming that you already checked in router that chatroom exists
          // Then, if a room doesn't exist here, return an error to inform the client-side.
          socket.emit('updateUsersList', { error: 'Room doesnt exist.' })
        } else {
          Room.addUser(room, socket, function (err, newRoom) {
            if (err) throw err

            // Join the room channel
            socket.join(newRoom._id)

            Room.getUsers(newRoom, socket, function (err, users, countUserInRoom) {
              if (err) throw err
              // Return list of all user connected to the room to the current user
              socket.emit('updateUsersList', users, true)

              // Return the current user to other connecting sockets in the room
              // ONLY if the user wasn't connected already to the current room
              if (countUserInRoom >= 1) {
                socket.broadcast.to(newRoom.id).emit('updateUsersList', users[users.length - 1])
              }
            })
          })
        }
      })
    })

    function leaveRoom () {
      // Find the room to which the socket is connected to,
      // and remove the current user + socket from this room
      Room.removeUser(socket, function (err, room, userId, countUserInRoom) {
        if (err) throw err
        // Leave the room channel
        socket.leave(room.id)
        // Return the user id ONLY if the user was connected to the current room using one socket
        // The user id will be then used to remove the user from users list on chatroom page
        if (countUserInRoom === 1) {
          socket.broadcast.to(room.id).emit('removeUser', userId)
        }
      })
    }

    socket.on('leaveRoom', leaveRoom)
    // When a socket exits
    socket.on('disconnect', leaveRoom)

    // When a new message arrives
    socket.on('newMessage', function (roomId, message) {
      // No need to emit 'addMessage' to the current socket
      // As the new message will be added manually in 'main.js' file
      // socket.emit('addMessage', message);
      socket.broadcast.to(roomId).emit('addMessage', message)
    })
  })
}
