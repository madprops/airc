// Commands from irc to the bot are checked and processed here
// If it returns true it stops the prompt to trigger a question
// Checks return true to avoid asking when cmds were meant

module.exports = (App) => {
  App.cmd_info = (key) => {
    key = key.toLowerCase()
    let value

    if (typeof App.config[key] === `object`) {
      value = App.config[key].join(`, `)
    }
    else {
      value = String(App.config[key])
    }

    value = value || `(Empty)`
    let label = App.capitalize(key.replace(/_/g, ` `))
    return `${App.irc_bold(label)}: ${value}`
  }

  App.cmd_show = (channel, key) => {
    let info = App.cmd_info(key)
    App.irc_respond(channel, info)
  }

  App.cmd_match = (cmd_name, full_cmd) => {
    let arg = ``
    let ok = false
    let low_cmd = cmd_name.toLowerCase()
    let low_full = full_cmd.toLowerCase()
    let num_words = cmd_name.split(` `).length
    let full_key = full_cmd.split(` `).slice(0, num_words).join(` `)
    let low_full_key = full_key.toLowerCase()

    ok = low_full.startsWith(low_cmd)

    if (!ok) {
      // Check if it's at least similar
      let similarity = App.string_similarity(low_cmd, low_full_key)

      // The closest to 1 the more similar it has to be
      ok = similarity >= 0.8
    }

    if (ok) {
      let name = App.escape_regex(full_key)
      let re = new RegExp(`^${name}\\s*`, `i`)
      arg = full_cmd.replace(re, ``).trim()
    }

    return {ok: ok, arg: arg}
  }

  App.cmd_help_rules = [
    `you're | you are | ur | respond + [ rules ]`,
    `reset: Set rules and temp to default`,
  ]

  App.cmd_models = Object.keys(App.models)
  App.cmd_temps = Object.keys(App.temps)

  App.cmd_help_admins = [
    `add user + [ nick ]`,
    `remove user + [ nick ]`,
    `clear users`,
    `allow ask + [ all | users | admins ]`,
    `allow rules + [ all | users | admins ]`,
    `model + [ ${App.join(App.cmd_models, `|`)} ]`,
    `temp + [ ${App.join(App.cmd_temps, `|`)} ]`,
    `report: Respond with some info`,
    `config: Show some of the config`,
    `default all: Remove all overrides`,
    `Start with ^: Use previous response as context`,
    `End with @nick: Make the bot mention that nick`,
  ]

  App.cmd_help = (data) => {
    let help = []

    if (data.can_rules) {
      help.push(...App.cmd_help_rules)
    }

    if (data.is_admin) {
      help.push(...App.cmd_help_admins)
    }

    if (data.arg) {
      let low = data.arg.toLowerCase()
      help = help.filter(x => x.includes(low))
    }

    return help
  }

  App.cmd_change_rules = (data) => {
    data.arg = App.limit(data.arg, App.config.max_rules)
    App.update_config(`rules`, data.arg)
    App.cmd_show(data.channel, `rules`)
  }

  App.cmd_respond_as = (thing) => {
    return `Respond as if you were ${thing}`
  }

  App.cmd_ur = (data) => {
    data.arg = App.cmd_respond_as(data.arg)
    App.cmd_change_rules(data)
  }

  App.cmd_num = (key, data) => {
    if (data.arg === `default`) {
      App.update_config(key, `default`)
      App.cmd_show(data.channel, key)
    }
    else {
      let n = parseInt(data.arg)

      if (!isNaN(n)) {
        if (n > 0 && n <= (10 * 1000)) {
          App.update_config(key, n)
          App.cmd_show(data.channel, key)
        }
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

        if (help) {
          App.irc_respond(data.channel, App.join(help))
        }
      },
      on_arg: (data) => {
        let help = App.cmd_help(data)

        if (help) {
          App.irc_respond(data.channel, App.join(help))
        }
      },
      allow: `all`,
    },
    {
      name: `rules`,
      on_arg: (data) => {
        App.cmd_change_rules(data)
      },
      allow: `rules`,
      no_limit: true,
    },
    {
      name: `you're`,
      on_arg: (data) => {
        App.cmd_ur(data)
      },
      allow: `rules`,
      no_limit: true,
    },
    {
      name: `you are`,
      on_arg: (data) => {
        App.cmd_ur(data)
      },
      allow: `rules`,
      no_limit: true,
    },
    {
      name: `ur`,
      on_arg: (data) => {
        App.cmd_ur(data)
      },
      allow: `rules`,
      no_limit: true,
    },
    {
      name: `respond`,
      on_arg: (data) => {
        data.arg = `Respond ${data.arg}`
        App.cmd_change_rules(data)
      },
      allow: `rules`,
      no_limit: true,
    },
    {
      name: `reset`,
      on_exact: (data) => {
        App.update_config(`rules`, `default`)
        App.cmd_show(data.channel, `rules`)
        App.update_config(`temp`, `default`)
        App.cmd_show(data.channel, `temp`)
      },
      allow: `rules`,
    },
    {
      name: `temp`,
      on_arg: (data) => {
        let allowed = [`min`, `low`, `normal`, `high`, `max`, `default`]

        if (allowed.includes(data.arg)) {
          App.update_config(`temp`, data.arg)
          App.cmd_show(data.channel, `temp`)
        }
      },
      allow: `rules`,
    },
    {
      name: `add user`,
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
      name: `remove user`,
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
      name: `clear users`,
      on_exact: (data) => {
        App.update_config(`users`, `default`)
        App.cmd_show(data.channel, `users`)
      },
    },
    {
      name: `allow ask`,
      on_arg: (data) => {
        let allowed = [`all`, `users`, `admins`, `default`]

        if (allowed.includes(data.arg)) {
          App.update_config(`allow_ask`, data.arg)
          App.cmd_show(data.channel, `allow_ask`)
        }
      },
    },
    {
      name: `allow rules`,
      on_arg: (data) => {
        let allowed = [`all`, `users`, `admins`, `default`]

        if (allowed.includes(data.arg)) {
          App.update_config(`allow_rules`, data.arg)
          App.cmd_show(data.channel, `allow_rules`)
        }
      },
    },
    {
      name: `model`,
      on_arg: (data) => {
        let allowed = [...App.cmd_models, `default`]

        if (allowed.includes(data.arg)) {
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
      name: `max prompt`,
      on_arg: (data) => {
        App.cmd_num(`max_prompt`, data)
      },
    },
    {
      name: `max context`,
      on_arg: (data) => {
        App.cmd_num(`max_context`, data)
      },
    },
    {
      name: `max rules`,
      on_arg: (data) => {
        App.cmd_num(`max_rules`, data)
      },
    },
    {
      name: `max tokens`,
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
      name: `spam limit`,
      on_arg: (data) => {
        App.cmd_num(`spam_limit`, data)
      },
    },
    {
      name: `spam minutes`,
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
      name: `default all`,
      on_exact: (data) => {
        App.default_config()
        App.cmd_done(data)
      },
    },
  ]

  App.check_command = (c, data) => {
    let ans = App.cmd_match(c.name, data.cmd)

    if (ans.ok) {
      if (c.allow === `all`) {
        // Anybody can use this command
      }
      else if (c.allow === `rules`) {
        if (!data.can_rules) {
          return false
        }
      }
      else if (!data.is_admin) {
        return false
      }

      // With argument
      if (ans.arg) {
        if (!c.on_arg) {
          return false
        }

        // Ignore commands that are too long
        // Except on commands like rules changes
        if (!c.no_limit) {
          let max_args = c.name.split(` `).length + 2

          if (data.num_words > max_args) {
            return false
          }
        }

        data.arg = ans.arg
        c.on_arg(data)
      }
      // Exact match
      else {
        if (!c.on_exact) {
          return false
        }

        c.on_exact(data)
      }

      return true
    }

    return false
  }

  App.check_commands = (from, channel, cmd) => {
    let data = {}
    data.from = from
    data.channel = channel
    data.cmd = cmd
    data.num_words = cmd.split(` `).length
    data.can_rules = App.is_allowed(`rules`, from)
    data.is_admin = App.is_admin(from)

    for (let c of App.commands) {
      if (App.check_command(c, data)) {
        return true
      }
    }

    // Print values
    for (let c of Object.keys(App.config)) {
      let ans = App.cmd_match(c.split(`_`).join(` `), cmd)

      if (ans.ok) {
        let public = [`rules`]
        let rules = [`temp`]

        if (public.includes(c)) {
          // Anybody can see this value
        }
        else if (rules.includes(c)) {
          if (!data.can_rules) {
            return false
          }
        }
        else if (!data.is_admin) {
          return false
        }

        App.cmd_show(channel, c)
        return true
      }
    }

    return false
  }
}