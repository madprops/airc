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
      console.log(err)
      console.error("Error updating the config file")
    }
  } 
  
  App.get_config_path = function () {
    let p = App.path.resolve(App.path.dirname(__filename), "../")
    return App.path.join(p, "config.json")
  }
}