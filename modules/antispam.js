  module.exports = (App) => {
  App.start_antispam = function () {
    App.antispam_nicknames = {}
    App.antispam_timeout()
    console.info(`Started antispam`)
  }

  // Starts a timeout to check spam on nicknames
  App.antispam_timeout = function () {
    setTimeout(function () {
      App.antispam_timeout_action()
    }, App.antispam_check_delay)
  }

  // What to do on each anti spam iteration
  App.antispam_timeout_action = function () {
    for (let key in App.antispam_nicknames) {
      let user = App.antispam_nicknames[key]

      if (user.banned) {
        if (Date.now() > user.banned_until) {
          user.banned = false
          user.banned_until = 0
          user.level = 0
        }
      } else {
        if (user.level > 0) {
          user.level -= 1
        }
      }
    }

    App.antispam_timeout()
  }

  // Add spam points and check if user is banned
  App.add_spam = function (nickname, amount = 1) {
    let nick = nickname.toLowerCase()

    if (!App.antispam_nicknames[nick]) {
      App.antispam_nicknames[nick] = {
        level: 0,
        banned: false,
        banned_until: 0
      }
    }

    let user = App.antispam_nicknames[nick]
    user.level += amount

    if (user.level >= App.antispam_max_limit) {
      App.antispam_ban(nick)
      return true
    }

    return false
  }

  // Ban a user from connecting
  App.antispam_ban = function (nickname, minutes = App.antispam_ban_duration) {
    let nick = nickname.toLowerCase()
    let user = App.antispam_nicknames[nick]

    if (!user) {
      return
    }

    user.banned = true
    user.banned_until = Date.now() + (minutes * 1000 * 60)
    console.info(`Nickname banned: ${nickname}`)
  }

  App.check_ban = function (nickname) {
    let nick = nickname.toLowerCase()
    let user = App.antispam_nicknames[nick]

    if (user) {
      return App.antispam_nicknames[nick].banned
    }
    else {
      return false
    }
  }

  App.get_antispam_level = function (nickname) {
    let nick = nickname.toLowerCase()
    let user = App.antispam_nicknames[nick]

    if (user) {
      return App.antispam_nicknames[nick].level
    }
    else {
      return 0
    }
  }
}