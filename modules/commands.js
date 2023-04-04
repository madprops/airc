// Commands from irc to the bot are checked and processed here
// If it returns true it stops the prompt to trigger a question
// Checks return true to avoid asking when cmds were meant

module.exports = function (App) {
  App.cmd_show = function (to, key) {
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
      App.update_config("rules", rules)
      App.cmd_show(to, "rules")
    }
  }

  App.check_commands = function (from, to, cmd) {

    // Commands that anybody can use:

    if (App.cmd_match("help", cmd, false)) {
      let cmds = [
        "you're [x]",
        "rules [x]",
        "users [add|remove] + [nick]",
        "allow ask [all|users|admins]",
        "allow rules [all|users|admins]",
        "model [davinci|turbo]",
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
      App.cmd_show(to, "rules")
      return true
    }

    // Ignore questions from now on

    if (cmd.endsWith("?")) {
      return false
    }

    // Commands that modify rules:

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
      App.change_rules(to, "default")
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
      App.cmd_show(to, cmd_key)
      return true
    }

    if (App.cmd_match("users add", cmd, true)) {
      if (!is_admin) { return true }
      if (num_words > 3) { return true }
      let arg = App.cmd_arg("users add", cmd)

      if (arg) {
        if (arg.length <= App.max_user_length) {
          if (!App.is_user(arg) && !App.is_admin(arg)) {
            App.config.users.push(arg)
            App.update_config("users", App.config.users)
            App.cmd_show(to, "users")
          }
        }
      }

      return true
    }

    if (App.cmd_match("users remove", cmd, true)) {
      if (!is_admin) { return true }
      if (num_words > 3) { return true }
      let arg = App.cmd_arg("users remove", cmd)

      if (arg) {
        if (App.is_user(arg)) {
          let nick = arg.toLowerCase()
          let users = App.config.users.map(x => x.toLowerCase()).filter(x => x !== nick)
          App.update_config("users", users)
          App.cmd_show(to, "users")
        }
      }

      return true
    }

    if (App.cmd_match("users default", cmd, false)) {
      if (!is_admin) { return true }
      App.update_config("users", "default")
      App.cmd_show(to, "users")
      return true
    }

    if (App.cmd_match("allow ask", cmd, true)) {
      if (!is_admin) { return true }
      if (num_words > 3) { return true }
      let arg = App.cmd_arg("allow ask", cmd)
      let allowed = ["all", "users", "admins", "default"]

      if (arg && allowed.includes(arg)) {
        App.update_config("allow_ask", arg)
        App.cmd_show(to, "allow_ask")
      }

      return true
    }

    if (App.cmd_match("allow rules", cmd, true)) {
      if (!is_admin) { return true }
      if (num_words > 3) { return true }
      let arg = App.cmd_arg("allow rules", cmd)
      let allowed = ["all", "users", "admins", "default"]

      if (arg && allowed.includes(arg)) {
        App.update_config("allow_rules", arg)
        App.cmd_show(to, "allow_rules")
      }

      return true
    }   

    if (App.cmd_match("model", cmd, true)) {
      if (!is_admin) { return true }
      if (num_words > 2) { return true }
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
        App.cmd_show(to, "model")
      }

      return true
    }

    if (App.cmd_match("max tokens", cmd, true) ||
    App.cmd_match("max prompt", cmd, true) ||
    App.cmd_match("max context", cmd, true) ||
    App.cmd_match("max rules", cmd, true)) {
      if (!is_admin) { return true }
      if (num_words > 3) { return true }       
      let two = split.slice(0, 2).join(" ")
      let key = two.split(" ").join("_")
      let arg = App.cmd_arg(two, cmd)

      if (arg === "default") {
        App.update_config(key, arg)
        App.cmd_show(to, key)
      }
      else {
        let n = parseInt(arg)
  
        if (!isNaN(n)) {
          App.update_config(key, n)
          App.cmd_show(to, key)
        }
      }

      return true
    }    

    if (App.cmd_match("report", cmd, false)) {
      if (!is_admin) { return true }
      App.report_self(to)
      return true
    }

    if (App.cmd_match("config", cmd, false)) {
      if (!is_admin) { return true }
      App.cmd_show(to, "model")
      App.cmd_show(to, "rules")
      App.cmd_show(to, "allow_ask")
      App.cmd_show(to, "allow_rules")
      App.cmd_show(to, "users")
      App.cmd_show(to, "admins")
      return true
    }

    if (App.cmd_match("join", cmd, true)) {
      if (!is_admin) { return true }
      if (num_words > 3) { return true }
      let arg = App.cmd_arg("join", cmd)

      if (arg) {
        App.irc_respond(to, "Attempting to join channel...")
        App.irc_join(arg)
      }

      return true      
    }

    if (App.cmd_match("leave", cmd, false)) {
      if (!is_admin) { return true }   
      App.irc_leave(to)
      return true      
    }    

    if (App.cmd_match("leave", cmd, true)) {
      if (!is_admin) { return true }
      if (num_words > 2) { return true }         
      let arg = App.cmd_arg("leave", cmd)
      
      if (arg) {
        App.irc_respond(to, "Leaving channel...")
        App.irc_leave(arg)
      }

      return true      
    }
  }

  return false
}