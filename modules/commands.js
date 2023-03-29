// Commands from irc to the bot are checked and processed here

module.exports = function (App) {
  App.check_commands = function (from, to, prompt) {
    let cmd = prompt.replace(App.config.commands_prefix, "")

    // Commands anybody can use

    if (cmd === "help") {
      let p = App.config.commands_prefix

      let cmds = [
        `${p}ur [x]`,
        `${p}instructions [x|clear]`,
        `${p}reset`,
        `${p}autorespond [0-100]`,
        `${p}allow_ask [all|admins|owners]`,
        `${p}allow_mod [all|admins|owners]`,
        `${p}admins [add|remove][nick]`,
        `${p}admins clear`,
        `${p}owners`,
      ]

      App.irc_client.say(to, `${App.bold_text("Commands")}: ` + cmds.join(" 👾 "))
      return
    }
    
    if (cmd === "instructions") {
      App.irc_client.say(to, `${App.bold_text("Instructions")}: ` + (App.config.instructions || "[Empty]"))
      return
    } 

    // Functions that modify instructions

    if (cmd.startsWith("instructions ")) {
      if (!App.is_allowed("allow_mod", from)) { return }       
      let arg = cmd.replace(/^\instructions /, "").trim()
      
      if (arg) {
        if (arg.length <= App.max_instructions_length) {
          if (arg === "clear") {
            arg = ""
          }

          App.update_config("instructions", arg)
          App.irc_client.say(to, `${App.bold_text("Instructions")} have been set to: ` + (arg || "[Empty]"))
        }
      }

      return
    } 
    
    if (cmd.startsWith("ur ")) { 
      if (!App.is_allowed("allow_mod", from)) { return }                      
      let arg = cmd.replace(/^\ur /, "").trim()

      if (arg) {
        let ins = `Please respond as if you were ${arg}`

        if (ins.length <= App.max_instructions_length) {  
          App.update_config("instructions", ins)              
          App.irc_client.say(to, `${App.bold_text("Instructions")} have been set to: ` + ins)
        }
      }

      return
    }    
    
    if (cmd === "reset") {
      if (!App.is_allowed("allow_mod", from)) { return }       
      App.update_config("instructions", "")
      App.irc_client.say(to, `${App.bold_text("Instructions")} have been set to: [Empty]`)
      return
    }      

    // admins + owners

    if (App.is_operator(from)) {  
      if (cmd === "autorespond") {
        App.irc_client.say(to, `${App.bold_text("Autorespond")}: ` + App.config.autorespond)
        return
      }          

      if (cmd.startsWith("autorespond ")) {
        let arg = cmd.replace(/^\autorespond /, "").trim()
        let n = parseInt(arg)

        if (!isNaN(n) && n >= 0 && n <= 100) {
          App.update_config("autorespond", n)
          App.irc_client.say(to, `${App.bold_text("Autorespond")} has been set to: ` + n)
        }

        return
      }
    }

    // Only owners

    if (App.is_owner(from)) {
      if (cmd === "admins") {
        let s = App.config.admins.join(", ")
        App.irc_client.say(to, `${App.bold_text("Admins")}: ` + (s || "No admins yet"))
        return
      }            
  
      if (cmd.startsWith("admins add ")) {
        let arg = cmd.replace(/^\admins add /, "").trim()
  
        if (arg) {
          if (arg.length <= App.max_admin_length) {
            if (!App.is_operator(arg)) {
              App.config.admins.push(arg)
              App.update_config("admins", App.config.admins)
              App.irc_client.say(to, "Done.")
            }
          }
        }

        return
      }

      if (cmd.startsWith("admins remove ")) {
        let arg = cmd.replace(/^\admins remove /, "").trim()
  
        if (arg) {
          if (App.is_admin(arg)) {
            let nick = arg.toLowerCase()
            let admins = App.config.admins.map(x => x.toLowerCase()).filter(x => x !== nick)
            App.update_config("admins", admins)
            App.irc_client.say(to, "Done.")
          }
        }

        return
      }  

      if (cmd ===  "admins clear") {
        App.update_config("admins", [])
        App.irc_client.say(to, "Done.")
        return
      }    

      if (cmd ===  "owners") {
        let s = App.config.owners.join(", ")
        App.irc_client.say(to, `${App.bold_text("Owners")}: ` + (s || "No owners yet"))
        return
      }   
      
      if (cmd.startsWith("allow_ask ")) {
        let arg = cmd.replace(/^\allow_ask /, "").trim()
  
        if (arg) {
          let allowed = ["all", "admins", "owners"]
  
          if (allowed.includes(arg)) {
            App.update_config("allow_ask", arg)
            App.irc_client.say(to, "Done.")
          }
          else {
            App.irc_client.say(to, "It must be: all, admins, or owners.")
          }
        }

        return
      }  
      
      if (cmd ===  "allow_ask") {
        App.irc_client.say(to, `${App.bold_text("allow_ask")}: ` + App.config.allow_ask)
        return
      } 
      
      if (cmd.startsWith("allow_mod ")) {
        let arg = cmd.replace(/^\allow_mod /, "").trim()
  
        if (arg) {
          let allowed = ["all", "admins", "owners"]
  
          if (allowed.includes(arg)) {
            App.update_config("allow_mod", arg)
            App.irc_client.say(to, "Done.")
          }
          else {
            App.irc_client.say(to, "It must be: all, admins, or owners.")
          }
        }

        return
      }

      if (cmd ===  "allow_mod") {
        App.irc_client.say(to, `${App.bold_text("allow_mod")}: ` + App.config.allow_mod)
        return
      }
    }  
  }
}