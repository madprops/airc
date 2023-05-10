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
      App.autorespond(channel)
      return
    }

    let nick = match.groups.nickname.trim()
    let prompt = match.groups.text.trim()
    let mentioned = false

    if (!prompt) {
      return
    }

    if (nick) {
      mentioned = nick.toLowerCase() === App.nick().toLowerCase()
    }

    if (mentioned) {
      // Add one spam point
      if (App.add_spam(from)) {
        let mins = App.plural(App.config.spam_minutes, `minute`, `minutes`)
        App.irc_respond(channel, `${from} was banned for ${mins}.`)
        return
      }

      // Check if it's a command
      if (prompt.startsWith(App.config.command_char)) {
        let cmd = prompt.replace(App.config.command_char, ``)
        App.check_commands(from, channel, cmd)
        return
      }

      App.ask_ai(from, channel, prompt)
    }
  }

  // Prepare prompt and ask openai
  App.ask_ai = (from, channel, prompt = ``) => {
    let mention
    let mention_char = App.escape_regex(App.config.mention_char)
    let mention_regex = new RegExp(`${mention_char}\\s*(\\w+)$`)
    let use_context = prompt.startsWith(App.config.context_char)

    if (use_context) {
      prompt = prompt.replace(App.config.context_char, ``)
    }

    prompt = prompt.replace(mention_regex, (match, group) => {
      mention = group
      return ``
    })

    prompt = App.terminate(App.limit(prompt, App.config.max_prompt))

    // Prompt plus optional context and rules
    let full_prompt = prompt

    if (use_context) {
      // Add previous response
      let res = App.context[channel]
      let res_user = App.terminate(App.limit(res.user, App.config.max_context))
      let res_ai = App.terminate(App.limit(res.ai, App.config.max_context))
      full_prompt = `${res_user}\n${res_ai}\n${full_prompt}`.trim()
    }

    if (!full_prompt) {
      return
    }

    // Add some personality
    let rules = App.config.rules

    if (rules) {
      rules = App.terminate(App.limit(rules, App.config.max_rules))
      full_prompt = `${rules}\n${full_prompt}`
    }

    console.info(`${from} => ${channel}: ${full_prompt}`)

    App.ask_openai(full_prompt, (response) => {
      response = App.clean(response)
      response = App.unquote(response)
      let full_response = response

      if (App.config.compact) {
        full_response = App.join(response.split(`\n`).map(x => x.trim()))
      }


      if (mention) {
        full_response = `${mention}: ${full_response}`
      }

      let res

      if (App.config.show_avatar) {
        res = `${App.config.avatar} ${full_response}`
      }
      else {
        res = full_response
      }

      App.irc_respond(channel, res)
      App.context[channel] = {user: prompt, ai: response}
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
      `avatar`,
      `rules`,
      `autorespond`,
      `model`,
      `allow_ask`,
      `allow_rules`,
      `users`,
      `admins`,
    ]) {
      info.push(App.cmd_info(key))
    }

    App.irc_respond(channel, App.join(info, `|`))
  }

  App.autorespond = (channel) => {
    if (App.config.autorespond <= 0) {
      return
    }

    if ((Date.now() - App.last_autorespond) <= App.autorespond_cooldown) {
      return
    }

    let num = App.get_random_int(1, 100)

    if (num <= App.config.autorespond) {
      let prompt
      let n = App.get_random_int(1, 2)

      if (n === 1) {
        prompt = `How are you feeling right now?`
      }
      else if (n === 2) {
        prompt = `What are you doing right now?`
      }

      App.last_autorespond = Date.now()
      App.ask_ai(`$autorespond`, channel, prompt)
    }
  }
}