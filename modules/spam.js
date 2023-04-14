  module.exports = (App) => {
  App.start_spam = () => {
    App.spam_users = {}
    App.spam_timeout()
    console.info(`Started anti-spam`)
  }

  App.spam_timeout = () => {
    setTimeout(() => {
      App.spam_timeout_action()
    }, 1200)
  }

  App.spam_timeout_action = () => {
    for (let nick in App.spam_users) {
      let user = App.spam_users[nick]

      if (user.banned) {
        if (Date.now() > user.banned_until) {
          App.spam_unban(nick)
        }
      } else {
        if (user.level > 0) {
          user.level -= 1
        }
        else {
          delete App.spam_users[nick]
        }
      }
    }

    App.spam_timeout()
  }

  App.spam_create_user = (nickname) => {
    let nick = nickname.toLowerCase()

    App.spam_users[nick] = {
      level: 0,
      banned: false,
      banned_until: 0
    }
  }

  App.add_spam = (nickname, amount = 1) => {
    let nick = nickname.toLowerCase()

    if (!App.spam_users[nick]) {
      App.spam_create_user(nick)
    }

    let user = App.spam_users[nick]
    user.level += amount

    if (user.level >= App.config.spam_limit) {
      App.spam_ban(nick)
      return true
    }

    return false
  }

  App.spam_ban = (nickname) => {
    let nick = nickname.toLowerCase()

    if (!App.spam_users[nick]) {
      App.spam_create_user(nick)
    }

    let user = App.spam_users[nick]
    let mins = App.config.spam_minutes * 1000 * 60
    user.banned = true
    user.banned_until = Date.now() + mins
    console.info(`Banned: ${nickname}`)
  }

  App.spam_unban = (nickname) => {
    let nick = nickname.toLowerCase()
    let user = App.spam_users[nick]

    if (!user) {
      return
    }

    user.banned = false
    user.banned_until = 0
    user.level = 0

    console.info(`Unbanned: ${nickname}`)
  }

  App.check_ban = (nickname) => {
    let nick = nickname.toLowerCase()
    let user = App.spam_users[nick]

    if (user) {
      return App.spam_users[nick].banned
    }

    return false
  }

  App.get_spam_level = (nickname) => {
    let nick = nickname.toLowerCase()
    let user = App.spam_users[nick]

    if (user) {
      return App.spam_users[nick].level
    }

    return 0
  }
}