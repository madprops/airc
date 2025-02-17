export default (App) => {
  App.start_antispam = () => {
    App.antispam_users = {}
    App.antispam_timeout()
    App.ask_charge_timeout()
    App.log(`Started anti-spam`)
  }

  App.antispam_timeout = () => {
    setTimeout(() => {
      App.antispam_timeout_action()
    }, 1500)
  }

  App.get_antispam_user = (nickname, create = false) => {
    let nick = nickname.toLowerCase()
    let user = App.antispam_users[nick]

    if (!user && create) {
      user = App.antispam_create_user(nick)
    }

    return user
  }

  App.antispam_create_user = (nickname) => {
    let nick = nickname.toLowerCase()

    App.antispam_users[nick] = {
      level: 0,
      banned: false,
      banned_until: 0,
    }

    return App.antispam_users[nick]
  }

  App.delete_antispam_user = (nickname) => {
    let nick = nickname.toLowerCase()
    delete App.antispam_users[nick]
  }

  App.antispam_timeout_action = () => {
    for (let nickname in App.antispam_users) {
      let user = App.get_antispam_user(nickname, true)

      if (user.banned) {
        if (App.now() > user.banned_until) {
          App.antispam_unban(nickname)
        }
      }
      else if (user.level > 0) {
        user.level -= 1
      }
      else {
        App.delete_antispam_user(nickname)
      }
    }

    App.antispam_timeout()
  }

  App.add_spam = (nickname, amount = 1) => {
    let user = App.get_antispam_user(nickname, true)
    user.level += amount
    let limit = App.config.spam_limit

    if (App.nick() === nickname) {
      limit = limit * 2
    }

    if (user.level >= limit) {
      App.antispam_ban(nickname)
      return true
    }

    return false
  }

  App.antispam_ban = (nickname) => {
    let user = App.get_antispam_user(nickname, true)
    let mins = App.config.spam_minutes * 1000 * 60
    user.banned = true
    user.banned_until = App.now() + mins
    App.log(`Banned: ${nickname}`)
  }

  App.antispam_unban = (nickname) => {
    let user = App.get_antispam_user(nickname)

    if (!user) {
      return
    }

    user.banned = false
    user.banned_until = 0
    user.level = 0

    App.log(`Unbanned: ${nickname}`)
  }

  App.check_ban = (nickname) => {
    let user = App.get_antispam_user(nickname)

    if (user) {
      return user.banned
    }

    return false
  }

  App.get_spam_level = (nickname) => {
    let user = App.get_antispam_user(nickname)

    if (user) {
      return user.level
    }

    return 0
  }

  App.ask_charge_timeout = () => {
    setTimeout(() => {
      App.ask_charge_timeout_action()
    }, 2000)
  }

  App.ask_charge_timeout_action = () => {
    App.ask_charge -= 1

    if (App.ask_charge < 0) {
      App.ask_charge = 0
    }

    App.ask_charge_timeout()
  }
}