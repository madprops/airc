  module.exports = (App) => {
  App.start_antispam = () => {
    App.antispam_users = {}
    App.antispam_timeout()
    console.info(`Started antispam`)
  }

  App.antispam_timeout = () => {
    setTimeout(() => {
      App.antispam_timeout_action()
    }, 1200)
  }

  App.antispam_timeout_action = () => {
    for (let nick in App.antispam_users) {
      let user = App.antispam_users[nick]

      if (user.banned) {
        if (Date.now() > user.banned_until) {
          App.antispam_unban(nick)
        }
      } else {
        if (user.level > 0) {
          user.level -= 1
        }
        else {
          delete App.antispam_users[nick]
        }
      }
    }

    App.antispam_timeout()
  }

  App.antispam_create_user = (nickname) => {
    let nick = nickname.toLowerCase()

    App.antispam_users[nick] = {
      level: 0,
      banned: false,
      banned_until: 0
    }    
  }

  App.add_spam = (nickname, amount = 1) => {
    let nick = nickname.toLowerCase()

    if (!App.antispam_users[nick]) {
      App.antispam_create_user(nick)
    }

    let user = App.antispam_users[nick]
    user.level += amount

    if (user.level >= App.config.antispam_limit) {
      App.antispam_ban(nick)
      return true
    }

    return false
  }

  App.antispam_ban = (nickname) => {
    let nick = nickname.toLowerCase()
    
    if (!App.antispam_users[nick]) {
      App.antispam_create_user(nick)
    }
    
    let user = App.antispam_users[nick]
    let mins = App.config.antispam_minutes * 1000 * 60
    user.banned = true
    user.banned_until = Date.now() + mins
    console.info(`Banned: ${nickname}`)
  }

  App.antispam_unban = (nickname) => {
    let nick = nickname.toLowerCase()
    let user = App.antispam_users[nick]

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
    let user = App.antispam_users[nick]

    if (user) {
      return App.antispam_users[nick].banned
    }
    
    return false
  }

  App.get_antispam_level = (nickname) => {
    let nick = nickname.toLowerCase()
    let user = App.antispam_users[nick]

    if (user) {
      return App.antispam_users[nick].level
    }

    return 0
  }
}