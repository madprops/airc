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
            cmd,
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
    args.message = args.message.replace(/^[^\w]+/, ``)
    let match = args.message.match(re)
    let mention

    if (!match) {
      let mention_char = App.escape_regex(App.config.mention_char)
      let re = new RegExp(`^(?<text>.*)\\s+${mention_char}(?<nickname>\\w+)$`, ``)
      match = args.message.match(re)

      if (!match) {
        App.autorespond(args.channel, args.message)
        return
      }

      mention = args.from
    }

    if (mention) {
      if (mention.toLowerCase() === App.nick().toLowerCase()) {
        return
      }
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

      let is_command = false

      let chars = [
        App.config.emphasize_char,
        App.config.explain_char,
        App.config.continue_char,
      ]

      // Check if it's a command
      if (prompt.startsWith(App.config.command_char) && !chars.includes(prompt)) {
        is_command = true
      }

      if (is_command) {
        let cmd = prompt.replace(App.config.command_char, ``)
        App.check_commands({from: args.from, channel: args.channel, cmd})
        return
      }

      if (!App.enabled) {
        return
      }

      App.prompt({
        from: args.from,
        channel: args.channel,
        prompt,
        mention,
      })
    }
  }

  // Prepare prompt and ask the AI
  App.prompt = (args = {}) => {
    let def_args = {
      test: false,
      max_words: App.config.words,
    }

    App.def_args(def_args, args)
    App.ask_charge += 1

    if (App.ask_charge > App.max_ask_charge) {
      return
    }

    let messages = []
    let system = []
    let clear_char = App.escape_regex(App.config.clear_char)
    let clear_regex = new RegExp(`^${clear_char}\\s*`)
    let mention_char = App.escape_regex(App.config.mention_char)
    let mention_regex = new RegExp(`${mention_char}\\s*(\\w+)$`)
    let clear_on = args.prompt.startsWith(App.config.clear_char)
    let emphasize_on = args.prompt === App.config.emphasize_char
    let explain_on = args.prompt === App.config.explain_char
    let continue_on = args.prompt === App.config.continue_char
    let reveal_ai = App.config.reveal_ai
    let reveal_user = App.config.reveal_user
    let context_items = App.context[args.channel]
    let no_context = false

    if (clear_on) {
      args.prompt = args.prompt.replace(clear_regex, ``)
    }

    args.prompt = args.prompt.replace(mention_regex, (match, group) => {
      args.mention = group
      return ``
    })

    let now = App.now()

    if (args.mention) {
      if ((now - App.talk_date) >= App.talk_date_max) {
        App.talk_count = 0
        App.talked = false
      }

      App.talk_count += 1

      if (App.talk_count > App.config.talk_limit) {
        App.talk_count = 0
        App.talked = false
        return
      }

      if (!App.talked) {
        no_context = true
      }

      App.talked = true
      App.talk_date = now
    }
    else {
      App.talk_count = 0
      App.talked = false
    }

    // Prompt plus optional context and rules
    let prompt = ``

    function prompt_add(text) {
      prompt = `${prompt} ${text}`.trim()
    }

    if (App.config.timeago) {
      if (context_items && context_items.length) {
        let last = context_items.at(-1)
        let [timeago, level] = App.timeago(last.date)

        if (level >= 2) {
          prompt_add(`(Last response was ${timeago})`)
        }
      }
    }

    if (emphasize_on) {
      prompt_add(`Please emphasize the last point.`)
    }
    else if (explain_on) {
      prompt_add(`Please explain.`)
    }
    else if (continue_on) {
      prompt_add(`Please continue.`)
    }
    else {
      prompt_add(App.limit(args.prompt, App.config.max_prompt))
    }

    if (!prompt) {
      return
    }

    // System Prompt

    if (reveal_ai) {
      system.push(`Your name is ${App.config.nickname}.`)
    }

    if (App.config.sysprompt) {
      system.push(App.config.sysprompt)
    }

    let rules = App.config.rules

    if (rules) {
      rules = App.terminate(App.limit(rules, App.config.max_rules))
      system.push(rules)
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

      system.push(`Respond in ${ws}.`)
    }

    if (system.length) {
      messages.unshift({role: `system`, content: system.join(` `)})
    }

    if (!clear_on && !no_context && context_items && context_items.length) {
      for (let c of context_items) {
        let u_content = c.user

        if (reveal_user) {
          u_content = `${c.from} said: ${u_content}`
        }

        messages.push({role: `user`, content: u_content})
        messages.push({role: `assistant`, content: c.ai})
      }
    }
    else if (!args.test) {
      App.clear_context(args.channel)
    }

    let core_prompt = prompt

    if (reveal_user) {
      prompt_add(`(You can refer to me as ${args.from} if you need to)`)
    }

    messages.push({role: `user`, content: prompt})

    if (args.test) {
      App.irc_respond(args.channel, prompt)
      return
    }

    if (App.debug) {
      let messages_text = JSON.stringify(messages)
      App.log(`${args.from} => ${args.channel}: ${messages_text}`)
    }

    App.ask_ai(messages, args.channel, (response) => {
      response = App.clean(response)
      response = App.unquote(response)

      let full_response = response

      if (!App.config.lists) {
        full_response = App.remove_lists(full_response)
      }

      if (App.config.compact) {
        full_response = App.join(full_response.split(`\n`).map(x => x.trim()))
      }

      if (args.mention) {
        full_response = `${full_response} @${args.mention}`
      }

      App.irc_respond(args.channel, full_response)

      if (App.config.context > 0) {
        let context_user = App.limit(core_prompt, App.config.max_context)
        let context_ai = App.limit(response, App.config.max_context)
        let context = {user: context_user, ai: context_ai, date: App.now(), from: args.from}

        if (App.context[args.channel] === undefined) {
          App.context[args.channel] = []
        }

        App.context[args.channel].push(context)
        let sliced = App.context[args.channel].slice(-App.config.context)
        App.context[args.channel] = sliced
      }
    })
  }

  App.autorespond = (channel, text) => {
    if (App.config.autorespond <= 0) {
      return
    }

    let cooldown = 1000 * 60 * App.config.autorespond_cooldown

    if ((App.now() - App.last_autorespond) <= cooldown) {
      return
    }

    let rand = App.get_random_int(1, 100)

    if (rand <= App.config.autorespond) {
      App.last_autorespond = App.now()

      App.ask_ai({
        from: `$autorespond`,
        channel,
        prompt: text,
        max_words: App.config.autorespond_words,
      })
    }
  }

  App.enable_all = () => {
    App.enabled = true
  }

  App.disable_all = () => {
    App.enabled = false
  }

  App.talk_to = (channel, who, from) => {
    if (!who) {
      return
    }

    if (who.includes(` `)) {
      return
    }

    App.talk_count = 0
    App.talked = false

    let prompts = [
      `Make a random comment about something you like`,
      `Ask me an interesting question`,
      `You just had a big realization`,
      `Talk like an animal`,
    ]

    let n = App.get_random_int(0, prompts.length - 1)
    let prompt = prompts[n]

    App.ask_ai({
      from,
      prompt,
      channel,
      max_words: App.config.autorespond_words,
      mention: who,
    })
  }

  App.clear_context = (channel) => {
    App.context[channel] = []
  }

  App.generate_image = (channel, from, prompt) => {
    let can_image = App.is_allowed(`image`, from)

    if (!can_image) {
      return
    }

    prompt = App.limit(prompt, App.config.max_prompt)

    App.make_image(prompt, (url) => {
      if (App.imgur_enabled()) {
        App.upload_to_imgur(url, (url2) => {
          App.irc_respond(channel, url2)
        })
      }
      else {
        App.irc_respond(channel, url)
      }
    })
  }

  App.test_prompt = (data) => {
    let prompt = App.clean(data.arg)

    if (!prompt) {
      return
    }

    App.prompt({
      test: true,
      from: data.from,
      channel: data.channel,
      prompt,
    })
  }

  App.invert_context = (channel, from) => {
    if (!App.context[channel].length) {
      return
    }

    for (let c of App.context[channel]) {
      let user = c.user
      let ai = c.ai
      c.user = ai
      c.ai = user
    }

    let last = App.context[channel].at(-1)
    App.context[channel].pop()

    App.prompt({
      from,
      channel,
      prompt: last.user,
    })
  }
}