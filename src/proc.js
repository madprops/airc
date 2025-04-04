// These are functions that process a received message
// Input from irc is checked and maybe sent to openai

export default (App) => {
  App.setup_regex = () => {
    let c = App.escape_regex(App.config.mention_char)
    let m1 = App.escape_regex(App.marker_1)
    let m2 = App.escape_regex(App.marker_2)
    let s = `^(?:(?<avatar>[^,:\\s]+)\\s)?(?:(?<nickname>\\w+)[,:]\\s*)?(?<text>.*)(\\s+${c}(?<mention>\\w+))?[${m1}${m2}]*$`
    App.message_regex = new RegExp(s, ``)
  }

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
    if (App.is_url(low)) {
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

    App.check_prompt({
      from: args.from,
      channel: args.channel,
      message: args.message,
    })
  }

  // Check Prompt

  App.check_prompt = (args = {}) => {
    let def_args = {}
    App.def_args(def_args, args)
    let match = args.message.match(App.message_regex)

    if (!match) {
      App.autorespond(args.channel, args.message)
      return
    }

    let nick = match.groups?.nickname?.trim()
    let prompt = match.groups?.text?.trim()
    let mention = match.groups?.mention?.trim()

    if (args.from === App.nick()) {
      if (App.thinking || (nick === App.nick())) {
        if (App.talk_count === 0) {
          App.talk_count = 1
        }

        let ctx = App.context[args.channel]

        if (ctx) {
          let last = ctx.at(-1)

          if (last) {
            prompt = App.think_messages.at(-1)
          }
        }

        if (!prompt) {
          return
        }

        App.prompt({
          prompt,
          channel: args.channel,
          from: args.from,
          think: true,
          ongoing: true,
        })

        return
      }
    }

    if (!nick) {
      if (!mention) {
        return
      }

      nick = args.from
    }

    if (!nick || !prompt) {
      return
    }

    let lower = nick.toLowerCase()

    if (lower !== App.nick().toLowerCase()) {
      if (lower !== App.config.nickname.toLowerCase()) {
        return
      }
    }

    if (App.is_talk_signed(args.message)) {
      App.prompt({
        prompt,
        channel: args.channel,
        from: args.from,
        mention: args.from,
        talk: true,
        ongoing: true,
      })

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

  // Prepare prompt and ask the AI
  App.prompt = (args = {}) => {
    let def_args = {
      test: false,
      max_words: App.config.words,
      talk: false,
      think: false,
      ongoing: true,
      no_names:  false,
      context_items: [],
    }

    App.def_args(def_args, args)

    if (args.sysprompt === undefined) {
      if (args.talk) {
        if (App.config.talk_prompt) {
          args.sysprompt = App.config.talk_prompt
        }
      }
      else if (args.think) {
        if (App.config.think_prompt_1) {
          if (App.config.think_prompt_2) {
            if (App.talk_count % 2 === 0) {
              args.sysprompt = App.config.think_prompt_2
            }
            else {
              args.sysprompt = App.config.think_prompt_1
            }
          }
          else {
            args.sysprompt = App.config.think_prompt_1
          }
        }
      }
    }

    if (App.add_spam(args.from)) {
      let mins = App.plural(App.config.spam_minutes, `minute`, `minutes`)
      App.irc_respond(args.channel, `${args.from} was banned for ${mins}.`)
      return
    }

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
    let answer_on = args.prompt === App.config.answer_char
    let reveal_ai = App.config.reveal_ai
    let reveal_user = App.config.reveal_user
    args.context_items = App.context[args.channel]
    let no_context = false
    let now = App.now()

    if (args.talk || args.think) {
      if (!App.check_talk(false, args)) {
        return
      }

      if (args.think) {
        App.thinking = true
      }

      if (!App.talked) {
        no_context = true
      }

      App.talked = true
      App.talk_date = now
      App.talk_channel = args.channel

      if (args.talk) {
        App.talk_nick = args.mention
      }
      else if (args.think) {
        App.talk_nick = args.from
      }
    }
    else {
      App.reset_talk()
    }

    args.prompt = App.remove_talk_signature(args.prompt)

    if (args.no_names) {
      reveal_ai = false
      reveal_user = false
    }

    if (clear_on) {
      args.prompt = args.prompt.replace(clear_regex, ``)
    }

    args.prompt = args.prompt.replace(mention_regex, (match, group) => {
      args.mention = group
      return ``
    })

    // Prompt plus optional context and rules
    let prompt = ``

    function prompt_prepend(text) {
      prompt = `${text} ${prompt}`.trim()
    }

    function prompt_add(text) {
      prompt = `${prompt} ${text}`.trim()
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
    else if (answer_on) {
      prompt_add(`Please answer the question yourself.`)
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

    let sysprompt

    if (args.sysprompt !== undefined) {
      sysprompt = args.sysprompt.trim()
    }
    else {
      sysprompt = system.join(`\n`)
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

      sysprompt += `\nRespond in ${ws}.`
    }

    if (system.length) {
      messages.unshift({role: `system`, content: sysprompt})
    }

    if (!clear_on && !no_context && args.context_items && args.context_items.length) {
      for (let c of args.context_items) {
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

    if (App.config.timeago) {
      if (args.context_items && args.context_items.length) {
        let last = args.context_items.at(-1)
        let [timeago, level] = App.timeago(last.date)

        if (level >= 2) {
          prompt_prepend(`(Last response was ${timeago})`)
        }
      }
    }

    if (args.ongoing) {
      prompt_add(`We are in an ongoing conversation, don't greet me. Don't mention my name.`)
    }
    else if (reveal_user) {
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

    args.core_prompt = core_prompt
    let td = App.config.talk_delay

    if (App.talked && (App.talk_count > 1) && (td > 0)) {
      setTimeout(() => {
        App.do_prompt(messages, args)
      }, td)

      return
    }

    App.do_prompt(messages, args)
  }

  App.do_prompt = (messages, args) => {
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
        full_response = `${args.mention}, ${full_response}`
      }

      if (args.think && (full_response.length >= App.config.long_message)) {
        let s = `[Long Message]`
        App.long_message_count += 1

        if (App.long_message_count > 1) {
          s += ` x${App.long_message_count}`
        }

        s = App.add_signature(args, s)

        if ([`all`, `process`].includes(App.config.think_mode)) {
          App.irc_respond(args.channel, s)
        }
      }
      else if (full_response.length > App.config.upload_max) {
        App.upload_text(args, full_response)
      }
      else {
        full_response = App.add_signature(args, full_response)
        let ok = true

        if (args.think) {
          ok = [`all`, `process`].includes(App.config.think_mode)
        }

        if (ok) {
          App.irc_respond(args.channel, full_response)
        }
      }

      if (args.think) {
        App.think_messages.push(response)
      }

      if (App.config.context > 0) {
        let context_user = App.limit(args.core_prompt, App.config.max_context)
        let context_ai = App.limit(response, App.config.max_context)
        let context = {user: context_user, ai: context_ai, date: App.now(), from: args.from}

        if (App.context[args.channel] === undefined) {
          App.context[args.channel] = []
        }

        if (context_ai.length >= App.config.long_message) {
          let new_items = []

          for (let m of App.context[args.channel]) {
            if ((m.user.length < App.config.long_message) &&
            (m.ai.length < App.config.long_message)) {
              new_items.push(m)
            }
          }

          App.context[args.channel] = new_items
        }

        App.context[args.channel].push(context)
        let sliced = App.context[args.channel].slice(-App.config.context)
        App.context[args.channel] = sliced
      }

      if ([`summary`].includes(App.config.think_mode)) {
        let prompt = App.think_messages.at(-1)

        if (prompt) {
          App.prompt({
            prompt,
            channel: args.channel,
            from: args.from,
            think: true,
            ongoing: true,
          })
        }
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

      App.prompt({
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

  App.think = (channel, prompt, from) => {
    let nick = App.nick()
    App.talk_to(channel, nick, nick, prompt)
  }

  App.talk_to = (channel, who, from, prompt = ``) => {
    if (!who) {
      return
    }

    if (who.includes(` `)) {
      return
    }

    App.reset_talk()

    if (!prompt) {
      if (App.context[channel] && App.context[channel].length) {
        prompt = App.context[channel].at(-1).ai
      }
    }

    if (!prompt) {
      let n = App.get_random_int(0, App.prompt_ideas.length - 1)
      prompt = App.prompt_ideas[n]
    }

    App.clear_context(channel)
    App.talk_prompt = prompt.trim()
    let talk, think, mention

    if (who === from) {
      think = true
      talk = false
      mention = ``
    }
    else {
      think = false
      talk = true
      mention = who
    }

    App.prompt({
      prompt,
      channel,
      max_words: App.config.autorespond_words,
      from: who,
      mention,
      talk,
      think,
      ongoing: true,
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
    if (!App.context[channel] || !App.context[channel].length) {
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

  App.raw_response = (channel) => {
    if (!App.context[channel] || !App.context[channel].length) {
      return
    }

    let last = App.context[channel].at(-1)

    if (!last) {
      return
    }

    App.irc_respond(channel, last.ai, false)
  }

  App.upload_text = (args, text) => {
    // Upload then show the first 100 chars and the link
    // Make sure to add the signatures at the end
    App.rentry_upload(args.channel, text, (url, pw, ch) => {
      let txt = text.substring(0, 100).trim()
      txt += `... ${url}`
      txt = App.add_signature(args, txt)
      App.irc_respond(ch, txt)
    })
  }

  App.upload_text_2 = (channel, message, text) => {
    App.rentry_upload(channel, text, (url, pw, ch) => {
      let txt = `${message} ${url}`
      App.irc_respond(ch, txt)
    })
  }

  App.check_talk = (just_check = false, args = {}) => {
    if ((App.talk_date > 0) && ((App.now() - App.talk_date) >= App.talk_date_max)) {
      if (!just_check) {
        App.reset_talk()
        return false
      }
    }

    let count = App.talk_count + 1

    if (!just_check) {
      App.talk_count = count
    }

    let limit

    if (App.talk_nick === App.nick()) {
      limit = App.config.think_limit
    }
    else {
      limit = App.config.talk_limit
    }

    if (count > limit) {
      if ((count === (limit + 1)) && App.think_summary_enabled()) {
        if (!just_check) {
          App.think_summary(args)
        }

        return true
      }

      if (!just_check) {
        App.reset_talk()
      }

      return false
    }

    return true
  }

  App.reset_talk = () => {
    if (App.thinking) {
      App.think_done()
    }

    App.talk_date = 0
    App.talk_count = 0
    App.talked = false
    App.talk_nick = ``
    App.think_messages = []
    App.talk_channel = ``
    App.long_message_count = 0
    App.thinking = false
    App.talk_prompt = ``
  }

  //

  App.sign_talk = (text) => {
    return `${text}${App.talk_signature}`
  }

  App.remove_talk_signature = (text) => {
    let s = `${App.escape_regex(App.talk_signature)}$`
    return text.replace(new RegExp(s), ``).trim()
  }

  App.is_talk_signed = (text) => {
    return text.endsWith(App.talk_signature)
  }

  //

  App.add_signature = (args, text) => {
    if (args.talk) {
      text = App.sign_talk(text)
    }

    return text
  }

  App.think_done = () => {
    if (App.think_messages.length < 4) {
      return
    }

    let lines = []

    for (let res of App.think_messages) {
      lines.push(res)
    }

    lines.push(`Model: ${App.config.model}`)

    let nick = `${App.config.avatar} ${App.talk_nick}`.trim()
    let text = `${nick}: ${App.talk_prompt}\n\n---\n\n`
    text += lines.join(`\n\n---\n\n`)

    App.upload_text_2(App.talk_channel, `Full Think:`, text)
  }

  App.think_summary = (args) => {
    let lines = []

    for (let res of App.think_messages) {
      lines.push(res)
    }

    let ctx = lines.join(`\n\n`).trim()
    let prompt = `${App.config.think_summary_1}:\n\n${ctx}`
    prompt += `\n\n---\n\n${App.config.think_summary_2}:\n\n${App.talk_prompt}`
    args.prompt = prompt
    args.max_words = App.config.think_summary_words
    args.no_names = true
    args.sysprompt = App.config.think_summary_0 || `[empty]`
    args.ongoing = false
    args.context_items = []
  }

  App.think_summary_enabled = () => {
    let mode = [`all`, `summary`].includes(App.config.think_mode)
    return App.thinking && App.config.think_summary && (App.config.think_limit >= 4) && mode
  }

  // Make this run whatever
  App.testme = () => {
    //
  }

  App.respond = (channel) => {
    let m = App.last_irc_message

    if (!m.message) {
      return
    }

    App.prompt({
      from: m.from,
      prompt: m.message,
      channel,
    })
  }

  App.save_config = (name, channel) => {
    let saved = App.i.path.join(App.dirname, `saved`)

    if (!App.i.fs.existsSync(saved)) {
      App.i.fs.mkdirSync(saved)
    }

    let file_path = App.i.path.join(saved, `${name}.json`)
    let copy = JSON.parse(JSON.stringify(App.config))

    let priv = [
      `server`,
      `channels`,
      `port`,
      `username`,
      `nickname`,
      `admins`,
      `users`,
    ]

    for (let p of priv) {
      delete copy[p]
    }

    let json = JSON.stringify(copy, null, 2)
    App.i.fs.writeFileSync(file_path, json)
    App.irc_respond(channel, `Config saved.`)
  }

  App.load_config = (name, channel) => {
    let saved = App.i.path.join(App.dirname, `saved`)
    let file_path = App.i.path.join(saved, `${name}.json`)

    if (!App.i.fs.existsSync(file_path)) {
      return
    }

    let json = App.i.fs.readFileSync(file_path, `utf8`)
    let data = JSON.parse(json)

    for (let k in data) {
      App.config[k] = data[k]
    }

    App.irc_respond(channel, `Config loaded.`)
  }

  App.program_prompt = (channel, arg) => {
    let messages = []

    let sysprompt = `You are a bot on irc and will be given an instruction to reconfigure yourself.`
    messages.unshift({role: `system`, content: sysprompt})

    let mx = App.config.max_rules
    let u_content = `Generate a single personality rule, under ${mx} characters, suitable for an IRC bot. Base the rule on the following instruction: "${arg}".  The rule should refer to the AI in the second person (e.g., "You are a...", "You enjoy..."). Do not include any introductory or concluding phrases. Only output the personality rule itself.`
    messages.push({role: `user`, content: u_content})

    App.ask_ai(messages, channel, (response) => {
      if (response) {
        let value = App.limit(response, mx)
        App.update_config(`rules`, value)
        App.cmd_show(channel, `rules`)
      }
    })
  }
}