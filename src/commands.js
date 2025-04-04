// Commands from irc to the bot are checked and processed here
// If it returns true it stops the prompt to trigger a question
// Checks return true to avoid asking when cmds were meant

export default (App) => {
  App.setup_commands = () => {
    App.p = App.config.command_char

    App.cmd_help_items = [
      `${App.p}ur + [ personality ]`,
      `${App.p}rules: [ rules ]`,
      `${App.p}add_user + [ nick ]`,
      `${App.p}remove_user + [ nick ]`,
      `${App.p}allow_ask + [ all | users | admins ]`,
      `${App.p}allow_rules + [ all | users | admins ]`,
      `${App.p}allow_prompts + [ all | users | admins ]`,
      `${App.p}allow_image + [ all | users | admins ]`,
      `${App.p}model + [ ChatGPT or Gemini model ]`,
      `${App.p}avatar + [ char ]`,
      `${App.p}show_avatar + [ true | false ]`,
      `${App.p}multiprocess + [ true | false ]`,
      `${App.p}autorespond + [ 0 - 100 ]`,
      `${App.p}compact + [ true | false ]`,
      `${App.p}timeago + [ true | false ]`,
      `${App.p}lists [ true | false ]`,
      `${App.p}max_prompt [ number ]`,
      `${App.p}max_context [ number ]`,
      `${App.p}max_rules [ number ]`,
      `${App.p}max_tokens [ number ]`,
      `${App.p}talk_limit [ number ]`,
      `${App.p}think_limit [ number ]`,
      `${App.p}join + [ channel ]`,
      `${App.p}leave + [ channel? ]`,
      `${App.p}ban + [ nick ]`,
      `${App.p}unban + [ nick ]`,
      `${App.p}context + [ number ]`,
      `${App.p}spam_limit + [ number ]`,
      `${App.p}spam_minutes + [ number ]`,
      `${App.p}command_char + [ char ]`,
      `${App.p}clear_char + [ char ]`,
      `${App.p}emphasize_char + [ char ]`,
      `${App.p}explain_char + [ char ]`,
      `${App.p}continue_char + [ char ]`,
      `${App.p}mention_char + [ char ]`,
      `${App.p}prompt + [ name = prompt ]`,
      `${App.p}debug + [ true | false ]`,
      `${App.p}think_summary + [ true | false ]`,
      `${App.p}image + [ description ]`,
      `${App.p}sysprompt + [ Some base instructions ]`,
      `${App.p}say + [ thing to say exactly ]`,
      `${App.p}test + [ test prompt ]`,
      `${App.p}talkto + [ target ]`,
      `${App.p}talk_delay + [ ms ]`,
      `${App.p}upload_max + [ number ]`,
      `${App.p}long_message + [ number ]`,
      `${App.p}think_summary_1 + [ text ]`,
      `${App.p}think_summary_2 + [ text ]`,
      `${App.p}talk_prompt + [ text ]`,
      `${App.p}think_prompt_1 + [ text ]`,
      `${App.p}think_prompt_2 + [ text ]`,
      `${App.p}think_mode + [ all | process | summary ]`,
      `${App.p}save + [ name ]`,
      `${App.p}load + [ name ]`,
      `${App.p}reply`,
      `${App.p}think`,
      `${App.p}clear`,
      `${App.p}invert`,
      `${App.p}models`,
      `${App.p}enable`,
      `${App.p}disable`,
      `${App.p}config`,
      `${App.p}reset + [ config | all ]: Reset configs to default`,
      `!report: (Global) Respond with some info`,
      `!config: (Global) Show some of the config`,
      `Start with ^: Use previous response as context`,
      `End with @nick: Make the bot mention that nick`,
      `Repo: https://github.com/madprops/airc`,
    ]
  }

  App.cmd_change_nickname = (data) => {
    let nick = data.arg

    if (nick && (nick.length > 0) && (nick.length <= App.max_username_length)) {
      App.update_config(`nickname`, nick)
      App.cmd_show(data.channel, `nickname`)
      App.change_nickname(nick)
    }
  }

  App.cmd_report_self = (channel) => {
    let [timeago, level] = App.timeago(App.date_started)
    let memory = App.get_memory_used()
    App.irc_respond(channel, `Launched ${timeago} | Memory: ${memory} MB`)
    return
  }

  App.cmd_show_config = (channel) => {
    let info = []

    for (let key of [
      `rules`,
      `autorespond`,
      `model`,
      `models`,
      `words`,
      `allow_ask`,
      `allow_rules`,
      `allow_prompts`,
      `allow_image`,
      `users`,
      `admins`,
    ]) {
      info.push(App.cmd_info(key))
    }

    App.irc_respond(channel, App.join(info, `|`))
  }

  App.cmd_info = (key) => {
    let value

    if (typeof App.config[key] === `object`) {
      value = App.join(App.config[key])
    }
    else {
      value = String(App.config[key])
    }

    value = value || `(Empty)`
    return `${App.irc_bold(key)}: ${value}`
  }

  App.cmd_show = (channel, key) => {
    let info = App.cmd_info(key)
    App.irc_respond(channel, info)
  }

  App.cmd_denied = (data) => {
    App.irc_respond(data.channel, `Permission Denied.`)
  }

  App.cmd_match = (cmd_name, full_cmd) => {
    let ok = false
    let arg = ``

    if (full_cmd.startsWith(cmd_name)) {
      ok = true
    }

    let first = full_cmd.split(` `)[0]
    let name_re = App.escape_regex(cmd_name)
    let match_regex = new RegExp(`^${name_re}(\\s|$)`)
    ok = match_regex.test(full_cmd)

    if (ok) {
      let first_re = App.escape_regex(first)
      let re = new RegExp(`^${first_re}\\s*`, `i`)
      arg = full_cmd.replace(re, ``).trim()
    }

    return {ok, arg}
  }

  App.cmd_help = (data) => {
    let help = [...App.cmd_help_items]

    if (data.arg) {
      let low = data.arg.toLowerCase()
      help = help.filter(x => x.toLowerCase().includes(low))
    }

    return help
  }

  App.cmd_change_rules = (data) => {
    App.cmd_string(data, `rules`, App.config.max_rules)
    App.clear_context(data.channel)
  }

  App.cmd_num = (args = {}) => {
    let def_args = {
      min: 1,
      max: 10 * 1000,
    }

    App.def_args(def_args, args)
    let n = parseInt(args.data.arg)

    if (!isNaN(n)) {
      if ((n >= args.min) && (n <= args.max)) {
        App.update_config(args.key, n)
        App.cmd_show(args.data.channel, args.key)
      }
    }
  }

  App.cmd_bool = (data, key) => {
    let value = App.bool(data.arg)

    if (value === undefined) {
      return
    }

    App.update_config(key, value)
    App.cmd_show(data.channel, key)
  }

  App.cmd_string = (data, key, max_length = 2000) => {
    let value = App.limit(data.arg, max_length)
    App.update_config(key, value)
    App.cmd_show(data.channel, key)
  }

  App.cmd_done = (data) => {
    App.irc_respond(data.channel, `Done.`)
  }

  App.cmd_similar = (arg, items) => {
    let max = 0
    let ans = ``

    for (let item of items) {
      let n = App.similarity(arg, item)

      if ((n >= 0.6) && (n > max)) {
        max = n
        ans = item
      }
    }

    return ans
  }

  App.allowed_modes = [`all`, `users`, `admins`]

  App.commands = [
    {
      name: `help`,
      on_exact: (data) => {
        let help = App.cmd_help(data)
        App.irc_respond(data.from, App.join(help))
        App.irc_respond(data.channel, `🛟 Help sent as a private message.`)
      },
      on_arg: (data) => {
        let help = App.cmd_help(data)
        App.irc_respond(data.channel, App.join(help))
      },
      allow: `all`,
    },
    {
      name: `ur`,
      on_arg: (data) => {
        data.arg = `Respond as if you were ${data.arg}`
        App.cmd_change_rules(data)
      },
      allow: `rules`,
    },
    {
      name: `rules`,
      on_arg: (data) => {
        App.cmd_change_rules(data)
      },
      allow: `rules`,
    },
    {
      name: `think_summary_0`,
      on_arg: (data) => {
        App.cmd_string(data, `think_summary_0`)
      },
      allow: `rules`,
    },
    {
      name: `think_summary_1`,
      on_arg: (data) => {
        App.cmd_string(data, `think_summary_1`)
      },
      allow: `rules`,
    },
    {
      name: `think_summary_2`,
      on_arg: (data) => {
        App.cmd_string(data, `think_summary_2`)
      },
      allow: `rules`,
    },
    {
      name: `talk_prompt`,
      on_arg: (data) => {
        App.cmd_string(data, `talk_prompt`)
      },
      allow: `rules`,
    },
    {
      name: `think_prompt_1`,
      on_arg: (data) => {
        App.cmd_string(data, `think_prompt_1`)
      },
      allow: `rules`,
    },
    {
      name: `think_prompt_2`,
      on_arg: (data) => {
        App.cmd_string(data, `think_prompt_2`)
      },
      allow: `rules`,
    },
    {
      name: `think_mode`,
      on_arg: (data) => {
        if (![`all`, `process`, `summary`].includes(data.arg)) {
          App.irc_respond(data.channel, `It must be 'all', 'process' or 'summary'.`)
          return
        }

        App.cmd_string(data, `think_mode`)
      },
      allow: `rules`,
    },
    {
      name: `say`,
      on_arg: (data) => {
        App.irc_respond(data.channel, data.arg)
      },
      allow: `prompts`,
    },
    {
      name: `test`,
      on_arg: (data) => {
        App.test_prompt(data)
      },
      allow: `prompts`,
    },
    {
      name: `add_user`,
      on_arg: (data) => {
        if (data.arg.length <= App.max_username_length) {
          if (!App.is_user(data.arg) && !App.is_admin(data.arg)) {
            App.config.users.push(data.arg)
            App.update_config(`users`, App.config.users)
            App.cmd_show(data.channel, `users`)
          }
        }
      },
    },
    {
      name: `remove_user`,
      on_arg: (data) => {
        if (App.is_user(data.arg)) {
          let nick = data.arg.toLowerCase()
          let users = App.config.users.map(x => x.toLowerCase()).filter(x => x !== nick)
          App.update_config(`users`, users)
          App.cmd_show(data.channel, `users`)
        }
      },
    },
    {
      name: `allow_ask`,
      on_arg: (data) => {
        let value = App.cmd_similar(data.arg, App.allowed_modes)

        if (value) {
          App.update_config(`allow_ask`, value)
          App.cmd_show(data.channel, `allow_ask`)
        }
      },
    },
    {
      name: `allow_rules`,
      on_arg: (data) => {
        let value = App.cmd_similar(data.arg, App.allowed_modes)

        if (value) {
          App.update_config(`allow_rules`, value)
          App.cmd_show(data.channel, `allow_rules`)
        }
      },
    },
    {
      name: `allow_prompts`,
      on_arg: (data) => {
        let value = App.cmd_similar(data.arg, App.allowed_modes)

        if (value) {
          App.update_config(`allow_prompts`, value)
          App.cmd_show(data.channel, `allow_prompts`)
        }
      },
    },
    {
      name: `allow_image`,
      on_arg: (data) => {
        let value = App.cmd_similar(data.arg, App.allowed_modes)

        if (value) {
          App.update_config(`allow_image`, value)
          App.cmd_show(data.channel, `allow_image`)
        }
      },
    },
    {
      name: `model`,
      on_arg: (data) => {
        App.cmd_string(data, `model`)
        App.reset_model()
      },
    },
    {
      name: `models`,
      on_exact: (data) => {
        let models = App.cmd_models.join(` | `)
        let key = App.irc_bold(`Models`)
        let text = `${key}: ${models}`
        App.irc_respond(data.channel, text)
      },
    },
    {
      name: `max_prompt`,
      on_arg: (data) => {
        App.cmd_num({key: `max_prompt`, data})
      },
    },
    {
      name: `max_context`,
      on_arg: (data) => {
        App.cmd_num({key: `max_context`, data})
      },
    },
    {
      name: `max_rules`,
      on_arg: (data) => {
        App.cmd_num({key: `max_rules`, data})
      },
    },
    {
      name: `max_tokens`,
      on_arg: (data) => {
        App.cmd_num({key: `max_tokens`, data})
      },
    },
    {
      name: `talk_limit`,
      on_arg: (data) => {
        App.cmd_num({key: `talk_limit`, data, max: 10})
      },
    },
    {
      name: `think_limit`,
      on_arg: (data) => {
        App.cmd_num({key: `think_limit`, data, max: 10})
      },
    },
    {
      name: `long_message`,
      on_arg: (data) => {
        App.cmd_num({key: `long_message`, data, min: 1, max: 5000})
      },
    },
    {
      name: `upload_max`,
      on_arg: (data) => {
        App.cmd_num({key: `upload_max`, data, min: 1, max: 5000})
      },
    },
    {
      name: `report`,
      on_exact: (data) => {
        App.cmd_report_self(data.channel)
      },
    },
    {
      name: `join`,
      on_arg: (data) => {
        App.join_channel(data.channel, data.arg)
      },
    },
    {
      name: `leave`,
      on_exact: (data) => {
        App.leave_channel(data.channel, data.channel)
      },
      on_arg: (data) => {
        App.leave_channel(data.channel, data.arg)
      },
    },
    {
      name: `ban`,
      on_arg: (data) => {
        App.antispam_ban(data.arg)
        App.cmd_done(data)
      },
    },
    {
      name: `unban`,
      on_arg: (data) => {
        App.antispam_unban(data.arg)
        App.cmd_done(data)
      },
    },
    {
      name: `context`,
      on_arg: (data) => {
        App.clear_context(data.channel)
        App.cmd_num({key: `context`, data, min: 0, max: 10})
      },
    },
    {
      name: `spam_limit`,
      on_arg: (data) => {
        App.cmd_num({key: `spam_limit`, data})
      },
    },
    {
      name: `spam_minutes`,
      on_arg: (data) => {
        App.cmd_num({key: `spam_minutes`, data})
      },
    },
    {
      name: `talk_delay`,
      on_arg: (data) => {
        App.cmd_num({key: `talk_delay`, data, min: 0, max: App.DAY})
      },
    },
    {
      name: `compact`,
      on_arg: (data) => {
        App.cmd_bool(data, `compact`)
      },
    },
    {
      name: `timeago`,
      on_arg: (data) => {
        App.cmd_bool(data, `timeago`)
      },
    },
    {
      name: `lists`,
      on_arg: (data) => {
        App.cmd_bool(data, `lists`)
      },
    },
    {
      name: `enable`,
      on_exact: (data) => {
        if (App.enabled) {
          return
        }

        App.enable_all()
        App.irc_respond(data.channel, `I can respond now.`)
      },
    },
    {
      name: `disable`,
      on_exact: (data) => {
        if (!App.enabled) {
          return
        }

        App.disable_all()
        App.irc_respond(data.channel, `I won't respond anymore.`)
      },
    },
    {
      name: `invert`,
      on_exact: (data) => {
        App.invert_context(data.channel, data.from)
      },
      allow: `prompts`,
    },
    {
      name: `raw`,
      on_exact: (data) => {
        App.raw_response(data.channel)
      },
      allow: `prompts`,
    },
    {
      name: `save`,
      on_arg: (data) => {
        App.save_config(data.arg, data.channel)
      },
    },
    {
      name: `load`,
      on_arg: (data) => {
        App.load_config(data.arg, data.channel)
      },
    },
    {
      name: `clear`,
      on_exact: (data) => {
        App.clear_context(data.channel)
        App.irc_respond(data.channel, `Context cleared.`)
      },
      allow: `prompts`,
    },
    {
      name: `clear_char`,
      on_arg: (data) => {
        App.cmd_string(data, `clear_char`)
      },
    },
    {
      name: `emphasize_char`,
      on_arg: (data) => {
        App.cmd_string(data, `emphasize_char`)
      },
    },
    {
      name: `explain_char`,
      on_arg: (data) => {
        App.cmd_string(data, `explain_char`)
      },
    },
    {
      name: `continue_char`,
      on_arg: (data) => {
        App.cmd_string(data, `continue_char`)
      },
    },
    {
      name: `command_char`,
      on_arg: (data) => {
        App.cmd_string(data, `command_char`)
      },
    },
    {
      name: `mention_char`,
      on_arg: (data) => {
        App.cmd_string(data, `mention_char`)
        App.setup_regex()
      },
    },
    {
      name: `join_char`,
      on_arg: (data) => {
        App.cmd_string(data, `join_char`)
      },
    },
    {
      name: `respond`,
      on_exact: (data) => {
        App.respond(data.channel)
      },
      allow: `prompts`,
    },
    {
      name: `sysprompt`,
      on_arg: (data) => {
        App.cmd_string(data, `sysprompt`)
      },
    },
    {
      name: `avatar`,
      on_arg: (data) => {
        App.cmd_string(data, `avatar`)
      },
    },
    {
      name: `show_avatar`,
      on_arg: (data) => {
        App.cmd_bool(data, `show_avatar`)
      },
    },
    {
      name: `reveal_ai`,
      on_arg: (data) => {
        App.cmd_bool(data, `reveal_ai`)
      },
    },
    {
      name: `reveal_user`,
      on_arg: (data) => {
        App.cmd_bool(data, `reveal_user`)
      },
    },
    {
      name: `multiprocess`,
      on_arg: (data) => {
        App.cmd_bool(data, `multiprocess`)
      },
    },
    {
      name: `program`,
      on_arg: (data) => {
        App.program_prompt(data.channel, data.arg)
      },
      allow: `rules`,
    },
    {
      name: `autorespond`,
      on_arg: (data) => {
        let n = parseInt(data.arg)

        if (!isNaN(n)) {
          if ((n >= 0) && (n <= 100)) {
            App.update_config(`autorespond`, n)
            App.cmd_show(data.channel, `autorespond`)
          }
        }
      },
    },
    {
      name: `autorespond_cooldown`,
      on_arg: (data) => {
        App.cmd_num({key: `autorespond_cooldown`, data, min: 0})
      },
    },
    {
      name: `autorespond_words`,
      on_arg: (data) => {
        App.cmd_num({key: `autorespond_words`, data, min: 0, max: 50000})
      },
    },
    {
      name: `words`,
      on_arg: (data) => {
        App.cmd_num({key: `words`, data, min: 0, max: 50000})
      },
    },
    {
      name: `think_summary_words`,
      on_arg: (data) => {
        App.cmd_num({key: `think_summary_words`, data, min: 0, max: 50000})
      },
    },
    {
      name: `nickname`,
      on_arg: (data) => {
        App.cmd_change_nickname(data)
      },
      no_batch: true,
    },
    {
      name: `prompt`,
      on_arg: (data) => {
        if (!data.arg) {
          return
        }

        let split = data.arg.split(`=`)

        if (split.length === 1) {
          let clean = App.clean_prompt(data.arg)
          let prompt = App.config.prompts[clean]

          if (!prompt) {
            return
          }

          if (data.arg.endsWith(`?`)) {
            App.irc_respond(data.channel, `${clean} = ${prompt}`)
            return
          }

          let msg = `${App.nick()}, ${App.config.clear_char} ${prompt}`
          App.process_message({from: data.from, channel: data.channel, message: msg})
          return
        }

        if (Object.keys(App.config.prompts).length >= 1000) {
          return
        }

        if (data.arg.length > 240) {
          return
        }

        if (split.length < 2) {
          return
        }

        let name = App.clean_prompt(split[0])
        let prompt = split.slice(1).join(`=`).trim()

        if (!name || !prompt) {
          return
        }

        App.config.prompts[name] = prompt
        App.update_config(`prompts`, App.config.prompts)
        App.irc_respond(data.channel, `Prompt Saved.`)
      },
      allow: `prompts`,
    },
    {
      name: `image`,
      on_arg: (data) => {
        App.generate_image(data.channel, data.from, data.arg)
      },
    },
    {
      name: `testme`,
      on_exact: (data) => {
        App.testme()
      },
    },
    {
      name: `config`,
      on_exact: (data) => {
        App.cmd_show_config(data.channel)
      },
    },
    {
      name: `think_summary`,
      on_arg: (data) => {
        App.cmd_bool(data, `think_summary`)
      },
    },
    {
      name: `debug`,
      on_arg: (data) => {
        App.cmd_bool(data, `debug`)
      },
      on_exact: (data) => {
        App.irc_respond(data.channel, `Debug: ${App.debug}`)
      },
    },
    {
      name: `upload_test`,
      on_exact: (data) => {
        App.upload_text(data.channel, `This is a test`)
      },
    },
    {
      name: `talkto`,
      on_arg: (data) => {
        App.talk_to(data.channel, data.arg, data.from)
      },
      allow: `prompts`,
    },
    {
      name: `think`,
      on_exact: (data) => {
        App.think(data.channel, data.arg, data.from)
      },
      on_arg: (data) => {
        App.think(data.channel, data.arg, data.from)
      },
      allow: `prompts`,
    },
    {
      name: `reset`,
      on_arg: (data) => {
        if (data.arg === `all`) {
          App.reset_config()
          App.cmd_done(data)
        }
        else {
          if (App.config_keep.includes(data.arg)) {
            App.irc_respond(data.channel, `Can't reset ${data.arg}.`)
            return
          }

          let keys = Object.keys(App.config)

          if (keys.includes(data.arg)) {
            App.update_config(data.arg, `reset`)
            App.cmd_show(data.channel, data.arg)
          }
        }
      },
    },
  ]

  App.check_command = (c, data) => {
    let ans = App.cmd_match(c.name, data.cmd)

    if (!ans.ok) {
      return false
    }

    if (ans.ok) {
      let allowed = false

      if (c.allow === `all`) {
        allowed = true
      }
      else if (c.allow === `rules`) {
        if (data.can_rules) {
          allowed = true
        }
      }
      else if (c.allow === `prompts`) {
        if (data.can_prompts) {
          allowed = true
        }
      }
      else if (data.is_admin) {
        allowed = true
      }

      if (data.batch) {
        if (c.no_batch) {
          allowed = false
        }
      }

      if (ans.arg) {
        if (c.on_arg) {
          if (allowed) {
            data.arg = ans.arg
            c.on_arg(data)
          }
          else {
            App.cmd_denied(data)
          }
        }
        else {
          return false
        }
      }
      // Exact match
      else if (c.on_exact) {
        if (allowed) {
          c.on_exact(data)
        }
        else {
          App.cmd_denied(data)
        }
      }
      else {
        return false
      }

      return true
    }
  }

  App.check_commands = (args = {}) => {
    let def_args = {
      batch: false,
    }

    App.def_args(def_args, args)

    if (App.add_spam(args.from)) {
      let mins = App.plural(App.config.spam_minutes, `minute`, `minutes`)
      App.irc_respond(args.channel, `${args.from} was banned for ${mins}.`)
      return
    }

    let data = {}
    data.from = args.from
    data.channel = args.channel
    data.cmd = args.cmd
    data.can_rules = App.is_allowed(`rules`, args.from)
    data.can_prompts = App.is_allowed(`prompts`, args.from)
    data.is_admin = App.is_admin(args.from)
    data.batch = args.batch

    for (let c of App.commands) {
      if (App.check_command(c, data)) {
        return
      }
    }

    // Print values
    for (let c of Object.keys(App.config)) {
      let ans = App.cmd_match(c, args.cmd)

      if (ans.ok) {
        App.cmd_show(args.channel, c)
        break
      }
    }
  }
}