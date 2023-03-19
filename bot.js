const config = require("./config.json")
const irc = require("irc")
const openai = require("openai")
let irc_client, chatgpt

function start_irc () {
  irc_client = new irc.Client(config.server, config.nickname, {
    channels: config.channels
  })
  
  irc_client.addListener("message", function (from, to, message) {
    let split = message.split(/[,:]/)

    if (split.length < 2) {
      return
    }

    let nick = split[0].trim()
    let msg = split.slice(1).join("").trim()

    if (nick.toLowerCase() === config.nickname.toLowerCase()) {
      if (config.channels.includes(to)) {

        if (msg.length <= config.max_prompt_length) {
          console.log(from + ' => ' + to + ': ' + msg);
          ask_chatgpt(msg, to)
        }
      }
    }
  })
}

async function start_chatgpt () {
  let configuration = new openai.Configuration({
    apiKey: process.env.OPENAI_API_KEY
  })

  chatgpt = new openai.OpenAIApi(configuration)
}

async function ask_chatgpt (prompt, to) {
  try {
    let ans = await chatgpt.createCompletion({
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
    console.error(err)
    console.error("ChatGPT completion error")
  }
}

async function main () {
  await start_chatgpt()
  start_irc()
}

main()