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
    `reset: Empty the rules`,
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
    `Start with ^: Use previous response as context`,
    `End with @nick: Make the bot mention that nick`,
  ]

  App.cmd_help = (obj, filter) => {
    let help = []

    if (obj.can_rules) {
      help.push(...App.cmd_help_rules)
    }

    if (obj.is_admin) {
      help.push(...App.cmd_help_admins)
    }

    if (filter) {
      let low = filter.toLowerCase()
      help = help.filter(x => x.includes(low))
    }

    return help
  }

  App.cmd_change_rules = (channel, rules) => {
    rules = App.limit(rules, App.config.max_rules)
    App.update_config(`rules`, rules)
    App.cmd_show(channel, `rules`)
  }

  App.cmd_respond_as = (thing) => {
    return `Respond as if you were ${thing}`
  }

  App.cmd_ur = (obj) => {
    let rules = App.cmd_respond_as(obj.arg)
    App.cmd_change_rules(obj.channel, rules)
  }

  App.cmd_num = (key, obj) => {
    if (obj.arg === `default`) {
      App.update_config(key, `default`)
      App.cmd_show(obj.channel, key)
    }
    else {
      let n = parseInt(obj.arg)

      if (!isNaN(n)) {
        if (n > 0 && n <= (10 * 1000)) {
          App.update_config(key, n)
          App.cmd_show(obj.channel, key)
        }
      }
    }
  }

  App.cmd_done = (obj) => {
    App.irc_respond(obj.channel, `Done.`)
  }

  App.commands = [
    {
      name: `help`,
      on_exact: (obj) => {
        let help = App.cmd_help(obj)

        if (help) {
          App.irc_respond(obj.channel, App.join(help))
        }
      },
      on_arg: (obj) => {
        let help = App.cmd_help(obj, obj.arg)

        if (help) {
          App.irc_respond(obj.channel, App.join(help))
        }
      },
      allow: `all`,
      limit_words: true,
    },
    {
      name: `rules`,
      on_arg: (obj) => {
        App.cmd_change_rules(obj.channel, obj.arg)
      },
      allow: `rules`,
      limit_words: false,
    },
    {
      name: `you're`,
      on_arg: (obj) => {
        App.cmd_ur(obj)
      },
      allow: `rules`,
      limit_words: false,
    },
    {
      name: `you are`,
      on_arg: (obj) => {
        App.cmd_ur(obj)
      },
      allow: `rules`,
      limit_words: false,
    },
    {
      name: `ur`,
      on_arg: (obj) => {
        App.cmd_ur(obj)
      },
      allow: `rules`,
      limit_words: false,
    },
    {
      name: `respond`,
      on_arg: (obj) => {
        App.cmd_change_rules(obj.channel, obj.cmd)
      },
      allow: `rules`,
      limit_words: false,
    },
    {
      name: `reset`,
      on_exact: (obj) => {
        App.cmd_change_rules(obj.channel, `default`)
      },
      allow: `rules`,
      limit_words: true,
    },
    {
      name: `add user`,
      on_arg: (obj) => {
        if (obj.arg.length <= App.max_user_length) {
          if (!App.is_user(obj.arg) && !App.is_admin(obj.arg)) {
            App.config.users.push(obj.arg)
            App.update_config(`users`, App.config.users)
            App.cmd_show(obj.channel, `users`)
          }
        }
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `remove user`,
      on_arg: (obj) => {
        if (App.is_user(obj.arg)) {
          let nick = obj.arg.toLowerCase()
          let users = App.config.users.map(x => x.toLowerCase()).filter(x => x !== nick)
          App.update_config(`users`, users)
          App.cmd_show(obj.channel, `users`)
        }
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `clear users`,
      on_exact: (obj) => {
        App.update_config(`users`, `default`)
        App.cmd_show(obj.channel, `users`)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `allow ask`,
      on_arg: (obj) => {
        let allowed = [`all`, `users`, `admins`, `default`]

        if (allowed.includes(obj.arg)) {
          App.update_config(`allow_ask`, obj.arg)
          App.cmd_show(obj.channel, `allow_ask`)
        }
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `allow rules`,
      on_arg: (obj) => {
        let allowed = [`all`, `users`, `admins`, `default`]

        if (allowed.includes(obj.arg)) {
          App.update_config(`allow_rules`, obj.arg)
          App.cmd_show(obj.channel, `allow_rules`)
        }
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `model`,
      on_arg: (obj) => {
        let allowed = [...App.cmd_models, `default`]

        if (allowed.includes(obj.arg)) {
          let model = obj.arg

          for (let key of App.cmd_models) {
            if (key === model) {
              model = key
              break
            }
          }

          App.update_config(`model`, model)
          App.cmd_show(obj.channel, `model`)
        }
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `max prompt`,
      on_arg: (obj) => {
        App.cmd_num(`max_prompt`, obj)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `max context`,
      on_arg: (obj) => {
        App.cmd_num(`max_context`, obj)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `max rules`,
      on_arg: (obj) => {
        App.cmd_num(`max_rules`, obj)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `max tokens`,
      on_arg: (obj) => {
        App.cmd_num(`max_tokens`, obj)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `report`,
      on_exact: (obj) => {
        App.report_self(obj.channel)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `config`,
      on_exact: (obj) => {
        App.show_config(obj.channel)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `join`,
      on_arg: (obj) => {
        App.join_channel(obj.channel, obj.arg)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `leave`,
      on_exact: (obj) => {
        App.leave_channel(obj.channel, obj.channel)
      },
      on_arg: (obj) => {
        App.leave_channel(obj.channel, obj.arg)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `temp`,
      on_arg: (obj) => {
        let allowed = [`min`, `low`, `normal`, `high`, `max`, `default`]

        if (allowed.includes(obj.arg)) {
          App.update_config(`temp`, obj.arg)
          App.cmd_show(obj.channel, `temp`)
        }
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `ban`,
      on_arg: (obj) => {
        App.antispam_ban(obj.arg)
        App.cmd_done(obj)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `unban`,
      on_arg: (obj) => {
        App.antispam_unban(obj.arg)
        App.cmd_done(obj)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `antispam limit`,
      on_arg: (obj) => {
        App.cmd_num(`antispam_limit`, obj)
      },
      allow: `admins`,
      limit_words: true,
    },
    {
      name: `antispam minutes`,
      on_arg: (obj) => {
        App.cmd_num(`antispam_minutes`, obj)
      },
      allow: `admins`,
      limit_words: true,
    },        
  ]

  App.check_command = (c, obj) => {
    let ans = App.cmd_match(c.name, obj.cmd)

    if (ans.ok) {
      if (c.allow !== `all`) {
        if (c.allow === `rules`) {
          if (!obj.can_rules) {
            return false
          }
        }
        else if (c.allow === `admins`) {
          if (!obj.is_admin) {
            return false
          }
        }
      }

      // With argument
      if (ans.arg) {
        if (!c.on_arg) {
          return false
        }

        if (c.limit_words) {
          let max_args = c.name.split(` `).length + 2

          if (obj.num_words > max_args) {
            return false
          }
        }

        obj.arg = ans.arg
        c.on_arg(obj)
      }
      // Exact match
      else {
        if (!c.on_exact) {
          return false
        }

        c.on_exact(obj)
      }

      return true
    }

    return false
  }

  App.check_commands = (from, channel, cmd) => {
    let obj = {}
    obj.from = from
    obj.channel = channel
    obj.cmd = cmd
    obj.num_words = cmd.split(` `).length
    obj.can_rules = App.is_allowed(`rules`, from)
    obj.is_admin = App.is_admin(from)

    for (let c of App.commands) {
      if (App.check_command(c, obj)) {
        return true
      }
    }

    // Print values
    for (let c of Object.keys(App.config)) {
      let ans = App.cmd_match(c.split(`_`).join(` `), cmd)

      if (ans.ok) {
        let public = [`rules`]

        if (!public.includes(c)) {
          if (!obj.is_admin) {
            return false
          }
        }

        App.cmd_show(channel, c)
        return true
      }
    }

    return false
  }
}