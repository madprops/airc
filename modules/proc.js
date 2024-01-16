// These are functions that process a received message
// Input from irc is checked and maybe sent to openai

module.exports = (App) => {
  App.process_message = (args = {}) => {
    let def_args = {}
    App.def_args(def_args, args)

    // Ignore if the user is banned
    if (App.check_ban(args.from)) {
      return
    }

    let can_ask = App.is_allowed(`ask`, args.from)
    let can_rules = App.is_allowed(`rules`, args.from)

    // User can't do anything
    if (!can_ask && !can_rules) {
      return
    }

    args.message = App.clean(args.message)
    let low = args.message.toLowerCase()

    // Ignore messages with urls
    if (low.includes(`http://`) || low.includes(`https://`) || low.includes(`www.`)) {
      return
    }

    if (App.is_admin(args.from)) {
      if (args.message.startsWith(`!cmd`)) {
        let cmd = args.message.replace(`!cmd `, ``).trim()

        if (cmd) {
          App.check_commands({
            from: args.from,
            channel: args.channel,
            cmd: cmd,
            batch: true,
          })
        }

        return
      }
    }

    App.check_nick_mention({
      from: args.from,
      channel: args.channel,
      message: args.message,
    })
  }

  App.check_nick_mention = (args = {}) => {
    let def_args = {}
    App.def_args(def_args, args)

    let re = new RegExp(/^(?<nickname>\w+)[,:](?<text>.*)$/, ``)
    let match = args.message.match(re)

    if (!match) {
      // Must start with a letter
      if (args.message.match(/^[a-zA-Z]/) ) {
        App.autorespond(args.channel, args.message)
      }

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
      if (App.add_spam(args.from)) {
        let mins = App.plural(App.config.spam_minutes, `minute`, `minutes`)
        App.irc_respond(args.channel, `${args.from} was banned for ${mins}.`)
        return
      }

      // Check if it's a command
      if (prompt.startsWith(App.config.command_char)) {
        let cmd = prompt.replace(App.config.command_char, ``)
        App.check_commands({from: args.from, channel: args.channel, cmd: cmd})
        return
      }

      App.ask_ai({
        from: args.from,
        channel: args.channel,
        prompt: prompt,
      })
    }
  }

  // Prepare prompt and ask openai
  App.ask_ai = (args = {}) => {
    let def_args = {
      max_words: App.config.words,
    }

    App.def_args(def_args, args)

    let mention
    let mention_char = App.escape_regex(App.config.mention_char)
    let mention_regex = new RegExp(`${mention_char}\\s*(\\w+)$`)
    let use_context = args.prompt.startsWith(App.config.context_char)

    if (use_context) {
      args.prompt = args.prompt.replace(App.config.context_char, ``)
    }

    args.prompt = args.prompt.replace(mention_regex, (match, group) => {
      mention = group
      return ``
    })

    args.prompt = App.terminate(App.limit(args.prompt, App.config.max_prompt))

    // Prompt plus optional context and rules
    let full_prompt = args.prompt

    if (use_context) {
      // Add previous response
      let res = App.context[args.channel]
      let res_user = App.terminate(App.limit(res.user, App.config.max_context))
      let res_ai = App.terminate(App.limit(res.ai, App.config.max_context))
      full_prompt = `${res_user}\n${res_ai}\n${full_prompt}`.trim()
    }

    if (!full_prompt) {
      return
    }

    // Limit the words
    if (args.max_words > 0) {
      let ws

      if (args.max_words === 1) {
        ws = `1 word`
      }
      else {
        ws = `${args.max_words} words or less`
      }

      full_prompt = `Respond in ${ws}.\n${full_prompt}`
    }

    // Add some personality
    let rules = App.config.rules

    if (rules) {
      rules = App.terminate(App.limit(rules, App.config.max_rules))
      full_prompt = `${rules}\n${full_prompt}`
    }

    App.log(`${args.from} => ${args.channel}: ${full_prompt}`)

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

      App.irc_respond(args.channel, full_response)
      App.context[args.channel] = {user: args.prompt, ai: response}
    })
  }

  App.autorespond = (channel, text) => {
    if (App.config.autorespond <= 0) {
      return
    }

    let cooldown = 1000 * 60 * App.config.autorespond_cooldown

    if ((Date.now() - App.last_autorespond) <= cooldown) {
      return
    }

    let rand = App.get_random_int(1, 100)

    if (rand <= App.config.autorespond) {
      App.last_autorespond = Date.now()

      App.ask_ai({
        from: `$autorespond`,
        channel: channel,
        prompt: text,
        max_words: App.config.autorespond_words,
      })
    }
  }
}