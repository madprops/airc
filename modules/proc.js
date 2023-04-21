// These are functions that process a received message
// Input from irc is checked and maybe sent to openai

module.exports = (App) => {
  App.process_message = (from, channel, text) => {
    // Ignore if user is banned
    if (App.check_ban(from)) {
      return
    }

    let can_ask = App.is_allowed(`ask`, from)
    let can_rules = App.is_allowed(`rules`, from)

    // User can't do anything
    if (!can_ask && !can_rules) {
      return
    }

    text = App.clean(text)
    let low = text.toLowerCase()

    if (low.includes(`http://`) || low.includes(`https://`)) {
      return
    }

    if (App.is_admin(from)) {
      if (text === `!report`) {
        App.report_self(channel)
        return
      }

      if (text === `!config`) {
        App.show_config(channel)
        return
      }
    }

    App.check_nick_mention(from, channel, text)
  }

  App.check_nick_mention = (from, channel, text) => {
    let re = new RegExp(/^(?<nickname>\w+)[,:](?<text>.*)$/, ``)
    let match = text.match(re)

    if (!match) {
      return
    }

    let nick = match.groups.nickname.trim()
    let prompt = match.groups.text.trim()

    if (!nick || !prompt) {
      return
    }

    if (nick.toLowerCase() === App.nick().toLowerCase()) {
      // Add one spam point
      if (App.add_spam(from)) {
        let mins = App.plural(App.config.spam_minutes, `minute`, `minutes`)
        App.irc_respond(channel, `${from} was banned for ${mins}.`)
        return
      }

      if(prompt === `hi` || prompt === `hello`) {
        App.irc_respond(channel, `hi!`)
        return
      }

      // Check if context is used
      let last_response = App.last_responses[channel]

      if (last_response && prompt.startsWith(App.config.context_char)) {
        let words = prompt.replace(App.config.context_char, ``)
        App.ask_ai(from, channel, words, last_response)
        return
      }

      if (prompt.startsWith(App.config.command_char)) {
        let cmd = prompt.replace(App.config.command_char, ``)
        App.check_commands(from, channel, cmd)
        return
      }

      App.ask_ai(from, channel, prompt)
    }
  }

  // Prepare prompt and ask openai
  App.ask_ai = (from, channel, prompt = ``, context = ``) => {
    let mention
    let mention_char = App.escape_regex(App.config.mention_char)
    let mention_regex = new RegExp(`${mention_char}\\s*(\\w+)$`)

    // Check for @nick at the end to direct the response at
    prompt = prompt.replace(mention_regex, (match, group) => {
      mention = group
      return ``
    })

    prompt = App.limit(prompt, App.config.max_prompt)
    prompt = App.terminate(prompt)

    if (context) {
      context = App.limit(context, App.config.max_context)
      context = App.terminate(context)

      if (prompt) {
        prompt = `${context}\n${prompt}`
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
      prompt = `${rules}\n${prompt}`
    }

    console.info(`${from} => ${channel}: ${prompt}`)

    App.ask_openai(prompt, (text) => {
      text = App.clean(text)
      text = App.unquote(text)

      if (App.config.compact) {
        text = App.join(text.split(`\n`).map(x => x.trim()))
      }

      if (mention) {
        text = `${mention}: ${text}`
      }

      App.irc_respond(channel, text)
      App.last_responses[channel] = text
    })
  }

  App.report_self = (channel) => {
    let timeago = App.timeago(App.date_started)
    let memory = App.get_memory_used()
    App.irc_respond(channel, `🚀 Launched ${timeago} | Memory: ${memory} MB`)
    return
  }

  App.show_config = (channel) => {
    let info = []

    for (let key of [
      `model`,
      `rules`,
      `allow_ask`,
      `allow_rules`,
      `users`,
      `admins`,
    ]) {
      info.push(App.cmd_info(key))
    }

    App.irc_respond(channel, App.join(info, `|`))
  }
}