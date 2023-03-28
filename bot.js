const App = {}

App.fs = require("fs")
App.path = require("path")
App.config = require("./config.json")
App.irc = require("irc")
App.openai = require("openai")
App.last_messages = {}
App.max_instructions_length = 250

require("./modules/irc.js")(App)
require("./modules/openai.js")(App)
require("./modules/proc.js")(App)
require("./modules/utils.js")(App)

App.main = async function () {
  await App.start_openai()
  App.start_irc()
}

App.main()