const irc = require("irc")
const openai = require("openai")
const nickname = "Carlos"
const channels = ["#defmod"]
const model = "text-davinci-003"
const max_prompt_length = 200

let irc_client, chatgpt

function start_irc () {
  irc_client = new irc.Client("irc.libera.chat", nickname, {
    channels: channels
  })
  
  irc_client.addListener("message", function (from, to, message) {
    let split = message.split(",")

    if (split.length < 2) {
      return
    }
    
    let nick = split[0].trim()
    let msg = split.slice(1).join("").trim()

    if (message.toLowerCase().startsWith(nick.toLowerCase() + ",")) {
      if (channels.includes(to)) {

        if (msg.length <= max_prompt_length) {
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
    let completion = await chatgpt.createCompletion({
      model: model,
      prompt: prompt,
      max_tokens: 190
    })
  
    let ans = completion.data.choices[0].text

    if (ans) {
      irc_client.say(to, ans)
    }
  }
  catch {
    console.error("chatgpt completion error")
  }
}

async function main () {
  await start_chatgpt()
  start_irc()
}

main()