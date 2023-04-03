// Commands from irc to the bot are checked and processed here
// If it returns true it stops the prompt to trigger a question
// Checks return true to avoid asking when cmds were meant

module.exports = function (App) {
  App.cmd_show = function (to, title, key) {
    let value = (App.config[key] || "[Empty]")
    let res = App.irc_bold(title) + ": " + value
    App.irc_respond(to, res)
  }

  App.cmd_match = function (s, cmd, args = false) {
    let re
    s = App.escape_regex(s)

    if (args) {
      re = new RegExp("^" + s + " ", "i")
    } else {
      re = new RegExp("^" + s + "$", "i")
    }

    return re.test(cmd)
  }

  App.cmd_arg = function (s, cmd) {
    s = App.escape_regex(s)
    let re = new RegExp("^" + s + " ", "i")
    return cmd.replace(re, "").trim()
  }

  App.change_rules = function (to, rules) {
    if (rules.length <= App.config.max_rules) {
      if (rules === "clear") {
        rules = ""
      }

      App.update_config("rules", rules)
      App.show_rules(to)
    }
  }

  App.show_admins = function (to) {
    let s = App.config.admins.join(", ")
    App.cmd_show(to, "Admins", "admins")
  }

  App.show_users = function (to) {
    let s = App.config.users.join(", ")
    App.cmd_show(to, "Users", "users")
  }

  App.show_allow_ask = function (to) {
    App.cmd_show(to, "allow ask", "allow_ask")
  }

  App.show_allow_rules = function (to) {
    App.cmd_show(to, "allow rules", "allow_rules")
  }

  App.show_rules = function (to) {
    App.cmd_show(to, "Rules", "rules")
  }

  App.show_model = function (to) {
    App.cmd_show(to, "Model", "model")
  }

  App.check_commands = function (from, to, cmd) {

    // Commands that anybody can use

    if (App.cmd_match("help", cmd, false)) {
      let cmds = [
        "you're [x]",
        "rules [x|clear]",
        "users [add|remove] + [nick]",
        "allow ask [all|users|admins]",
        "allow rules [all|users|admins]",
        "model [davinci|turbo]",
        "users clear",
        "reset",
        "admins",
        "report",
        "config",
        "ping",
      ]

      App.irc_respond(to, cmds.join(" 👾 "))
      return true
    }

    if (App.cmd_match("ping", cmd, false)) {
      App.irc_respond(to, "Pong!")
      return true
    }

    if (App.cmd_match("rules", cmd, false) ||
    App.cmd_match("who are you?", cmd, false) ||
    App.cmd_match("what are you?", cmd, false)) {
      App.show_rules(to)
      return true
    }

    // Ignore questions from now on

    if (cmd.endsWith("?")) {
      return false
    }

    // Commands that modify rules

    let can_change_rules = App.is_allowed("allow_rules", from)

    if (App.cmd_match("rules", cmd, true)) {
      if (!can_change_rules) { return true }
      let arg = App.cmd_arg("rules", cmd)

      if (arg) {
        App.change_rules(to, arg)
      }

      return true
    }

    if (App.cmd_match("you're", cmd, true)) {
      if (!can_change_rules) { return true }
      let arg = App.cmd_arg("you're", cmd)

      if (arg) {
        let rules = "Respond as if you were " + arg
        App.change_rules(to, rules)
      }

      return true
    }

    if (App.cmd_match("you are", cmd, true)) {
      if (!can_change_rules) { return true }
      let arg = App.cmd_arg("you are", cmd)

      if (arg) {
        let rules = "Respond as if you were " + arg
        App.change_rules(to, rules)
      }

      return true
    }

    if (App.cmd_match("ur", cmd, true)) {
      if (!can_change_rules) { return true }
      let arg = App.cmd_arg("ur", cmd)

      if (arg) {
        let rules = "Respond as if you were " + arg
        App.change_rules(to, rules)
      }

      return true
    }

    if (App.cmd_match("reset", cmd, false)) {
      if (!can_change_rules) { return true }
      App.change_rules(to, "clear")
      return true
    }

    // Commands only admins can use

    let is_admin = App.is_admin(from)

    if (App.cmd_match("users", cmd, false)) {
      if (!is_admin) { return false }
      App.show_users(to)
      return true
    }

    if (App.cmd_match("users add", cmd, true)) {
      if (!is_admin) { return false }
      let arg = App.cmd_arg("users add", cmd)

      if (arg) {
        if (arg.length <= App.max_user_length) {
          if (!App.is_user(arg) && !App.is_admin(arg)) {
            App.config.users.push(arg)
            App.update_config("users", App.config.users)
            App.show_users(to)
          }
        }
      }

      return true
    }

    if (App.cmd_match("users remove", cmd, true)) {
      if (!is_admin) { return false }
      let arg = App.cmd_arg("users remove", cmd)

      if (arg) {
        if (App.is_user(arg)) {
          let nick = arg.toLowerCase()
          let users = App.config.users.map(x => x.toLowerCase()).filter(x => x !== nick)
          App.update_config("users", users)
          App.show_users(to)
        }
      }

      return true
    }

    if (App.cmd_match("users clear", cmd, false)) {
      if (!is_admin) { return false }
      App.update_config("users", [])
      App.show_users(to)
      return true
    }

    if (App.cmd_match("admins", cmd, false)) {
      if (!is_admin) { return false }
      App.show_admins(to)
      return true
    }

    if (App.cmd_match("allow ask", cmd, true)) {
      if (!is_admin) { return false }
      let arg = App.cmd_arg("allow ask", cmd)
      let allowed = ["all", "users", "admins", "default"]

      if (arg && allowed.includes(arg)) {
        App.update_config("allow_ask", arg)
        App.show_allow_ask(to)
      }

      return true
    }

    if (App.cmd_match("allow ask", cmd, false)) {
      if (!is_admin) { return false }
      App.show_allow_ask(to)
      return true
    }

    if (App.cmd_match("allow rules", cmd, true)) {
      if (!is_admin) { return false }
      let arg = App.cmd_arg("allow rules", cmd)
      let allowed = ["all", "users", "admins", "default"]

      if (arg && allowed.includes(arg)) {
        App.update_config("allow_rules", arg)
        App.show_allow_rules(to)
      }

      return true
    }

    if (App.cmd_match("allow rules", cmd, false)) {
      if (!is_admin) { return false }
      App.show_allow_rules(to)
      return true
    }

    if (App.cmd_match("model", cmd, false)) {
      if (!is_admin) { return false }
      App.show_model(to)
      return true
    }

    if (App.cmd_match("model", cmd, true)) {
      if (!is_admin) { return false }
      let arg = App.cmd_arg("model", cmd)
      let allowed = ["davinci", "turbo"]

      if (arg && allowed.includes(arg)) {
        if (arg === "davinci") {
          App.update_config("model", "text-davinci-003")
          App.show_model(to)
        }
        else if (arg === "turbo") {
          App.update_config("model", "gpt-3.5-turbo")
          App.show_model(to)
        }
      }

      return true
    }

    if (App.cmd_match("report", cmd, false)) {
      if (!is_admin) { return false }
      App.report_self(to)
      return true
    }

    if (App.cmd_match("config", cmd, false)) {
      if (!is_admin) { return false }
      App.show_model(to)
      App.show_rules(to)
      App.show_allow_ask(to)
      App.show_allow_rules(to)
      App.show_users(to)
      App.show_admins(to)
      return true
    }
  }

  return false
}