/* global DOMException */

var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var request = require('request')

inherits(ProfileManager, EventEmitter)

function ProfileManager () {
  var self = this

  self.token = null
  self.storeable = storageAvailable('localStorage')
  self.profile = null
  // look for saved local token
}
ProfileManager.prototype.verifyUser = function (cb) {
  var self = this
  if (self.storeable) {
    self.token = window.localStorage.getItem('AuthToken')
    self.profile = JSON.parse(window.localStorage.getItem('UserProfile'))
    if (self.token && self.profile) {
      request({
        method: 'GET',
        url: 'http://localhost:3000/user/profile',
        headers:
        {
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          'x-key': self.profile.email,
          'x-access-token': self.token
        },
        json: true
      }, function (error, response, body) {
        // if (error) throw new Error(error)
        cb(error, body.profile)
      })
    } else {
      cb(new Error('Not assigned Token or Profile'))
    }
  } else {
    cb(new Error('localStorage not available'))
  }
}

ProfileManager.prototype.submitLogin = function (email, password, callback) {
  var self = this
  request({
    method: 'POST',
    url: 'http://localhost:3000/user/login',
    headers:
    {
      'cache-control': 'no-cache',
      'content-type': 'application/json'
    },
    body: {email: email, password: password},
    json: true
  }, function (error, response, body) {
    if (!error && body.status === 'true') {
      self.token = body.token
      self.profile = body.profile
      // {
      //   'email': body.email,
      //   'picture': body.picture,
      //   'userId': body.userId,
      //   'username': body.username
      // }
      window.localStorage.setItem('AuthToken', self.token)
      window.localStorage.setItem('UserProfile', JSON.stringify(self.profile))
    } else {
      error = error || new Error(body.message)
    }
    callback(error, body)
  })
}

ProfileManager.prototype.logout = function (callback) {
  var self = this
  self.token = null
  self.profile = null
  window.localStorage.removeItem('AuthToken')
  window.localStorage.removeItem('UserProfile')
  if (callback) callback()
}

ProfileManager.prototype.submitRegister = function (name, email, password, callback) {
  request({
    method: 'POST',
    url: 'http://localhost:3000/user/registerUser',
    headers:
    {
      'cache-control': 'no-cache',
      'content-type': 'application/json'
    },
    body: {email: email, password: password, username: name},
    json: true
  }, function (error, response, body) {
    if (!error && body.status === 'true') {
      callback(null, body)
    } else {
      error = error || new Error(body.message)
      callback(error, body)
    }
  })
}

function storageAvailable (type) {
  try {
    var storage = window[type]
    var x = '__storage_test__'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  } catch (e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0
  }
}
var prm = new ProfileManager()
window.ProfileManager = prm
module.exports = prm
