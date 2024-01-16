module.exports = (App) => {
  App.prepare_config = () => {
    if (!App.i.fs.existsSync(App.get_user_config_path())) {
      App.log(`No config file found.`, `error`)
      process.exit()
    }

    // Main config object
    // It can change through commands
    App.config = App.get_config()

    // Save a fixed copy of the config for defaults
    App.original_config = structuredClone(App.config)

    // User overrides
    let user_config = App.get_user_config()
    let modified = false

    // Remove unused properties
    for (let key in user_config) {
      if (!(key in App.config)) {
        delete user_config[key]
        modified = true
      }
    }

    if (modified) {
      App.save_user_config(user_config)
    }

    // Assign user config to default config
    Object.assign(App.config, user_config)
  }

  App.get_config = () => {
    let json_text = App.i.fs.readFileSync(App.get_config_path(), `utf8`)
    let obj = JSON.parse(json_text)
    return obj
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
    return App.i.path.join(p, `../configs/${App.name}.json`)
  }

  App.save_user_config = (obj) => {
    let text = JSON.stringify(obj, null, 2)
    App.i.fs.writeFileSync(App.get_user_config_path(), text)
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

      App.save_user_config(user_config)
    }
    catch (err) {
      App.log(err, `error`)
    }
  }

  // Remove all overriden configs except some
  App.reset_config = () => {
    let user_config = App.get_user_config()
    for (let key in user_config) {
      if (App.config_keep.includes(key)) {
        continue
      }

      App.update_config(key, `reset`)
    }
  }
}