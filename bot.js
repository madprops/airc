const App = {}

// Imports go here
App.i = {}

App.i.fs = require(`fs`)
App.i.path = require(`path`)
App.i.process = require(`process`)
App.i.sentencer = require(`sentencer`)

// A fork of node-irc that fixes a bunch of stuff
App.i.irc = require(`matrix-org-irc`)

// Official openai library
App.i.openai = require(`openai`)

App.context = {}
App.max_user_length = 25

// Make bots autorespond at most once an hour
App.autorespond_cooldown = 1000 * 60 * 60
App.last_autorespond = 0

// Need to prepare config first
require(`./modules/config.js`)(App)
App.prepare_config()

// Load js modules
require(`./modules/utils.js`)(App)
require(`./modules/irc.js`)(App)
require(`./modules/openai.js`)(App)
require(`./modules/proc.js`)(App)
require(`./modules/commands.js`)(App)
require(`./modules/spam.js`)(App)

App.start_antispam()
App.start_openai()
App.start_irc()
App.date_started = Date.now()