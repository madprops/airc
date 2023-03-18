const irc = require("irc")
const openai = require("openai")
const nickname = "ChatGPT"
const channels = ["#defmod"]
const max_prompt_length = 200

let irc_client, chatgpt

function start_irc () {
  irc_client = new irc.Client("irc.libera.chat", nickname, {
    channels: channels
  })
  
  irc_client.addListener("message", function (from, to, message) {
    if (message.startsWith(nickname + ",")) {
      if (channels.includes(to)) {
        let msg = message.split(",").slice(1).join("").trim()

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
  let completion = await chatgpt.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: 190
  })

  let ans = completion.data.choices[0].text
  irc_client.say(to, ans)
}

async function main () {
  await start_chatgpt()
  start_irc()
}

main()