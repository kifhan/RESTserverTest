var Mongoose = require('mongoose')

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 */
var RoomSchema = new Mongoose.Schema({
  title: { type: String, required: true },
  ownerId: { type: String, default: null },
  permission: { type: String, default: null },
  connections: { type: [{ userId: String, socketId: String }] }
})

var roomModel = Mongoose.model('chatroom', RoomSchema)

module.exports = roomModel
