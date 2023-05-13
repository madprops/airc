const App = {}

// Start useful functions first
require(`./modules/utils.js`)(App)

if (process.argv.length < 3) {
  App.log(`Provide the name of the config to use.`)
  return
}

// The id/name of the bot instance
// This indicates what config file to use
App.name = process.argv[2]
App.log(`Starting: ${App.name}`)

// Imports go here
App.i = {}

App.i.fs = require(`fs`)
App.i.path = require(`path`)
App.i.process = require(`process`)

// A fork of node-irc that fixes a bunch of stuff
App.i.irc = require(`matrix-org-irc`)

// Official openai library
App.i.openai = require(`openai`)

App.context = {}
App.max_user_length = 25

// Need to prepare config first
require(`./modules/config.js`)(App)
App.prepare_config()

App.last_autorespond = 0

// Load js modules
require(`./modules/irc.js`)(App)
require(`./modules/openai.js`)(App)
require(`./modules/proc.js`)(App)
require(`./modules/commands.js`)(App)
require(`./modules/spam.js`)(App)

App.start_antispam()
App.start_openai()
App.start_irc()
App.date_started = Date.now()