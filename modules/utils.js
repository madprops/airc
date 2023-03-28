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
    return App.path.join(process.cwd(), "config.json")
  }
}