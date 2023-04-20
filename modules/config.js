module.exports = (App) => {
  App.prepare_config = () => {
    // Create config.user.json if it does not exist
    if (!App.i.fs.existsSync(App.get_user_config_path())) {
      App.i.fs.writeFileSync(App.get_user_config_path(), `{}`)
      console.info(`Created user config file`)
    }

    // Main config object
    // It can change through commands
    App.config = require(App.get_config_path())

    // Save a fixed copy of the config for defaults
    App.original_config = structuredClone(App.config)

    // Assign user config to default config
    Object.assign(App.config, App.get_user_config())
  }

  App.get_user_config = () => {
    let json_text = App.i.fs.readFileSync(App.get_user_config_path(), `utf8`)
    let obj = JSON.parse(json_text)
    return obj
  }

  // Get the correct config path
  App.get_config_path = () => {
    let p = App.i.path.dirname(__filename)
    return App.i.path.join(p, `../config.json`)
  }

  // Get the correct user config path
  App.get_user_config_path = () => {
    let p = App.i.path.dirname(__filename)
    return App.i.path.join(p, `../config.user.json`)
  }

  App.update_config = (key, value) => {
    try {
      key = key.toLowerCase()
      let user_config = App.get_user_config()

      if (value === `reset`) {
        delete user_config[key]
        App.config[key] = structuredClone(App.original_config[key])
      }
      else {
        user_config[key] = value
        App.config[key] = value
      }

      let json_text = JSON.stringify(user_config, null, 2)
      App.i.fs.writeFileSync(App.get_user_config_path(), json_text)
    }
    catch (err) {
      console.error(`Error updating the config file`)
    }
  }

  // Remove all overriden configs except some
  App.reset_config = () => {
    let user_config = App.get_user_config()
    let keep = [`server`, `channels`, `nickname`]

    for (let key in user_config) {
      if (keep.includes(key)) {
        continue
      }

      App.update_config(key, `reset`)
    }
  }
}