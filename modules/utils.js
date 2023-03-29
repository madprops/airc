module.exports = function (App) {
  App.get_random_int = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }
  
  App.update_config = function (key, value) {
    try {
      App.config[key] = value
      let p = App.get_config_path()
      let s = JSON.stringify(App.config, null, 2)
      App.fs.writeFileSync(p, s)
    }
    catch (err) {
      console.error("Error updating the config file")
    }
  } 
  
  App.get_config_path = function () {
    let s = App.using_user_config ? "config.user.json" : "config.json"
    let p = App.path.resolve(App.path.dirname(__filename), "../")
    return App.path.join(p, s)
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
}