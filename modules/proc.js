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
            
      if (prompt.startsWith("!")) {
        if (App.is_operator(from)) {
          if (prompt === "!help") {
            App.irc_client.say(to, `${App.bold_text("Commands")}: !instructions [x|clear], !silent [true|false], !autorespond [0-100], !ur [x], !admins [add|remove] [x], !admins clear`)
          }
  
          else if (prompt === "!instructions") {
            App.irc_client.say(to, `${App.bold_text("Instructions")}: ` + (App.config.instructions || "[Empty]"))
          }
  
          else if (prompt.startsWith("!instructions ")) {
            let arg = prompt.replace(/^\!instructions /, "").trim()
            
            if (arg) {
              if (arg.length <= App.max_instructions_length) {
                if (arg === "clear") {
                  arg = ""
                }
    
                App.update_config("instructions", arg)
                App.irc_client.say(to, `${App.bold_text("Instructions")} have been set to: ` + (arg || "Empty"))
              }
            }
          }
  
          else if (prompt === "!silent") {
            App.irc_client.say(to, `${App.bold_text("Silent")}: ` + App.config.silent)
          }          
  
          else if (prompt.startsWith("!silent ")) {
            let arg = prompt.replace(/^\!silent /, "").trim()

            if (arg === "true" || arg === "false") {
              let bool = arg === "true"
              App.update_config("silent", bool)
              App.irc_client.say(to, `${App.bold_text("Silent")} has been set to: ` + bool)
            }
          }
  
          else if (prompt === "!autorespond") {
            App.irc_client.say(to, `${App.bold_text("Autorespond")}: ` + App.config.autorespond)
          }          
  
          else if (prompt.startsWith("!autorespond ")) {
            let arg = prompt.replace(/^\!autorespond /, "").trim()
            let n = parseInt(arg)
  
            if (!isNaN(n) && n >= 0 && n <= 100) {
              App.update_config("autorespond", n)
              App.irc_client.say(to, `${App.bold_text("Autorespond")} has been set to: ` + n)
            }
          }

          else if (prompt.startsWith("!ur ")) {
            let arg = prompt.replace(/^\!ur /, "").trim()

            if (arg) {
              let ins = `Please respond as if you were ${arg}`
  
              if (ins.length <= App.max_instructions_length) {  
                App.update_config("instructions", ins)              
                App.irc_client.say(to, `${App.bold_text("Instructions")} have been set to: ` + ins)
              }
            }
          }

          else if (prompt === "!admins") {
            if (App.is_owner(from)) {
              let s = App.config.admins.join(", ")
              App.irc_client.say(to, `${App.bold_text("Admins")}: ` + (s || "No admins yet"))
            }
          }            

          else if (prompt.startsWith("!admins add ")) {
            if (App.is_owner(from)) {
              let arg = prompt.replace(/^\!admins add /, "").trim()
  
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

          else if (prompt.startsWith("!admins remove ")) {
            if (App.is_owner(from)) {
              let arg = prompt.replace(/^\!admins remove /, "").trim()
  
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
          
          else if (prompt ===  "!admins clear") {
            if (App.is_owner(from)) {
              App.update_config("admins", [])
              App.irc_client.say(to, "Done.")
            }
          }    
          
          else if (prompt ===  "!owners") {
            if (App.is_owner(from)) {
              let s = App.config.owners.join(", ")
              App.irc_client.say(to, `${App.bold_text("Owners")}: ` + (s || "No owners yet"))
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
    if (message.startsWith("!")) {
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