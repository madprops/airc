const App = {}

App.fs = require("fs")
App.config = require("./config.json")
App.irc = require("irc")
App.openai = require("openai")

App.last_messages = {}

require("./irc.js")(App)
require("./openai.js")(App)
require("./proc.js")(App)
require("./utils.js")(App)

App.main = async function () {
  await App.start_openai()
  App.start_irc()
}

App.main()