// mongoose를 사용하기 위해 해당 모듈을 import
var mongoose = require('mongoose')
var bcrypt = require('bcrypt-nodejs')
var DEFAULT_USER_PICTURE = '/img/user.jpg'
var SALT_WORK_FACTOR = 10

// 스키마 정의
// email, password, token 필드를 가지며 각각의 필드는 string 타입이다.
var Schema = mongoose.Schema
var UserSchema = new Schema({
  email: {type: String, required: true},
  userId: {type: String, default: null},
  username: {type: String, default: null},
  password: {type: String, default: null},
  socialId: {type: String, default: null},
  picture: {type: String, default: DEFAULT_USER_PICTURE},
  userRole: {type: String, default: null}
})

// This Make sure do thins below before save a user document:
// 1. User's picture is assigned, if not, assign it to default one.
// 2. Hash user's password
UserSchema.pre('save', function (next) {
  var user = this
  if (!user.picture) { // ensure user picture is set
    user.picture = DEFAULT_USER_PICTURE
  }
  if (!user.userId) { // make username if it isn't assined
    user.userId = Math.random().toString(36).substr(2)
  }
  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next()
  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err)
    // hash the password using our new salt
    bcrypt.hash(user.password, salt, null, function (err, hash) {
      if (err) return next(err)
      // override the cleartext password with the hashed one
      user.password = hash
      next()
    })
  })
  // next()
})

// Create an Instance method to validate user's password
// This method will be used to compare the given password with the passwoed stored in the database
UserSchema.methods.validatePassword = function (password, callback) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    if (err) return callback(err)
    callback(null, isMatch)
  })
  // callback(null, password === this.password)
}

// 스키마를 이용해서 모델을 정의
// 'User' : mongodb에 저장될 collection이름(테이블명)
// UserSchema : 모델을 정의하는데 사용할 스키마
module.exports = mongoose.model('user', UserSchema)
