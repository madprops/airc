// Commands from irc to the bot are checked and processed here

module.exports = function (App) {
  App.cmd_respond = function (to, title, content) {
    let res = App.bold(title) + ": " + (content || "[Empty]")
    App.irc_respond(to, res)
  }

  App.cmd_done = function (to) {
    App.irc_respond(to, "Done.")
  }

  App.allow_info = function (to) {
    App.irc_respond(to, "It must be: all, users, or admins.")
  }

  App.check_commands = function (from, to, prompt) {
    let cmd = prompt.replace(App.config.prefix, "")
    
    if (!cmd) {
      return
    }
    
    // Commands anybody can use

    if (cmd === "help") {
      let p = App.config.prefix

      let cmds = [
        p + "ur [x]",
        p + "rules [x|clear]",
        p + "users [add|remove][nick]",
        p + "users clear",
        p + "admins",
        p + "who",
        p + "allow_ask [all|users|admins]",
        p + "allow_modify [all|users|admins]",
        "Use ^ to reference the message above",
      ]

      App.cmd_respond(to, "Commands", cmds.join(" 👾 "))
      return
    }
    
    if (cmd === "rules") {
      App.cmd_respond(to, "Rules", App.config.rules)
      return
    } 

    if (cmd === "ping") {
      App.irc_respond(to, "Pong!")
      return
    }

    if (cmd === "who") {
      App.report_self(to)
      return
    }      

    // Commands that modify rules

    if (cmd.startsWith("rules ")) {
      if (!App.is_allowed("allow_modify", from)) { return }       
      let arg = cmd.replace("rules ", "").trim()
      
      if (arg) {
        if (arg.length <= App.max_rules_length) {
          if (arg === "clear") {
            arg = ""
          }

          App.update_config("rules", arg)
          App.cmd_respond(to, "Rules", arg)
        }
      }

      return
    } 
    
    if (cmd.startsWith("ur ")) { 
      if (!App.is_allowed("allow_modify", from)) { return }                      
      let arg = cmd.replace("ur ", "").trim()

      if (arg) {
        let rules = "Respond as if you were " + arg

        if (rules.length <= App.max_rules_length) {  
          App.update_config("rules", rules)              
          App.cmd_respond(to, "Rules", rules)
        }
      }

      return
    }         

    // admins only

    if (App.is_admin(from)) {
      if (cmd === "users") {
        let s = App.config.users.join(", ")
        App.cmd_respond(to, "Users", s)
        return
      }            
  
      if (cmd.startsWith("users add ")) {
        let arg = cmd.replace("users add ", "").trim()
  
        if (arg) {
          if (arg.length <= App.max_user_length) {
            if (!App.is_user(arg) && !App.is_admin(arg)) {
              App.config.users.push(arg)
              App.update_config("users", App.config.users)
              App.cmd_done(to)
            }
          }
        }

        return
      }

      if (cmd.startsWith("users remove ")) {
        let arg = cmd.replace("users remove ", "").trim()
  
        if (arg) {
          if (App.is_user(arg)) {
            let nick = arg.toLowerCase()
            let users = App.config.users.map(x => x.toLowerCase()).filter(x => x !== nick)
            App.update_config("users", users)
            App.cmd_done(to)
          }
        }

        return
      }  

      if (cmd ===  "users clear") {
        App.update_config("users", [])
        App.cmd_done(to)
        return
      }    

      if (cmd ===  "admins") {
        let s = App.config.admins.join(", ")
        App.cmd_respond(to, "Admins", s)
        return
      }    
      
      if (cmd.startsWith("allow_ask ")) {
        let arg = cmd.replace("allow_ask ", "").trim()
  
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

        return
      }  
      
      if (cmd ===  "allow_ask") {
        App.cmd_respond(to, "allow_ask", App.config.allow_ask)
        return
      } 
      
      if (cmd.startsWith("allow_modify ")) {
        let arg = cmd.replace("allow_modify ", "").trim()
  
        if (arg) {
          let allowed = ["all", "users", "admins"]
  
          if (allowed.includes(arg)) {
            App.update_config("allow_modify", arg)
            App.cmd_done(to)
          }
          else {
            App.allow_info(to)
          }
        }

        return
      }

      if (cmd ===  "allow_modify") {
        App.cmd_respond(to, "allow_modify", App.config.allow_modify)
        return
      }
    }  
  }
}