module.exports = function (App) {
  App.get_random_int = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  App.is_user = function (nickname) {
    let nick = nickname.toLowerCase()
    return App.config.users.map(x => x.toLowerCase()).some(x => x === nick)
  }  

  App.is_admin = function (nickname) {
    let nick = nickname.toLowerCase()
    return App.config.admins.map(x => x.toLowerCase()).some(x => x === nick)
  }

  App.bold_text = function (text) {
    return `\x02${text}\x0F`
  }

  App.is_allowed = function (key, nickname) {
    if (App.config[key] === "users") {
      if (!App.is_op(nickname) && !App.is_admin(nickname)) {
        return false
      }
    }
    else if (App.config[key] === "admins") {
      if (!App.is_admin(nickname)) {
        return false
      }
    }

    return true
  }
}