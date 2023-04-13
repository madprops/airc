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

  App.cmd_match = (cmd_name, full_cmd, mode) => {
    let arg = ``
    let match = false
    let low_cmd = cmd_name.toLowerCase()
    let low_full = full_cmd.toLowerCase()
    let num_words_1 = cmd_name.split(` `).length
    let num_words_2 = full_cmd.split(` `).length
    let full_key = full_cmd.split(` `).slice(0, num_words_1).join(` `)
    let low_full_key = full_key.toLowerCase()

    if (mode === `exact`) {
      if (num_words_1 === num_words_2) {
        match = low_cmd === low_full
      }
    }
    else if (mode === `arg`) {
      if (num_words_1 < num_words_2) {
        match = low_cmd === low_full_key
      }
    }

    if (!match) {
      // Check if it's at least similar
      let similarity = App.string_similarity(low_cmd, low_full_key)

      // The closest to 1 the more similar it has to be
      if (similarity >= 0.8) {
        if (mode === `exact`) {
          if (num_words_1 === num_words_2) {
            match = true
          }
        }
        else if (mode === `arg`) {
          if (num_words_1 < num_words_2) {
            match = true
          }
        }
      }
    }

    if (match && mode === `arg`) {
      let name = App.escape_regex(full_key)
      let re = new RegExp(`^${name} `, `i`)
      arg = full_cmd.replace(re, ``).trim()
    }

    return [match, arg]
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

  App.cmd_help = (can_rules, is_admin, filter = ``) => {
    let help = []

    if (can_rules) {
      help.push(...App.cmd_help_rules)
    }

    if (is_admin) {
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

  App.check_commands = (from, channel, cmd) => {
    let split = cmd.split(` `)
    let num_words = split.length
    let cmd_key = split.join(`_`).toLowerCase()
    let can_rules = App.is_allowed(`rules`, from)
    let is_admin = App.is_admin(from)
    let ans

    // Commands that anybody can use:

    if (App.cmd_match(`help`, cmd, `exact`)[0]) {
      let help = App.cmd_help(can_rules, is_admin)

      if (help) {
        App.irc_respond(channel, App.join(help))
      }

      return true
    }

    ans = App.cmd_match(`help`, cmd, `arg`)

    if (ans[0]) {
      if (num_words > 3) { return false }
      let help = App.cmd_help(can_rules, is_admin, ans[1])

      if (help) {
        App.irc_respond(channel, App.join(help))
      }

      return true
    }

    ans = App.cmd_match(`rules`, cmd, `exact`)

    if (ans[0]) {
      App.cmd_show(channel, `rules`)
      return true
    }

    // Commands that modify rules:

    ans = App.cmd_match(`rules`, cmd, `arg`)

    if (ans[0]) {
      if (!can_rules) { return false }
      App.cmd_change_rules(channel, ans[1])
      return true
    }

    for (let c of [`you're`, `you are`, `ur`]) {
      ans = App.cmd_match(c, cmd, `arg`)

      if (ans[0]) {
        if (!can_rules) { return false }
        let rules = App.cmd_respond_as(ans[1])
        App.cmd_change_rules(channel, rules)
        return true
      }
    }

    ans = App.cmd_match(`respond`, cmd, `arg`)

    if (ans[0]) {
      if (!can_rules) { return false }
      App.cmd_change_rules(channel, cmd)
      return true
    }

    ans = App.cmd_match(`reset`, cmd, `exact`)

    if (ans[0]) {
      if (!can_rules) { return false }
      App.cmd_change_rules(channel, `default`)
      return true
    }

    // Commands only admins can use:

    // Check if it matches a config and print its value
    for (let c of Object.keys(App.config)) {
      ans = App.cmd_match(c.split("_").join(" "), cmd, `exact`)
      
      if (ans[0]) {
        if (!is_admin) { return true }
        App.cmd_show(channel, c)
        return true
      }
    }

    ans = App.cmd_match(`add user`, cmd, `arg`)

    if (ans[0]) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }

      if (ans[1].length <= App.max_user_length) {
        if (!App.is_user(ans[1]) && !App.is_admin(ans[1])) {
          App.config.users.push(ans[1])
          App.update_config(`users`, App.config.users)
          App.cmd_show(channel, `users`)
        }
      }

      return true
    }

    ans = App.cmd_match(`remove user`, cmd, `arg`)

    if (ans[0]) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }

      if (App.is_user(ans[1])) {
        let nick = ans[1].toLowerCase()
        let users = App.config.users.map(x => x.toLowerCase()).filter(x => x !== nick)
        App.update_config(`users`, users)
        App.cmd_show(channel, `users`)
      }

      return true
    }

    ans = App.cmd_match(`clear users`, cmd, `exact`)

    if (ans[0]) {
      if (!is_admin) { return true }
      App.update_config(`users`, `default`)
      App.cmd_show(channel, `users`)
      return true
    }    

    ans = App.cmd_match(`allow ask`, cmd, `arg`)

    if (ans[0]) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }
      let allowed = [`all`, `users`, `admins`, `default`]

      if (allowed.includes(ans[1])) {
        App.update_config(`allow_ask`, ans[1])
        App.cmd_show(channel, `allow_ask`)
      }

      return true
    }

    ans = App.cmd_match(`allow rules`, cmd, `arg`)

    if (ans[0]) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }
      let allowed = [`all`, `users`, `admins`, `default`]

      if (allowed.includes(ans[1])) {
        App.update_config(`allow_rules`, ans[1])
        App.cmd_show(channel, `allow_rules`)
      }

      return true
    }

    ans = App.cmd_match(`model`, cmd, `arg`)

    if (ans[0]) {
      if (num_words > 2) { return false }
      if (!is_admin) { return true }
      let allowed = [...App.cmd_models, `default`]

      if (allowed.includes(ans[1])) {
        let model = ans[1]

        for (let key of App.cmd_models) {
          if (key === model) {
            model = key
            break
          }
        }

        App.update_config(`model`, model)
        App.cmd_show(channel, `model`)
      }

      return true
    }

    for (let c of [`max tokens`, `max prompt`, `max context`, `max rules`]) {
      ans = App.cmd_match(c, cmd, `arg`)

      if (ans[0]) {
        if (num_words > 3) { return false }
        if (!is_admin) { return true }
        let two = split.slice(0, 2).join(` `)
        let key = two.split(` `).join(`_`)
  
        if (ans[1] === `default`) {
          App.update_config(key, ans[1])
          App.cmd_show(channel, key)
        }
        else {
          let n = parseInt(ans[1])
  
          if (!isNaN(n)) {
            if (n > 0 && n <= (10 * 1000)) {
              App.update_config(key, n)
              App.cmd_show(channel, key)
            }
          }
        }
  
        return true
      }
    }

    ans = App.cmd_match(`report`, cmd, `exact`)

    if (ans[0]) {
      if (!is_admin) { return true }
      App.report_self(channel)
      return true
    }

    ans = App.cmd_match(`config`, cmd, `exact`)
    if (ans[0]) {
      if (!is_admin) { return true }
      App.show_config(channel)
      return true
    }

    ans = App.cmd_match(`join`, cmd, `arg`)

    if (ans[0]) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }
      App.join_channel(channel, ans[1])
      return true
    }

    ans = App.cmd_match(`leave`, cmd, `exact`)

    if (ans[0]) {
      if (!is_admin) { return true }
      App.leave_channel(channel, channel)
      return true
    }

    ans = App.cmd_match(`leave`, cmd, `arg`)

    if (ans[0]) {
      if (num_words > 2) { return false }
      if (!is_admin) { return true }
      App.leave_channel(channel, ans[1])
      return true
    }

    ans = App.cmd_match(`temp`, cmd, `arg`)

    if (ans[0]) {
      if (num_words > 2) { return false }
      if (!is_admin) { return true }
      let allowed = [`min`, `low`, `normal`, `high`, `max`, `default`]

      if (allowed.includes(ans[1])) {
        App.update_config(`temp`, ans[1])
        App.cmd_show(channel, `temp`)
      }

      return true
    }
  }

  return false
}