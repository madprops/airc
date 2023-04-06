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

    if (!App.is_allowed("allow_ask", from)) {requestAnimationFrame
      return
    }

    let low_message = message.toLowerCase()

    if (low_message.includes("http://") || low_message.includes("https://")) {
      return
    }

    if (App.is_admin(from)) {
      if (message === "!report") {
        App.report_self(to)
        return
      }
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

      // Check if context is used
      let last_response = App.last_responses[to]

      if (last_response && prompt.startsWith("^")) {
        let words = prompt.replace("^", "")
        App.ask_ai(from, to, words, last_response)
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
  App.ask_ai = function (from, to, prompt = "", context = "") {
    prompt = App.limit(prompt, App.config.max_prompt)
    prompt = App.terminate(prompt)

    if (context) {
      context = App.limit(context, App.config.max_context)
      context = App.terminate(context)

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
    let rules = App.config.rules

    if (rules) {
      rules = App.limit(rules, App.config.max_rules)
      rules = App.terminate(rules)
      prompt = rules + "\n" + prompt
    }

    console.info(from + ' => ' + to + ': ' + prompt)

    App.ask_openai(prompt, function (text) {
      App.last_responses[to] = text
      App.irc_respond(to, text)
    })
  }

  App.report_self = function (to) {
    let ts = App.timeago(App.date_started)
    let ms = App.get_memory_used()
    App.irc_respond(to, `🚀 Launched ${ts} | Memory: ${ms} MB`)
    return
  }
}