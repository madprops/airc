// Commands from irc to the bot are checked and processed here
// If it returns true it stops the prompt to trigger a question
// Checks return true to avoid asking when cmds were meant

module.exports = function (App) {
  App.cmd_show = function (channel, key) {
    key = key.toLowerCase()
    let value

    if (typeof App.config[key] === "object") {
      value = App.config[key].join(", ")
    }
    else {
      value = String(App.config[key])
    }

    value = value || "(Empty)"
    let label = App.capitalize(key.replace(/_/g, " "))
    let res = App.irc_bold(label) + ": " + value
    App.irc_respond(channel, res)
  }

  App.cmd_match = function (cmd_name, full_cmd, mode) {
    cmd_name = App.escape_regex(cmd_name)

    let re

    if (mode === "arg") {
      re = new RegExp("^" + cmd_name + " ", "i")
    } else {
      re = new RegExp("^" + cmd_name + "$", "i")
    }

    return re.test(full_cmd)
  }

  App.cmd_arg = function (cmd_name, full_cmd) {
    cmd_name = App.escape_regex(cmd_name)
    let re = new RegExp("^" + cmd_name + " ", "i")
    return full_cmd.replace(re, "").trim()
  }

  App.check_commands = function (from, channel, cmd) {

    // Commands that anybody can use:

    if (App.cmd_match("help", cmd, "exact")) {
      let cmds = [
        "you're [rules]",
        "respond [rules]",
        "add user [nick]",
        "remove user [nick]",
        "allow ask [all|users|admins]",
        "allow rules [all|users|admins]",
        "model [davinci|turbo]",
        "reset",
        "report",
        "config",
      ]

      App.irc_respond(channel, cmds.join(" 👾 "))
      return true
    }

    if (App.cmd_match("ping", cmd, "exact")) {
      App.irc_respond(channel, "Pong!")
      return true
    }

    if (App.cmd_match("rules", cmd, "exact")) {
      App.cmd_show(channel, "rules")
      return true
    }

    // Commands that modify rules:

    let can_change_rules = App.is_allowed("allow_rules", from)

    if (App.cmd_match("rules", cmd, "arg")) {
      if (!can_change_rules) { return true }
      let arg = App.cmd_arg("rules", cmd)

      if (arg) {
        App.change_rules(channel, arg)
      }

      return true
    }

    if (App.cmd_match("you're", cmd, "arg")) {
      if (!can_change_rules) { return true }
      let arg = App.cmd_arg("you're", cmd)

      if (arg) {
        let rules = App.respond_as(arg)
        App.change_rules(channel, rules)
      }

      return true
    }

    if (App.cmd_match("you are", cmd, "arg")) {
      if (!can_change_rules) { return true }
      let arg = App.cmd_arg("you are", cmd)

      if (arg) {
        let rules = App.respond_as(arg)
        App.change_rules(channel, rules)
      }

      return true
    }

    if (App.cmd_match("ur", cmd, "arg")) {
      if (!can_change_rules) { return true }
      let arg = App.cmd_arg("ur", cmd)

      if (arg) {
        let rules = App.respond_as(arg)
        App.change_rules(channel, rules)
      }

      return true
    }

    if (App.cmd_match("respond", cmd, "arg")) {
      if (!can_change_rules) { return true }
      App.change_rules(channel, cmd)
      return true
    }    

    if (App.cmd_match("reset", cmd, "exact")) {
      if (!can_change_rules) { return true }
      App.change_rules(channel, "default")
      return true
    }

    // Commands only admins can use:

    let is_admin = App.is_admin(from)
    let split = cmd.split(" ")
    let cmd_key = split.join("_").toLowerCase()
    let num_words = split.length

    // Check if it matches a config
    // Print the config value
    if (Object.keys(App.config).includes(cmd_key)) {
      if (!is_admin) { return true }
      App.cmd_show(channel, cmd_key)
      return true
    }

    if (App.cmd_match("add user", cmd, "arg")) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }
      let arg = App.cmd_arg("add user", cmd)

      if (arg) {
        if (arg.length <= App.max_user_length) {
          if (!App.is_user(arg) && !App.is_admin(arg)) {
            App.config.users.push(arg)
            App.update_config("users", App.config.users)
            App.cmd_show(channel, "users")
          }
        }
      }

      return true
    }

    if (App.cmd_match("remove user", cmd, "arg")) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }
      let arg = App.cmd_arg("remove user", cmd)

      if (arg) {
        if (App.is_user(arg)) {
          let nick = arg.toLowerCase()
          let users = App.config.users.map(x => x.toLowerCase()).filter(x => x !== nick)
          App.update_config("users", users)
          App.cmd_show(channel, "users")
        }
      }

      return true
    }

    if (App.cmd_match("users default", cmd, "exact")) {
      if (!is_admin) { return true }
      App.update_config("users", "default")
      App.cmd_show(channel, "users")
      return true
    }

    if (App.cmd_match("allow ask", cmd, "arg")) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }
      let arg = App.cmd_arg("allow ask", cmd)
      let allowed = ["all", "users", "admins", "default"]

      if (arg && allowed.includes(arg)) {
        App.update_config("allow_ask", arg)
        App.cmd_show(channel, "allow_ask")
      }

      return true
    }

    if (App.cmd_match("allow rules", cmd, "arg")) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }
      let arg = App.cmd_arg("allow rules", cmd)
      let allowed = ["all", "users", "admins", "default"]

      if (arg && allowed.includes(arg)) {
        App.update_config("allow_rules", arg)
        App.cmd_show(channel, "allow_rules")
      }

      return true
    }

    if (App.cmd_match("model", cmd, "arg")) {
      if (num_words > 2) { return false }
      if (!is_admin) { return true }
      let arg = App.cmd_arg("model", cmd)
      let allowed = ["davinci", "turbo", "default"]

      if (arg && allowed.includes(arg)) {
        let model = arg

        if (arg === "davinci") {
          model = "text-davinci-003"
        }
        else if (arg === "turbo") {
          model = "gpt-3.5-turbo"
        }

        App.update_config("model", model)
        App.cmd_show(channel, "model")
      }

      return true
    }

    if (App.cmd_match("max tokens", cmd, "arg") ||
    App.cmd_match("max prompt", cmd, "arg") ||
    App.cmd_match("max context", cmd, "arg") ||
    App.cmd_match("max rules", cmd, "arg")) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }
      let two = split.slice(0, 2).join(" ")
      let key = two.split(" ").join("_")
      let arg = App.cmd_arg(two, cmd)

      if (arg === "default") {
        App.update_config(key, arg)
        App.cmd_show(channel, key)
      }
      else {
        let n = parseInt(arg)

        if (!isNaN(n)) {
          if (n > 0 && n <= (10 * 1000)) {
            App.update_config(key, n)
            App.cmd_show(channel, key)
          }
        }
      }

      return true
    }

    if (App.cmd_match("report", cmd, "exact")) {
      if (!is_admin) { return true }
      App.report_self(channel)
      return true
    }

    if (App.cmd_match("config", cmd, "exact")) {
      if (!is_admin) { return true }
      App.cmd_show(channel, "model")
      App.cmd_show(channel, "rules")
      App.cmd_show(channel, "allow_ask")
      App.cmd_show(channel, "allow_rules")
      App.cmd_show(channel, "users")
      App.cmd_show(channel, "admins")
      return true
    }

    if (App.cmd_match("join", cmd, "arg")) {
      if (num_words > 3) { return false }
      if (!is_admin) { return true }
      let arg = App.cmd_arg("join", cmd)

      if (arg) {
        App.join_channel(channel, arg)
      }

      return true
    }

    if (App.cmd_match("leave", cmd, "exact")) {
      if (!is_admin) { return true }
      App.leave_channel(channel, channel)
      return true
    }

    if (App.cmd_match("leave", cmd, "arg")) {
      if (num_words > 2) { return false }
      if (!is_admin) { return true }
      let arg = App.cmd_arg("leave", cmd)

      if (arg) {
        App.leave_channel(channel, arg)
      }

      return true
    }
  }

  return false
}