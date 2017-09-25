var jwt = require('jwt-simple')
var User = require('./../models/user')

var auth = {
  checkExist: function (req, res) {
    var username = req.body.email || ''
    var password = req.body.password || ''

    if (username === '' || password === '') {
      res.status(401)
      res.json({
        'status': 401,
        'message': 'username : ' + username // + ' password : ' + password
      })
      return
    }

    User.findOne({
      email: username
    }, function (error, user) {
      if (error) {
        res.status(401)
        res.json({
          'status': 401,
          'message': 'username : ' + username // + ' password : ' + password
        })
        return
      }

      if (!user) {
        res.json({
          'status': 'false',
          'message': 'user is not exist'
        })
      } else if (user.email === username) {
        res.json({
          'status': 'true',
          'message': 'user exist'
        })
      }
    })
  },

  registerUser: function (req, res) {
    var email = req.body.email || ''
    var password = req.body.password || ''
    var username = req.body.username
    var picture = req.body.picture

    if (email === '' || password === '') {
      res.status(401)
      res.json({
        'status': 401,
        'message': 'email : ' + email // + ' password : ' + password
      })
      return
    }

    User.findOne({
      email: email
    }, function (error, user) {
      if (error) {
        res.status(401)
        res.json({
          'status': 401,
          'message': 'email : ' + email // + ' password : ' + password
        })
        return
      }

      if (!user) {
        var newUser = new User({
          email: email,
          password: password,
          username: username,
          picture: picture
          // userRole: 'admin'
        })

        newUser.save(function (error, data) {
          if (error) {
            res.status(401)
            res.json({
              'status': 401,
              'message': 'oopse unknown error In registerUser'
            })
          } else {
            res.json({
              'status': 'true',
              'message': 'successfully registered'
            })
          }
        })
      } else {
        res.json({
          'status': 'false',
          'message': 'user already exist'
        })
      }
    })
  },

  login: function (req, res) {
    var email = req.body.email || ''
    var password = req.body.password || ''
    console.log(email)
    if (email === '' || password === '') {
      res.status(401)
      res.json({
        'status': 401,
        'message': 'Login failed'
      })
      return
    }

    User.findOne({
      email: email
    }, function (error, user) {
      if (error) {
        res.status(401)
        res.json({
          'status': 401,
          'message': 'Login failed'
        })
      } else if (!user) {
        res.json({
          'status': 'false',
          'message': 'Non-validate user'
        })
      } else {
        user.validatePassword(password, function (err, isMatch) {
          if (err || !isMatch) {
            res.json({
              'status': 'false',
              'message': 'Incorrect email or password'
            })
            return
          }
          var data = genToken(user)
          res.json({
            'status': 'true',
            'message': 'validate user',
            'token': data.token,
            'profile': user
          })
        })
      }
    })
  },

  getAllUserList: function (req, res) {
    User.find({}, function (error, users) {
      if (error) {
        res.status(401)
        res.json({
          'status': 401,
          'message': 'error in AllUserList'
        })
      } else {
        res.json({
          'status': 'true',
          'message': 'find all users!',
          'userData': users
        })
      }
    })
  },

  getOneUserData: function (req, res) {
    var username = (req.params && req.params.email)
    var emailinkey = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key']

    if (!username && !emailinkey) {
      res.status(401)
      res.json({
        'status': 401,
        'message': 'username : ' + username
      })
      return
    }

    User.findOne({
      email: username || emailinkey
    }, function (error, user) {
      if (error) {
        res.status(401)
        res.json({
          'status': 401,
          'message': 'error in getOneUserData'
        })
      } else if (user) {
        res.json({
          'status': 'true',
          'message': 'find user!',
          'profile': user
        })
      } else {
        res.json({
          'status': 'false',
          'message': 'user doesnt exist'
        })
      }
    })
  },

  updateUser: function (req, res) {
    var newData = req.body
    var username = req.params.email

    if (username === '') {
      res.status(401)
      res.json({
        'status': 401,
        'message': 'username : ' + username
      })
      return
    }

    User.findOne({
      email: username
    }, function (error, user) {
      if (error) {
        res.status(401)
        res.json({
          'status': 401,
          'message': 'error in updateUser'
        })
      } else if (user) {
        user.email = newData.email
        user.password = newData.password
        user.userRole = newData.userRole
        user.save(function (error, updatedUser) {
          if (error) {
            res.status(401)
            res.json({
              'status': 401,
              'message': 'error in updateUser/save'
            })
          } else {
            res.json({
              'status': 'true',
              'message': 'update user!',
              'profile': updatedUser
            })
          }
        })
      } else {
        res.json({
          'status': 'false',
          'message': 'user doesnt exist'
        })
      }
    })
  },

  deleteUser: function (req, res) {
    var username = req.params.email

    if (username === '') {
      res.status(401)
      res.json({
        'status': 401,
        'message': 'username : ' + username
      })
      return
    }

    User.remove({
      email: username
    }, function (error, user) {
      if (error) {
        res.status(401)
        res.json({
          'status': 401,
          'message': 'error in getOneUserData'
        })
      } else {
        res.json({
          'status': 'true',
          'message': 'user deleted'
        })
      }
    })
  }
}

// private method
function genToken (user) {
  var expires = expiresIn(7) // 7 days
  var token = jwt.encode({
    exp: expires,
    email: user.email,
    userId: user.userId,
    username: user.username,
    picture: user.picture
  }, require('../config/secret')())

  return {
    token: token,
    expires: expires,
    user: user
  }
}

function expiresIn (numDays) {
  var dateObj = new Date()
  return dateObj.setDate(dateObj.getDate() + numDays)
}

module.exports = auth
