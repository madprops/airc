const App = {}

App.fs = require("fs")
App.path = require("path")
App.config = require("./config.json")
App.irc = require("irc")
App.openai = require("openai")
App.last_messages = {}
App.max_rules_length = 250
App.max_user_length = 25
App.config_file = "config.user.json"
App.rate_limit_delay = 3000
App.rate_limit_date = Date.now()

// Get the correct config path
App.get_config_path = function () {
  let p = App.path.dirname(__filename)
  return App.path.join(p, App.config_file)
}

App.update_config = function (key, value) {
  try {
    if (key) {
      App.config[key] = value
    }
    
    let p = App.get_config_path()
    let s = JSON.stringify(App.config, null, 2)
    App.fs.writeFileSync(p, s)
  }
  catch (err) {
    console.error("Error updating the config file")
  }
}

// Create config.user.json
// If it does not exist
if (!App.fs.existsSync(App.get_config_path())) {
  App.update_config()
  console.info("Created user config file")
}

// Assign user config to default config
let s = App.fs.readFileSync(App.get_config_path(), "utf8")
let user_config = JSON.parse(s)
Object.assign(App.config, user_config)

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