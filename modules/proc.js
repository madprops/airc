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
    message = App.remove_multiple_spaces(message)
    let last_response = App.last_responses[to]

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

    App.check_nick_mention(from, to, message, last_response)
  }

  App.check_nick_mention = function (from, to, message, last_response) {
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

      // Check if context is used
      if (prompt.startsWith("^") && last_response) {
        let words = prompt.replace("^", "").slice(0, App.max_prompt)
        App.ask_ai(from, to, words, last_response)
        return
      }

      if (App.check_commands(from, to, prompt)) {
        return
      }

      App.ask_ai(from, to, prompt)
    }
  }

  // Prepare prompt and ask openai
  App.ask_ai = function (from, to, prompt = "", context = "") {
    prompt = App.limit(prompt, App.config.max_prompt)

    // This is to avoid autocompletions from the ai
    if (prompt && /\w$/.test(prompt)) {
      // Add either a ? or a .
      // ? if it's a question
      let low_prompt = prompt.toLowerCase()
      let questions = ["where", "which", "what", "where", "when", "what if"]

      if (questions.some(x => low_prompt.startsWith(x + " "))) {
        prompt += "?"
      }
      else {
        prompt += "."
      }
    }

    if (context) {
      context = App.limit(context, App.config.max_context)

      if (prompt) {
        prompt = context + "\n" + prompt
      }
      else {
        prompt = context
      }
    }

    if (!prompt) {
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