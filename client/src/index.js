var ProfileManager = require('./profilemanager')

ProfileManager.verifyUser(function (err, profile) {
  var roomSectionElement = document.getElementById('room-section')
  var chatSectionElement = document.getElementById('chat-section')
  var loginSectionElement = document.getElementById('login-section')
  if (err) {
    // 로그인이 안되어 있으면
    roomSectionElement.style.display = 'none'
    chatSectionElement.style.display = 'none'

    // 먼저 로그인 화면에서 go-register를 누르면 fade out 되도록 한다
    var loginformElement = document.getElementById('login-form')
    var registerformElement = document.getElementById('register-form')

    var registerTxt = document.getElementById('go-register')
    registerTxt.addEventListener('click', function () {
      fadeOutIn(loginformElement, registerformElement, 500)
    })

    var loginTxt = document.getElementById('go-login')
    loginTxt.addEventListener('click', function () {
      fadeOutIn(registerformElement, loginformElement, 500)
    })

    loginformElement.addEventListener('submit', function (e) {
      e.preventDefault()
      ProfileManager.submitLogin(document.loginForm.identifier.value, document.loginForm.password.value, function (err, msg) {
        if (err) {
          throw err
        }
      })
      return false // stop propagating
    })

    registerformElement.addEventListener('submit', function (e) {
      e.preventDefault()
      ProfileManager.submitRegister(document.registerForm.username.value, document.registerForm.identifier.value, document.registerForm.password.value, function (err, msg) {
        if (err) {
          throw err
        }
      })
      return false // stop propagating
    })
  } else {
    // 로그인이 되어 있으면 바로 채팅 창으로 이동
    loginSectionElement.style.display = 'none'
    roomSectionElement.style.display = 'block'
  }
})

/**
 * Utility Functions
*/
function fadeOutIn (outElem, InElement, speed) {
  if (!outElem.style.opacity) {
    outElem.style.opacity = 1
  } // end if

  var outInterval = setInterval(function () {
    outElem.style.opacity -= 0.04
    if (outElem.style.opacity <= 0) {
      clearInterval(outInterval)

      outElem.style.display = 'none'
      InElement.style.display = 'block'
      InElement.style.opacity = 0

      var inInterval = setInterval(function () {
        InElement.style.opacity = Number(InElement.style.opacity) + 0.04
        if (InElement.style.opacity >= 1) clearInterval(inInterval)
      }, speed / 50)
    }
  }, speed / 50)
} // end fadeOut()
