// Commands from irc to the bot are checked and processed here

module.exports = function (App) {
  App.cmd_show = function (to, title, content) {
    let res = App.irc_bold(title) + ": " + (content || "[Empty]")
    App.irc_respond(to, res)
  }

  App.cmd_done = function (to) {
    App.irc_respond(to, "Done.")
  }

  App.allow_info = function (to) {
    App.irc_respond(to, "It must be: all, users, or admins.")
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

  App.check_commands = function (from, to, cmd) {
    // Commands that anybody can use

    if (App.cmd_match("help", cmd, false)) {
      let cmds = [
        "you're [x]",
        "rules [x|clear]",
        "users [add|remove] + [nick]",
        "users clear",
        "admins",
        "report",
        "allow ask [all|users|admins]",
        "allow rules [all|users|admins]",
      ]

      App.cmd_show(to, "Commands", cmds.join(" 👾 "))
      return true
    }

    if (App.cmd_match("rules", cmd, false) || 
    App.cmd_match("who are you?", cmd, false) || 
    App.cmd_match("what are you?", cmd, false)) {
      App.cmd_show(to, "Rules", App.config.rules)
      return true
    }

    if (App.cmd_match("ping", cmd, false)) {
      App.irc_respond(to, "Pong!")
      return true
    }

    if (App.cmd_match("report", cmd, false)) {
      App.report_self(to)
      return true
    }

    // Commands that modify rules

    if (App.cmd_match("rules", cmd, true)) {
      if (!App.is_allowed("allow_rules", from)) { return }
      let arg = App.cmd_arg("rules", cmd)

      if (arg) {
        if (arg.length <= App.max_rules_length) {
          if (arg === "clear") {
            arg = ""
          }

          App.update_config("rules", arg)
          App.reset_context(to)
          App.cmd_show(to, "Rules", arg)
        }
      }

      return true
    }

    if (App.cmd_match("you're", cmd, true)) {
      if (!App.is_allowed("allow_rules", from)) { return }
      let arg = App.cmd_arg("you're", cmd)

      if (arg) {
        let rules = "Respond as if you were " + arg

        if (rules.length <= App.max_rules_length) {
          App.update_config("rules", rules)
          App.reset_context(to)
          App.cmd_show(to, "Rules", rules)
        }
      }

      return true
    }

    // Commands only admins can use

    if (App.is_admin(from)) {
      if (App.cmd_match("users", cmd, false)) {
        let s = App.config.users.join(", ")
        App.cmd_show(to, "Users", s)
        return true
      }

      if (App.cmd_match("users add", cmd, true)) {
        let arg = App.cmd_arg("users add", cmd)

        if (arg) {
          if (arg.length <= App.max_user_length) {
            if (!App.is_user(arg) && !App.is_admin(arg)) {
              App.config.users.push(arg)
              App.update_config("users", App.config.users)
              App.cmd_done(to)
            }
          }
        }

        return true
      }

      if (App.cmd_match("users remove", cmd, true)) {
        let arg = App.cmd_arg("users remove", cmd)

        if (arg) {
          if (App.is_user(arg)) {
            let nick = arg.toLowerCase()
            let users = App.config.users.map(x => x.toLowerCase()).filter(x => x !== nick)
            App.update_config("users", users)
            App.cmd_done(to)
          }
        }

        return true
      }

      if (App.cmd_match("users clear", cmd, false)) {
        App.update_config("users", [])
        App.cmd_done(to)
        return true
      }

      if (App.cmd_match("admins", cmd, false)) {
        let s = App.config.admins.join(", ")
        App.cmd_show(to, "Admins", s)
        return true
      }

      if (App.cmd_match("allow ask", cmd, true)) {
        let arg = App.cmd_arg("allow ask", cmd)

        if (arg) {
          let allowed = ["all", "users", "admins"]

          if (allowed.includes(arg)) {
            App.update_config("allow_ask", arg)
            App.cmd_done(to)
          }
          else {
            App.allow_info(to)
          }
        }

        return true
      }

      if (App.cmd_match("allow ask", cmd, false)) {
        App.cmd_show(to, "allow ask", App.config.allow_ask)
        return true
      }

      if (App.cmd_match("allow rules", cmd, true)) {
        let arg = App.cmd_arg("allow rules", cmd)

        if (arg) {
          let allowed = ["all", "users", "admins"]

          if (allowed.includes(arg)) {
            App.update_config("allow_rules", arg)
            App.cmd_done(to)
          }
          else {
            App.allow_info(to)
          }
        }

        return true
      }

      if (App.cmd_match("allow rules", cmd, false)) {
        App.cmd_show(to, "allow rules", App.config.allow_rules)
        return true
      }
    }
  }

  return false
}