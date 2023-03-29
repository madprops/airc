// These are functions that process a received message
// For example input from irc is checked and maybe sent to openai
// In the future this might support more chat platforms and ai services

module.exports = function (App) {
  App.process = function (from, to, message) {
    if (from === App.config.nickname) {
      return
    }  

    message = message.trim()

    let prev_message = App.last_messages[to]
    App.last_messages[to] = {from: from, to: to, message: message}

    if (!App.is_allowed("allow_ask", from)) {
      return
    }
    
    let low_message = message.toLowerCase()

    if (low_message.includes("http://") || low_message.includes("https://")) {
      return
    }
  
    if (App.proc_nick_mention(from, to, message, prev_message)) {
      return
    }
    else {
      App.proc_autorespond(from, to, message, prev_message)
    }
  }
  
  App.proc_nick_mention = function (from, to, message, prev_message) {
    let re = new RegExp(/^(?<nickname>\w+)[,:](?<message>.*)$/, "")
    let match = message.match(re)
    
    if (!match) {
      return false
    }
  
    let nick = match.groups.nickname.trim()
    let prompt = match.groups.message.trim()
  
    if (!nick || !prompt) {
      return false
    }
  
    if (nick.toLowerCase() === App.config.nickname.toLowerCase()) {
      if(prompt === "hi" || prompt === "hello") {
        App.irc_client.say(to, "hi!")
        return true
      }
      else if (prompt === "^" && prev_message) {
        App.proc_respond(from, to, prev_message.message)
        return true
      }
            
      if (prompt.startsWith(App.config.commands_prefix)) {
        let cmd = prompt.replace(App.config.commands_prefix, "")

        if (cmd === "help") {
          let p = App.config.commands_prefix

          let cmds = [
            `${p}instructions [x|clear]`,
            `${p}silent [true|false]`,
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
            return true
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
            return true
          }

          App.update_config("instructions", "")
          App.irc_client.say(to, `${App.bold_text("Instructions")} have been set to: [Empty]`)
        }  
        
        else if (cmd.startsWith("ur ")) {
          if (!App.is_allowed("allow_mod", from)) {
            return true
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
          if (cmd === "silent") {
            App.irc_client.say(to, `${App.bold_text("Silent")}: ` + App.config.silent)
          }          
  
          else if (cmd.startsWith("silent ")) {
            let arg = cmd.replace(/^\silent /, "").trim()

            if (arg === "true" || arg === "false") {
              let bool = arg === "true"
              App.update_config("silent", bool)
              App.irc_client.say(to, `${App.bold_text("Silent")} has been set to: ` + bool)
            }
          }
  
          else if (cmd === "autorespond") {
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
                  App.irc_client.say(to, "It must be: all, admins, or owners")
                }
              }
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
                  App.irc_client.say(to, "It must be: all, admins, or owners")
                }
              }
            }
          } 
        }
      }
      else {
        App.proc_respond(from, to, prompt)
      }
    }
  
    return true
  }
  
  App.proc_autorespond = function (from, to, message, prev_message) {
    if (message.startsWith(App.config.commands_prefix)) {
      return true
    } 
  
    if (App.config.autorespond <= 0) {
      return false
    }
  
    if (!prev_message || (prev_message.from !== App.config.nickname) || (from === App.config.nickname)) {
      return false
    }
  
    let num = App.get_random_int(1, 100)
  
    if (num >= 1 && num <= App.config.autorespond) {
      let prompt = `You: "${prev_message.message}" Me: "${message}"`
      App.proc_respond(from, to, prompt)
      return true
    }
  
    return false
  }
  
  App.proc_respond = function (from, to, prompt) {
    if (App.config.silent) {
      return
    }
  
    if (App.config.channels.includes(to)) {
      if (prompt.length <= App.config.max_prompt_length) {
        console.info(from + ' => ' + to + ': ' + prompt);
        App.ask_openai(prompt, to)
      }
    }
  }  
}