const App = {}

App.fs = require("fs")
App.path = require("path")
App.config = require("./config.json")
App.irc = require("irc")
App.openai = require("openai")
App.last_messages = {}
App.max_instructions_length = 250
App.max_admin_length = 25

App.get_config_path = function (forced = "") {
  let s = forced

  if (s === "") {
    s = App.using_user_config ? "config.user.json" : "config.json"
  }
  
  let p = App.path.dirname(__filename)
  return App.path.join(p, s)
}

let uc_path = App.get_config_path("config.user.json")

// This allows the user to override all settings in a user config file
// This is if the user wants to `git pull` without conflicts
// Since config.user.json is not tracked by git
// The file must be created by the user
if (App.fs.existsSync(uc_path)) {
  let s = App.fs.readFileSync(uc_path, "utf8")
  let user_config = JSON.parse(s)
  Object.assign(App.config, user_config)
  console.info("Using config.user.json")
  App.using_user_config = true 
} 
else {
  App.using_user_config = false 
}

require("./modules/irc.js")(App)
require("./modules/openai.js")(App)
require("./modules/proc.js")(App)
require("./modules/utils.js")(App)

App.main = function () {
  App.start_openai()
  App.start_irc()
}

App.main()