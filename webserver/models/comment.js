var Mongoose = require('mongoose')

/**
 *
 */
var CommentSchema = new Mongoose.Schema({
  title: { type: String, required: true },
  commentId: { type: String, default: null },
  ownerId: { type: String, default: null },
  permission: { type: String, default: null },
  insertTime: { type: Date },
  content: { type: String },
  parentCommentId: { type: String, default: null },
  subComments: { type: [{ commentId: String }] }
})

var commentModel = Mongoose.model('comment', CommentSchema)

module.exports = commentModel
