// Commands from irc to the bot are checked and processed here

module.exports = function (App) {
  App.check_commands = function (from, to, prompt) {
    let cmd = prompt.replace(App.config.prefix, "")
    
    if (!cmd) {
      return
    }
    
    let colon = ": "

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

      App.irc_client.say(to, App.bold("Commands") + colon + cmds.join(" 👾 "))
      return
    }
    
    if (cmd === "rules") {
      App.irc_client.say(to, App.bold("Rules") + colon + (App.config.rules || "[Empty]"))
      return
    } 

    if (cmd === "ping") {
      App.irc_client.say(to, "Pong!")
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
          App.irc_client.say(to, App.bold("Rules") + colon + (arg || "[Empty]"))
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
          App.irc_client.say(to, App.bold("Rules") + colon + rules)
        }
      }

      return
    }         

    // admins only

    if (App.is_admin(from)) {
      if (cmd === "users") {
        let s = App.config.users.join(", ")
        App.irc_client.say(to, App.bold("Users") + colon + (s || "[Empty]"))
        return
      }            
  
      if (cmd.startsWith("users add ")) {
        let arg = cmd.replace("users add ", "").trim()
  
        if (arg) {
          if (arg.length <= App.max_user_length) {
            if (!App.is_user(arg) && !App.is_admin(arg)) {
              App.config.users.push(arg)
              App.update_config("users", App.config.users)
              App.irc_client.say(to, "Done.")
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
            App.irc_client.say(to, "Done.")
          }
        }

        return
      }  

      if (cmd ===  "users clear") {
        App.update_config("users", [])
        App.irc_client.say(to, "Done.")
        return
      }    

      if (cmd ===  "admins") {
        let s = App.config.admins.join(", ")
        App.irc_client.say(to, App.bold("Admins") + colon + (s || "[Empty]"))
        return
      }    
      
      if (cmd.startsWith("allow_ask ")) {
        let arg = cmd.replace("allow_ask ", "").trim()
  
        if (arg) {
          let allowed = ["all", "users", "admins"]
  
          if (allowed.includes(arg)) {
            App.update_config("allow_ask", arg)
            App.irc_client.say(to, "Done.")
          }
          else {
            App.irc_client.say(to, "It must be: all, users, or admins.")
          }
        }

        return
      }  
      
      if (cmd ===  "allow_ask") {
        App.irc_client.say(to, App.bold("allow_ask") + colon + App.config.allow_ask)
        return
      } 
      
      if (cmd.startsWith("allow_modify ")) {
        let arg = cmd.replace("allow_modify ", "").trim()
  
        if (arg) {
          let allowed = ["all", "users", "admins"]
  
          if (allowed.includes(arg)) {
            App.update_config("allow_modify", arg)
            App.irc_client.say(to, "Done.")
          }
          else {
            App.irc_client.say(to, "It must be: all, users, or admins.")
          }
        }

        return
      }

      if (cmd ===  "allow_modify") {
        App.irc_client.say(to, App.bold("allow_modify") + colon + App.config.allow_modify)
        return
      }
    }  
  }
}