const config = require("./config.json")
const irc = require("irc")
const openai = require("openai")
let irc_client, openai_client

function start_irc () {
  irc_client = new irc.Client(config.server, config.nickname, {
    channels: config.channels
  })
  
  irc_client.addListener("message", function (from, to, message) {
    if (from === config.nickname) {
      return
    } 
    
    function respond (from, to, msg) {
      if (config.channels.includes(to)) {
        if (msg.length <= config.max_prompt_length) {
          console.info(from + ' => ' + to + ': ' + msg);
          ask_openai(msg, to)
        }
      }
    }    

    function try_nick () {
      let split = message.split(/[,:]/)
  
      if (split.length < 2) {
        return
      }
  
      let nick = split[0].trim()
      let msg = split.slice(1).join("").trim()

      if (nick.toLowerCase() === config.nickname.toLowerCase()) {
        respond(from, to, msg)
        return true
      }

      return false
    }

    function try_auto_respond () {
      let num = get_random_int(1, 100)

      if (num >= 1 && num <= config.auto_respond_probability) {
        respond(from, to, message)
        return true
      }

      return false
    }

    if (try_nick()) {
      return
    }
    else if (config.auto_respond) {
      try_auto_respond()
    }
  })
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
    console.error("ChatGPT completion error")
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