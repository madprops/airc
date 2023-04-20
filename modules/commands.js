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

  App.cmd_match = (cmd_name, full_cmd) => {
    let ok = false
    let arg = ""

    if (full_cmd.startsWith(cmd_name)) {
      ok = true
    }

    if (ok) {
      let name = App.escape_regex(cmd_name)
      let re = new RegExp(`^${name}\\s*`, `i`)
      arg = full_cmd.replace(re, ``).trim()
    }

    return {ok: ok, arg: arg}
  }

  App.cmd_models = Object.keys(App.models)

  let p = App.config.prefix

  App.cmd_help_rules = [
    `${p}ur + [ personality ]`,
    `${p}rules: [ rules ]`,
  ]

  App.cmd_help_admins = [
    `${p}add_user + [ nick ]`,
    `${p}remove_user + [ nick ]`,
    `${p}allow_ask + [ all | users | admins ]`,
    `${p}allow_rules + [ all | users | admins ]`,
    `${p}model + [ ${App.join(App.cmd_models, `|`)} ]`,
    `${p}prefix + [ char ]`,
    `${p}separator + [ emoji ]`,
    `${p}compact + [ true | false ]`,
    `${p}max_prompt [ number ]`,
    `${p}max_context [ number ]`,
    `${p}max_rules [ number ]`,
    `${p}max_tokens [ number ]`,
    `${p}join + [ channel ]`,
    `${p}leave + [ channel? ]`,
    `${p}ban + [ nick ]`,
    `${p}unban + [ nick ]`,
    `${p}spam_limit + [ number ]`,
    `${p}spam_minutes + [ number ]`,
    `${p}report: Respond with some info`,
    `${p}config: Show some of the config`,
    `${p}reset + [ config | all ]: Reset configs to default`,
  ]

  App.cmd_help_all = [
    `Start with ^: Use previous response as context`,
    `End with @nick: Make the bot mention that nick`,
    `Repo: github.com/madprops/airc`,
  ]

  App.cmd_help = (data) => {
    let help = []

    if (data.can_rules) {
      help.push(...App.cmd_help_rules)
    }

    if (data.is_admin) {
      help.push(...App.cmd_help_admins)
    }

    help.push(...App.cmd_help_all)

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

        if (allowed.includes(data.arg)) {
          App.update_config(`allow_ask`, data.arg)
          App.cmd_show(data.channel, `allow_ask`)
        }
      },
    },
    {
      name: `allow_rules`,
      on_arg: (data) => {
        let allowed = [`all`, `users`, `admins`]

        if (allowed.includes(data.arg)) {
          App.update_config(`allow_rules`, data.arg)
          App.cmd_show(data.channel, `allow_rules`)
        }
      },
    },
    {
      name: `model`,
      on_arg: (data) => {
        if (App.cmd_models.includes(data.arg)) {
          let model = data.arg

          for (let key of App.cmd_models) {
            if (key === model) {
              model = key
              break
            }
          }

          App.update_config(`model`, model)
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
      name: `prefix`,
      on_arg: (data) => {
        App.update_config(`prefix`, data.arg)
        App.cmd_show(data.channel, `prefix`)
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

      if (allowed) {
        // With argument
        if (ans.arg) {
          if (c.on_arg) {
            data.arg = ans.arg
            c.on_arg(data)
          }
          else {
            return false
          }
        }
        // Exact match
        else {
          if (c.on_exact) {
            c.on_exact(data)
          }
          else {
            return false
          }
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
      let ans = App.cmd_match(c.split(`_`).join(` `), cmd)

      if (ans.ok) {
        let allowed = false
        let public = [`rules`]

        if (public.includes(c)) {
          allowed = true
        }
        else if (data.is_admin) {
          allowed = true
        }

        if (allowed) {
          App.cmd_show(channel, c)
        }

        break
      }
    }
  }
}