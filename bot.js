const App = {}

App.fs = require("fs")
App.path = require("path")
App.process = require("process")
App.config = require("./config.json")
App.irc = require("irc")
App.openai = require("openai")
App.last_responses = {}
App.max_user_length = 25
App.config_file = "config.user.json"
App.rate_limit_delay = 2000
App.rate_limit_date = Date.now()

App.get_user_config = function () {
  let s = App.fs.readFileSync(App.get_config_path(), "utf8")
  let obj = JSON.parse(s)
  return obj
}

// Get the correct config path
App.get_config_path = function () {
  let p = App.path.dirname(__filename)
  return App.path.join(p, App.config_file)
}

App.update_config = function (key, value) {
  try {
    key = key.toLowerCase()
    let user_config = App.get_user_config()

    if (value === "default") {
      delete user_config[key]
      App.config[key] = App.original_config[key]
    }
    else {
      user_config[key] = value
      App.config[key] = value
    }

    let s = JSON.stringify(user_config, null, 2)
    App.fs.writeFileSync(App.get_config_path(), s)
  }
  catch (err) {
    console.error("Error updating the config file")
  }
}

// Create config.user.json
// If it does not exist
if (!App.fs.existsSync(App.get_config_path())) {
  App.fs.writeFileSync(App.get_config_path(), "{}")
  console.info("Created user config file")
}

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

App.main = function () {
  App.start_openai()
  App.start_irc()
  App.date_started = Date.now()
}

App.main()