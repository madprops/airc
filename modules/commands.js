// Commands from irc to the bot are checked and processed here
// If it returns true it stops the prompt to trigger a question
// Checks return true to avoid asking when cmds were meant

module.exports = (App) => {
  App.cmd_info = (key) => {
    let value

    if (typeof App.config[key] === `object`) {
      value = App.config[key].join(`, `)
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
    App.irc_respond(data.channel, `Permission Denied`)
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

    if (!ok) {
      if (App.similarity(cmd_name, first) >= 0.8) {
        ok = true
      }
    }

    if (ok) {
      let first_re = App.escape_regex(first)
      let re = new RegExp(`^${first_re}\\s*`, `i`)
      arg = full_cmd.replace(re, ``).trim()
    }

    return {ok: ok, arg: arg}
  }

  App.cmd_models = Object.keys(App.models)
  App.p = App.config.command_char

  App.cmd_help_items = [
    `${App.p}ur + [ personality ]`,
    `${App.p}rules: [ rules ]`,
    `${App.p}add_user + [ nick ]`,
    `${App.p}remove_user + [ nick ]`,
    `${App.p}allow_ask + [ all | users | admins ]`,
    `${App.p}allow_rules + [ all | users | admins ]`,
    `${App.p}model + [ ${App.join(App.cmd_models, `|`)} ]`,
    `${App.p}separator + [ emoji ]`,
    `${App.p}compact + [ true | false ]`,
    `${App.p}max_prompt [ number ]`,
    `${App.p}max_context [ number ]`,
    `${App.p}max_rules [ number ]`,
    `${App.p}max_tokens [ number ]`,
    `${App.p}join + [ channel ]`,
    `${App.p}leave + [ channel? ]`,
    `${App.p}ban + [ nick ]`,
    `${App.p}unban + [ nick ]`,
    `${App.p}spam_limit + [ number ]`,
    `${App.p}spam_minutes + [ number ]`,
    `${App.p}command_char + [ char ]`,
    `${App.p}context_char + [ char ]`,
    `${App.p}mention_char + [ char ]`,
    `${App.p}join_char + [ char ]`,
    `${App.p}reset + [ config | all ]: Reset configs to default`,
    `!report: (Global) Respond with some info`,
    `!config: (Global) Show some of the config`,
    `Start with ^: Use previous response as context`,
    `End with @nick: Make the bot mention that nick`,
    `Repo: https://github.com/madprops/airc`,
  ]

  App.cmd_help = (data) => {
    let help = [...App.cmd_help_items]

    if (data.arg) {
      let low = data.arg.toLowerCase()
      help = help.filter(x => x.toLowerCase().includes(low))
    }

    return help
  }

  App.cmd_change_rules = (data) => {
    data.arg = App.limit(data.arg, App.config.max_rules)
    App.update_config(`rules`, data.arg)
    App.cmd_show(data.channel, `rules`)
  }

  App.cmd_num = (key, data) => {
    let n = parseInt(data.arg)

    if (!isNaN(n)) {
      if (n > 0 && n <= (10 * 1000)) {
        App.update_config(key, n)
        App.cmd_show(data.channel, key)
      }
    }
  }

  App.cmd_done = (data) => {
    App.irc_respond(data.channel, `Done.`)
  }

  App.cmd_similar = (arg, items) => {
    let max = 0
    let ans = ""

    for (let item of items) {
      let n = App.similarity(arg, item)

      if (n >= 0.7 && n > max) {
        max = n
        ans = item
      }
    }

    return ans
  }

  App.commands = [
    {
      name: `help`,
      on_exact: (data) => {
        let help = App.cmd_help(data)
        App.irc_respond(data.from, App.join(help))
        App.irc_respond(data.channel, `🛟 Help sent as a private message`)
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
      name: `add_user`,
      on_arg: (data) => {
        if (data.arg.length <= App.max_user_length) {
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
        let allowed = [`all`, `users`, `admins`]
        let value = App.cmd_similar(data.arg, allowed)

        if (value) {
          App.update_config(`allow_ask`, value)
          App.cmd_show(data.channel, `allow_ask`)
        }
      },
    },
    {
      name: `allow_rules`,
      on_arg: (data) => {
        let allowed = [`all`, `users`, `admins`]
        let value = App.cmd_similar(data.arg, allowed)

        if (value) {
          App.update_config(`allow_rules`, value)
          App.cmd_show(data.channel, `allow_rules`)
        }
      },
    },
    {
      name: `model`,
      on_arg: (data) => {
        let value = App.cmd_similar(data.arg, App.cmd_models)

        if (value) {
          App.update_config(`model`, value)
          App.cmd_show(data.channel, `model`)
        }
      },
    },
    {
      name: `max_prompt`,
      on_arg: (data) => {
        App.cmd_num(`max_prompt`, data)
      },
    },
    {
      name: `max_context`,
      on_arg: (data) => {
        App.cmd_num(`max_context`, data)
      },
    },
    {
      name: `max_rules`,
      on_arg: (data) => {
        App.cmd_num(`max_rules`, data)
      },
    },
    {
      name: `max_tokens`,
      on_arg: (data) => {
        App.cmd_num(`max_tokens`, data)
      },
    },
    {
      name: `report`,
      on_exact: (data) => {
        App.report_self(data.channel)
      },
    },
    {
      name: `config`,
      on_exact: (data) => {
        App.show_config(data.channel)
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
      name: `spam_limit`,
      on_arg: (data) => {
        App.cmd_num(`spam_limit`, data)
      },
    },
    {
      name: `spam_minutes`,
      on_arg: (data) => {
        App.cmd_num(`spam_minutes`, data)
      },
    },
    {
      name: `separator`,
      on_arg: (data) => {
        App.update_config(`separator`, data.arg)
        App.cmd_show(data.channel, `separator`)
      },
    },
    {
      name: `compact`,
      on_arg: (data) => {
        App.update_config(`compact`, App.bool(data.arg))
        App.cmd_show(data.channel, `compact`)
      },
    },
    {
      name: `command_char`,
      on_arg: (data) => {
        App.update_config(`command_char`, data.arg)
        App.cmd_show(data.channel, `command_char`)
      },
    },
    {
      name: `context_char`,
      on_arg: (data) => {
        App.update_config(`context_char`, data.arg)
        App.cmd_show(data.channel, `context_char`)
      },
    },
    {
      name: `mention_char`,
      on_arg: (data) => {
        App.update_config(`mention_char`, data.arg)
        App.cmd_show(data.channel, `mention_char`)
      },
    },
    {
      name: `join_char`,
      on_arg: (data) => {
        App.update_config(`join_char`, data.arg)
        App.cmd_show(data.channel, `join_char`)
      },
    },
    {
      name: `reset`,
      on_arg: (data) => {
        if (data.arg === `all`) {
          App.reset_config()
          App.cmd_done(data)
        }
        else {
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
      else if (data.is_admin) {
        allowed = true
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
      else {
        if (c.on_exact) {
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
      }

      return true
    }
  }

  App.check_commands = (from, channel, cmd) => {
    let data = {}
    data.from = from
    data.channel = channel
    data.cmd = cmd
    data.can_rules = App.is_allowed(`rules`, from)
    data.is_admin = App.is_admin(from)

    for (let c of App.commands) {
      if (App.check_command(c, data)) {
        return
      }
    }

    // Print values
    for (let c of Object.keys(App.config)) {
      let ans = App.cmd_match(c, cmd)

      if (ans.ok) {
        App.cmd_show(channel, c)
        break
      }
    }
  }
}