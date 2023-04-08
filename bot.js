const App = {}

// Imports go here
App.i = {}

App.i.fs = require("fs")
App.i.path = require("path")
App.i.process = require("process")
App.i.irc = require("irc")
App.i.openai = require("openai")

App.last_responses = {}
App.max_user_length = 25
App.rate_limit_delay = 2000
App.rate_limit_date = Date.now()

App.get_user_config = function () {
  let json_text = App.i.fs.readFileSync(App.get_config_path(), "utf8")
  let obj = JSON.parse(json_text)
  return obj
}

// Get the correct config path
App.get_config_path = function () {
  let p = App.i.path.dirname(__filename)
  return App.i.path.join(p, "config.user.json")
}

App.update_config = function (key, value) {
  try {
    key = key.toLowerCase()
    let user_config = App.get_user_config()

    if (value === "default") {
      delete user_config[key]
      App.config[key] = structuredClone(App.original_config[key])
    }
    else {
      user_config[key] = value
      App.config[key] = value
    }

    let json_text = JSON.stringify(user_config, null, 2)
    App.i.fs.writeFileSync(App.get_config_path(), json_text)
  }
  catch (err) {
    console.error("Error updating the config file")
  }
}

// Create config.user.json
// If it does not exist
if (!App.i.fs.existsSync(App.get_config_path())) {
  App.i.fs.writeFileSync(App.get_config_path(), "{}")
  console.info("Created user config file")
}

// Main config object
// It can change through commands
App.config = require("./config.json")

// Save a fixed copy of the config for defaults
App.original_config = structuredClone(App.config)

// Assign user config to default config
Object.assign(App.config, App.get_user_config())

// Load js modules
require("./modules/irc.js")(App)
require("./modules/openai.js")(App)
require("./modules/proc.js")(App)
require("./modules/commands.js")(App)
require("./modules/utils.js")(App)

// Check if model is still supported
if (!App.get_model()) {
  App.update_config("model", "default")
}

App.start_openai()
App.start_irc()
App.date_started = Date.now()