const fs = require("fs")
const config = require("./config.json")
const irc = require("irc")
const openai = require("openai")
const last_messages = {}
let irc_client, openai_client

function start_irc () {
  irc_client = new irc.Client(config.server, config.nickname, {
    channels: config.channels
  })
  
  irc_client.addListener("message", function (from, to, message) {
    on_irc_message(from, to, message)
  })

  irc_client.addListener("selfMessage", function (to, message) {
    last_messages[to] = {from: config.nickname, to: to, message: message}
  })  
}

function on_irc_message (from, to, message) {
  if (from === config.nickname) {
    return
  } 
    
  let prev_message = last_messages[to]
  last_messages[to] = {from: from, to: to, message: message}
  
  function respond (from, to, prompt) {
    if (config.silent) {
      return
    }

    if (config.channels.includes(to)) {
      if (prompt.length <= config.max_prompt_length) {
        console.info(from + ' => ' + to + ': ' + prompt);
        ask_openai(prompt, to)
      }
    }
  }    

  function try_nick_mention () {
    let re = new RegExp(/^(?<nickname>\w+)[,:](?<message>.*)$/, "")
    let match = message.match(re)

    if (!match) {
      return false
    }

    let nick = match.groups.nickname.trim()
    let prompt = match.groups.message.trim()

    if (!nick || !prompt) {
      return false
    }

    if (nick.toLowerCase() === config.nickname.toLowerCase()) {
      if (prompt.startsWith("!")) {
        if (config.admins.includes(from)) {
          if (prompt.startsWith("!help")) {
            irc_client.say(to, "Commands: !instructions, !set instructions to [x|empty], !silent, !set silent to [true|false]")
          }

          else if (prompt.startsWith("!set instructions to ")) {
            let ins = prompt.replace(/^\!set instructions to /, "").trim()

            if (ins.length <= 250) {
              if (ins === "empty") {
                ins = ""
              }

              update_config("instructions", ins)
              irc_client.say(to, "Instructions have been set to: " + (ins || "empty"))
            }
          }

          else if (prompt.startsWith("!instructions")) {
            irc_client.say(to, "Instructions: " + (config.instructions || "[Empty]"))
          }

          else if (prompt.startsWith("!set silent to ")) {
            let yesno = prompt.replace(/^\!set silent to /, "").trim()
            let bool = yesno === "true"
            update_config("silent", bool)
            irc_client.say(to, "Silent has been set to: " + bool)
          }

          else if (prompt.startsWith("!silent")) {
            irc_client.say(to, "Silent: " + config.silent)
          }

          return true
        }
      }
      else {
        respond(from, to, prompt)
        return true
      }
    }

    return false
  }

  function try_auto_respond () {
    if (config.auto_respond_probability <= 0) {
      return false
    }

    if (!prev_message || (prev_message.from !== config.nickname) || (from === config.nickname)) {
      return false
    }

    let num = get_random_int(1, 100)

    if (num >= 1 && num <= config.auto_respond_probability) {
      let prompt = `You: "${prev_message.message}" Me: "${message}"`
      respond(from, to, prompt)
      return true
    }

    return false
  }

  if (try_nick_mention()) {
    return
  }
  else {
    try_auto_respond()
  }
}

async function start_openai () {
  let configuration = new openai.Configuration({
    apiKey: process.env.OPENAI_API_KEY
  })

  openai_client = new openai.OpenAIApi(configuration)
}

async function ask_openai (prompt, to) {
  prompt = prompt.trim()

  if (prompt.length > config.max_prompt_length) {
    return
  }

  // Remove periods at the end and trim
  let ins = config.instructions.trim().replace(/\.+$/, "").trim()

  if (ins) {
    prompt = ins + ". " + prompt
  }

  try {
    let ans = await openai_client.createCompletion({
      model: config.model,
      prompt: prompt,
      max_tokens: config.max_tokens
    })

    if (ans.status === 200) {
      let text = ans.data.choices[0].text
  
      if (text) {
        irc_client.say(to, text)
      }
    }
  }
  catch (err) {
    console.error("openai completion error")
  }
}

function get_random_int (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function update_config (key, value) {
  try {
    config[key] = value
    let s = JSON.stringify(config, null, 2)
    fs.writeFileSync("config.json", s)
  }
  catch (err) {
    console.error("Error updating the config file")
  }
}

async function main () {
  await start_openai()
  start_irc()
}

main()