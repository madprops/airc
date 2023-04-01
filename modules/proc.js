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

    App.check_nick_mention(from, to, message)
  }

  App.check_nick_mention = function (from, to, message) {
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

      if (prompt.endsWith("?")) {
        App.ask_ai(from, to, prompt)
        return
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

    App.ask_openai(App.config.rules, App.context[to], prompt, function (text) {
      App.irc_respond(to, text)
      App.add_context(to, text)
    })
  }

  App.report_self = function (to) {
    let ts = App.timeago(App.date_started)
    App.irc_respond(to, `I'm here! I was launched ${ts}.`)
    return
  }

  App.add_context = function (to, text) {
    if (App.context[to] === undefined) {
      App.context[to] = []
    }

    App.context[to].push(text)

    if (App.context[to].length > App.max_context) {
      App.context[to].shift()
    }
  }

  App.reset_context = function (to) {
    App.context[to] = []
  }
}