// Commands from irc to the bot are checked and processed here

module.exports = function (App) {
  App.check_commands = function (from, to, prompt) {
    let cmd = prompt.replace(App.config.commands_prefix, "")

    if (cmd === "help") {
      let p = App.config.commands_prefix

      let cmds = [
        `${p}instructions [x|clear]`,
        `${p}autorespond [0-100]`,
        `${p}ur [x]`,
        `${p}admins [add|remove] [x]`,
        `${p}admins clear`,
        `${p}owners`,
        `${p}reset`
      ]

      App.irc_client.say(to, `${App.bold_text("Commands")}: ` + cmds.join(" 👾 "))
    }          

    else if (cmd.startsWith("instructions ")) {
      if (!App.is_allowed("allow_mod", from)) {
        return
      }

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
    } 
    
    else if (cmd === "instructions") {
      App.irc_client.say(to, `${App.bold_text("Instructions")}: ` + (App.config.instructions || "[Empty]"))
    } 
    
    if (cmd === "reset") {
      if (!App.is_allowed("allow_mod", from)) {
        return
      }

      App.update_config("instructions", "")
      App.irc_client.say(to, `${App.bold_text("Instructions")} have been set to: [Empty]`)
    }  
    
    else if (cmd.startsWith("ur ")) {
      if (!App.is_allowed("allow_mod", from)) {
        return
      }
                
      let arg = cmd.replace(/^\ur /, "").trim()

      if (arg) {
        let ins = `Please respond as if you were ${arg}`

        if (ins.length <= App.max_instructions_length) {  
          App.update_config("instructions", ins)              
          App.irc_client.say(to, `${App.bold_text("Instructions")} have been set to: ` + ins)
        }
      }
    }        
    
    // Operator only commands

    if (App.is_operator(from)) {  
      if (cmd === "autorespond") {
        App.irc_client.say(to, `${App.bold_text("Autorespond")}: ` + App.config.autorespond)
      }          

      else if (cmd.startsWith("autorespond ")) {
        let arg = cmd.replace(/^\autorespond /, "").trim()
        let n = parseInt(arg)

        if (!isNaN(n) && n >= 0 && n <= 100) {
          App.update_config("autorespond", n)
          App.irc_client.say(to, `${App.bold_text("Autorespond")} has been set to: ` + n)
        }
      }

      // Owner commands

      else if (cmd === "admins") {
        if (App.is_owner(from)) {
          let s = App.config.admins.join(", ")
          App.irc_client.say(to, `${App.bold_text("Admins")}: ` + (s || "No admins yet"))
        }
      }            

      else if (cmd.startsWith("admins add ")) {
        if (App.is_owner(from)) {
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
        }
      }

      else if (cmd.startsWith("admins remove ")) {
        if (App.is_owner(from)) {
          let arg = cmd.replace(/^\admins remove /, "").trim()

          if (arg) {
            if (App.is_admin(arg)) {
              let nick = arg.toLowerCase()
              let admins = App.config.admins.map(x => x.toLowerCase()).filter(x => x !== nick)
              App.update_config("admins", admins)
              App.irc_client.say(to, "Done.")
            }
          }
        }
      }  
      
      else if (cmd ===  "admins clear") {
        if (App.is_owner(from)) {
          App.update_config("admins", [])
          App.irc_client.say(to, "Done.")
        }
      }    
      
      else if (cmd ===  "owners") {
        if (App.is_owner(from)) {
          let s = App.config.owners.join(", ")
          App.irc_client.say(to, `${App.bold_text("Owners")}: ` + (s || "No owners yet"))
        }
      }   
      
      else if (cmd.startsWith("allow_ask ")) {
        if (App.is_owner(from)) {
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
        }
      }  

      else if (cmd ===  "allow_ask") {
        if (App.is_owner(from)) {
          App.irc_client.say(to, `${App.bold_text("allow_ask")}: ` + App.config.allow_ask)
        }
      } 
      
      else if (cmd.startsWith("allow_mod ")) {
        if (App.is_owner(from)) {
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
        }
      }

      else if (cmd ===  "allow_mod") {
        if (App.is_owner(from)) {
          App.irc_client.say(to, `${App.bold_text("allow_mod")}: ` + App.config.allow_mod)
        }
      }           
    }    
  }
}