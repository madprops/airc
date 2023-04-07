// These are functions that process a received message
// Input from irc is checked and maybe sent to openai

module.exports = function (App) {
  App.process_message = function (from, channel, message) {
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
        App.report_self(channel)
        return
      }
    }

    App.check_nick_mention(from, channel, message)
  }

  App.check_nick_mention = function (from, channel, message) {
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
        App.irc_respond(channel, "hi!")
        return
      }

      // Check if context is used
      let last_response = App.last_responses[channel]

      if (last_response && prompt.startsWith("^")) {
        let words = prompt.replace("^", "")
        App.ask_ai(from, channel, words, last_response)
        return
      }

      if (prompt.endsWith("?")) {
        App.ask_ai(from, channel, prompt)
        return
      }

      if (App.check_commands(from, channel, prompt)) {
        return
      }

      App.ask_ai(from, channel, prompt)
    }
  }

  // Prepare prompt and ask openai
  App.ask_ai = function (from, channel, prompt = "", context = "") {
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

    console.info(from + ' => ' + channel + ': ' + prompt)

    App.ask_openai(prompt, function (text) {
      App.irc_respond(channel, text)
      App.last_responses[channel] = text
    })
  }

  App.report_self = function (channel) {
    let timeago = App.timeago(App.date_started)
    let memory = App.get_memory_used()
    App.irc_respond(channel, `🚀 Launched ${timeago} | Memory: ${memory} MB`)
    return
  }

  App.change_rules = function (channel, rules) {
    rules = App.limit(rules, App.config.max_rules)
    App.update_config("rules", rules)
    App.cmd_show(channel, "rules")
  }

  App.respond_as = function (arg) {
    return "Respond as if you were " + arg
  }

  App.filter_channels = function (ch) {
    App.config.channels = App.config.channels.filter(x => x.split(" ")[0].toLowerCase() !== ch)
  }

  App.join_channel = function (channel, new_channel) {
    // The argument might contain the password
    let split = new_channel.split(" ")
    let ch = split[0].toLowerCase()

    if (!ch.startsWith("#")) {
      return
    }
    
    App.filter_channels(ch)
    App.config.channels.push(new_channel)
    App.update_config("channels", App.config.channels)   
    App.irc_respond(channel, "Joining channel...")
    App.irc_join(new_channel)
  }

  App.leave_channel = function (channel, old_channel) {
    let ch = old_channel.toLowerCase()

    if (!ch.startsWith("#")) {
      returnar
    }

    App.filter_channels(ch)
    App.update_config("channels", App.config.channels)
    App.irc_respond(channel, "Leaving channel...")
    App.irc_leave(old_channel)
  }  
}