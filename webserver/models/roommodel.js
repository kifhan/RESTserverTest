var RoomModel = require('./chatroom')
var User = require('./user')

var create = function (data, callback) {
  var newRoom = new RoomModel(data)
  newRoom.save(callback)
}

var find = function (data, callback) {
  RoomModel.find(data, callback)
}

var findOne = function (data, callback) {
  RoomModel.findOne(data, callback)
}

var findById = function (id, callback) {
  RoomModel.findById(id, callback)
}

// var findByIdAndUpdate = function (id, data, callback) {
//   RoomModel.findByIdAndUpdate(id, data, { new: true }, callback)
// }

/**
* Add a user along with the corresponding socket to the passed room
*
*/
var addUser = function (room, socket, callback) {
  // Get current user's id
  var userId = socket.client.profile.userId
  // console.log('get user id: ' + userId);
  // Push a new connection object(i.e. {userId + socketId})
  var conn = { userId: userId, socketId: socket.id }
  room.connections.push(conn)
  room.save(callback)
}

/**
* Get all users in a room
*
*/
var getUsers = function (room, socket, callback) {
  var users = []
  var vis = {}
  var count = 0
  var userId = socket.client.profile.userId

  // Loop on room's connections, Then:
  room.connections.forEach(function (conn) {
    // 1. Count the number of connections of the current user(using one or more sockets) to the passed room.
    if (conn.userId === userId) {
      count++
    }

    // 2. Create an array(i.e. users) contains unique users' ids
    if (!vis[conn.userId]) {
      users.push(conn.userId)
    }
    vis[conn.userId] = true
  })

  console.log('user ' + JSON.stringify(users))
  // Loop on each user id, Then:
  // Get the user object by id, and assign it to users array.
  // So, users array will hold users' objects instead of ids.
  users.forEach(function (userId, i) {
    User.findOne({userId: userId}, function (err, user) {
      if (err) { return callback(err) }
      users[i] = user
      if (i + 1 === users.length) {
        return callback(null, users, count)
      }
    })
  })
}

/**
* Remove a user along with the corresponding socket from a room
*
*/
var removeUser = function (socket, callback) {
  // Get current user's id
  var userId = socket.client.profile.userId

  find(function (err, rooms) {
    if (err) { return callback(err) }

    // Loop on each room, Then:
    rooms.every(function (room) {
      var pass = true
      var count = 0
      var target = 0

      // For every room,
      // 1. Count the number of connections of the current user(using one or more sockets).
      room.connections.forEach(function (conn, i) {
        if (conn.userId === userId) {
          count++
        }
        if (conn.socketId === socket.id) {
          pass = false
          target = i
        }
      })

      // 2. Check if the current room has the disconnected socket,
      // If so, then, remove the current connection object, and terminate the loop.
      if (!pass) {
        room.connections.id(room.connections[target]._id).remove()
        room.save(function (err) {
          callback(err, room, userId, count)
        })
      }

      return pass
    })
  })
}

module.exports = {
  create,
  find,
  findOne,
  findById,
  addUser,
  getUsers,
  removeUser
}
