const App = {}

if (process.argv.length < 3) {
  // eslint-disable-next-line no-console
  console.log(`Provide the name of the config to use.`)
  process.exit(1)
}

// The id/name of the bot instance
App.name = process.argv[2]

// Imports go here
App.i = {}

import {fileURLToPath} from 'url'

let imports = async () => {
  let mod

  mod = await import(`fs`)
  App.i.fs = mod.default

  mod = await import(`path`)
  App.i.path = mod.default

  mod = await import(`process`)
  App.i.process = mod.default

  mod = await import(`axios`)
  App.i.axios = mod.default

  mod = await import(`matrix-org-irc`)
  App.i.irc = mod.default

  mod = await import(`cookie`)
  App.i.cookie = mod.default

  mod = await import(`http`)
  App.i.http = mod.default

  mod = await import(`openai`)
  App.i.openai = mod.OpenAI

  try {
    let mod = await import(`node-llama-cpp`)
    App.i.get_llama = mod.getLlama
    App.i.LlamaChatSession = mod.LlamaChatSession
  }
  catch (err) {
    // eslint-disable-next-line no-console
    console.log(err)
  }
}

await imports()

// Create __dirname equivalent for ES modules
let __filename = fileURLToPath(import.meta.url)
App.dirname = App.i.path.dirname(__filename)

App.context = {}
App.max_username_length = 25
App.last_autorespond = 0
App.config_keep = [`server`, `channels`, `port`, `nickname`, `admins`, `users`, `avatar`]
App.enabled = true
App.talk_count = 0
App.talked = false
App.talk_nick = ``
App.talk_date = 0
App.talk_date_max = 1000 * 60
App.talk_channel = ``
App.talk_prompt = ``
App.ask_charge = 0
App.max_ask_charge = 10
App.openai_started = false
App.google_started = false
App.working = false
App.debug = false
App.marker_1 = `\u2060`
App.marker_2 = `\u200D`
App.talk_signature = App.marker_1 + App.marker_2
App.think_messages = []
App.long_message_count = 0
App.thinking = false
App.last_irc_message = {}

App.prompt_ideas = [
  `Make a random comment about something you like`,
  `Ask me an interesting question`,
  `You just had a big realization`,
]

// Load all JS source files

let srcpath = App.i.path.join(App.dirname, `src`)
let src_files

try {
  src_files = App.i.fs.readdirSync(srcpath)
}
catch (err) {
  process.exit(1)
}

let js_files = src_files.filter(f => f.endsWith(`.js`))

// Use dynamic imports for loading source files
for (let file of js_files) {
  let path = App.i.path.join(srcpath, file)
  let module = await import(path)
  module.default(App)
}

// ---------

App.log(`Starting: ${App.name}`)
App.setup_config()
App.setup_regex()
App.setup_commands()
App.start_antispam()
App.start_openai()
App.start_google()
App.start_irc()

App.date_started = App.now()