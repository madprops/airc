module.exports = function (App) {
  App.get_random_int = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  App.is_operator = function (nickname) {
    return App.is_owner(nickname) || App.is_admin(nickname)
  }

  App.is_owner = function (nickname) {
    let nick = nickname.toLowerCase()
    return App.config.owners.map(x => x.toLowerCase()).some(x => x === nick)
  }

  App.is_admin = function (nickname) {
    let nick = nickname.toLowerCase()
    return App.config.admins.map(x => x.toLowerCase()).some(x => x === nick)
  }

  App.bold_text = function (text) {
    return `\x02${text}\x0F`
  }

  App.is_allowed = function (key, nickname) {
    if (App.config[key] === "admins") {
      if (!App.is_operator(nickname)) {
        return false
      }
    }
    else if (App.config[key] === "owners") {
      if (!App.is_owner(nickname)) {
        return false
      }
    }

    return true
  }
}