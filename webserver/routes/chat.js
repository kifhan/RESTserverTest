var ChatRoom = require('../models/chatroom')
// var ChatMessage = require('../models/comment')

var ChatRoute = {
  getRoomList: function (req, res) {
    ChatRoom.find(function (error, rooms) {
      if (error) {
        res.status(401)
        res.json({
          'status': 401,
          'message': 'error in AllRoomList'
        })
      } else {
        res.json({
          'status': 'true',
          'message': 'find all rooms!',
          'rooms': rooms
        })
      }
    })
  }
}
module.exports = ChatRoute
