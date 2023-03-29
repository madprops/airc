// Commands from irc to the bot are checked and processed here

module.exports = function (App) {
  App.check_commands = function (from, to, prompt) {
    let cmd = prompt.replace(App.config.commands_prefix, "")

    if (!cmd) {
      return
    }

    // Commands anybody can use

    if (cmd === "help") {
      let p = App.config.commands_prefix

      let cmds = [
        `${p}ur [x]`,
        `${p}instructions [x|clear]`,
        `${p}reset`,
        `${p}autorespond [0-100]`,
        `${p}allow_ask [all|users|admins]`,
        `${p}allow_modify [all|users|admins]`,
        `${p}users [add|remove][nick]`,
        `${p}users clear`,
        `${p}admins`,
      ]

      App.irc_client.say(to, `${App.bold_text("Commands")}: ` + cmds.join(" 👾 "))
      return
    }
    
    if (cmd === "instructions") {
      App.irc_client.say(to, `${App.bold_text("Instructions")}: ` + (App.config.instructions || "[Empty]"))
      return
    } 

    // Commands that modify instructions

    if (cmd.startsWith("instructions ")) {
      if (!App.is_allowed("allow_modify", from)) { return }       
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
      if (!App.is_allowed("allow_modify", from)) { return }                      
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
      if (!App.is_allowed("allow_modify", from)) { return }       
      App.update_config("instructions", "")
      App.irc_client.say(to, `${App.bold_text("Instructions")} have been set to: [Empty]`)
      return
    }      

    // admins only

    if (App.is_admin(from)) {
      if (cmd === "users") {
        let s = App.config.users.join(", ")
        App.irc_client.say(to, `${App.bold_text("Users")}: ` + (s || "[Empty]"))
        return
      }            
  
      if (cmd.startsWith("users add ")) {
        let arg = cmd.replace(/^\users add /, "").trim()
  
        if (arg) {
          if (arg.length <= App.max_user_length) {
            if (!App.is_op(nickname) && !App.is_admin(nickname)) {
              App.config.users.push(arg)
              App.update_config("users", App.config.users)
              App.irc_client.say(to, "Done.")
            }
          }
        }

        return
      }

      if (cmd.startsWith("users remove ")) {
        let arg = cmd.replace(/^\users remove /, "").trim()
  
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
        App.irc_client.say(to, `${App.bold_text("Admins")}: ` + (s || "[Empty]"))
        return
      }   

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
      
      if (cmd.startsWith("allow_ask ")) {
        let arg = cmd.replace(/^\allow_ask /, "").trim()
  
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
        App.irc_client.say(to, `${App.bold_text("allow_ask")}: ` + App.config.allow_ask)
        return
      } 
      
      if (cmd.startsWith("allow_modify ")) {
        let arg = cmd.replace(/^\allow_modify /, "").trim()
  
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
        App.irc_client.say(to, `${App.bold_text("allow_modify")}: ` + App.config.allow_modify)
        return
      }
    }  
  }
}