// These are functions that process a received message
// Input from irc is checked and maybe sent to openai

module.exports = function (App) {
  App.process_message = function (from, to, message) {
    // Rate limit to avoid attacks or mistakes
    if (!App.is_admin(from)) {
      if ((Date.now() - App.rate_limit_date) <= App.rate_limit_delay) {
        return
      }
    }

    App.rate_limit_date = Date.now()

    // Trim and remove multiple spaces
    message = message.trim().replace(/ +/g, " ")

    let prev_message = App.last_messages[to]
    App.last_messages[to] = {from: from, to: to, message: message}

    if (!App.is_allowed("allow_ask", from)) {requestAnimationFrame
      return
    }

    let low_message = message.toLowerCase()

    if (low_message.includes("http://") || low_message.includes("https://")) {
      return
    }

    // This causes all airc instances to respond
    if (message === "!report") {
      App.report_self(to)
      return
    }

    App.check_nick_mention(from, to, message, prev_message)
  }

  App.check_nick_mention = function (from, to, message, prev_message) {
    let re = new RegExp(/^(?<nickname>\w+)[,:](?<message>.*)$/, "")
    let match = message.match(re)

    if (!match) {
      return
    }

    let nick = match.groups.nickname.trim()
    let prompt = match.groups.message.trim()

    if (!nick || !prompt) {
      return
    }

    if (nick.toLowerCase() === App.config.nickname.toLowerCase()) {
      if(prompt === "hi" || prompt === "hello") {
        App.irc_respond(to, "hi!")
        return
      }

      if (prompt.startsWith("^") && prev_message) {
        let context = App.remove_dots(prev_message.message)

        if (context.length <= App.max_context) {
          let words = prompt.replace("^", "").trim()
  
          if (words) {
            context += "\n" + words
          }
  
          App.ask_ai(from, to, context)
          return
        }
      }

      if (App.check_commands(from, to, prompt)) {
        return
      }

      App.ask_ai(from, to, prompt)
    }
  }

  // Prepare prompt and ask openai
  App.ask_ai = function (from, to, prompt) {
    prompt = prompt.trim()

    if (!prompt) {
      return
    }

    // This is to avoid autocompletions from the ai
    if (/\w$/.test(prompt)) {
      prompt += "."
    }

    if (prompt.length > App.config.max_prompt) {
      return
    }

    // Add some personality
    if (App.config.rules) {
      prompt = App.config.rules + "\n" + prompt
    }    

    console.info(from + ' => ' + to + ': ' + prompt)

    App.ask_openai(prompt, function (text) {
      App.irc_respond(to, text)
    })
  }

  App.report_self = function (to) {
    let ts = App.timeago(App.date_started)
    App.irc_respond(to, `I'm here! I was launched ${ts}.`)
    return
  }
}