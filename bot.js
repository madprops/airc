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
  
  function respond (from, to, msg) {
    if (config.channels.includes(to)) {
      if (msg.length <= config.max_prompt_length) {
        console.info(from + ' => ' + to + ': ' + msg);
        ask_openai(msg, to)
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
    let msg = match.groups.message.trim()

    if (!nick || !msg) {
      return false
    }

    if (nick.toLowerCase() === config.nickname.toLowerCase()) {
      respond(from, to, msg)
      return true
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
      let msg = `You: "${prev_message.message}" Me: "${message}"`
      respond(from, to, msg)
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

async function main () {
  await start_openai()
  start_irc()
}

main()