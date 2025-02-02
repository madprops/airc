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

import * as i_fs from 'fs'
import * as i_path from 'path'
import * as i_process from 'process'
import * as i_axios from 'axios'
import * as i_irc from 'matrix-org-irc'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'
import {getLlama} from "node-llama-cpp"

App.i.fs = i_fs
App.i.path = i_path
App.i.process = i_process
App.i.axios = i_axios
App.i.irc = i_irc
App.i.openai = OpenAI
App.i.get_llama = getLlama

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = i_path.dirname(__filename)

App.context = {}
App.max_username_length = 25
App.last_autorespond = 0
App.config_keep = [`server`, `channels`, `port`, `nickname`, `admins`]
App.enabled = true
App.talk_count = 0
App.talked = false
App.talk_date = 0
App.talk_date_max = 1000 * 10
App.ask_charge = 0
App.max_ask_charge = 10
App.openai_started = false
App.google_started = false
App.working = false
App.debug = false

// Load all JS source files

let srcpath = App.i.path.join(__dirname, `src`)
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
  const module = await import(path)
  module.default(App)
}

// ---------

App.log(`Starting: ${App.name}`)
App.setup_config()
App.setup_commands()
App.start_antispam()
App.start_openai()
App.start_google()
App.start_irc()

App.date_started = App.now()