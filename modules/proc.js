// These are functions that process a received message
// For example input from irc is checked and maybe sent to openai
// In the future this might support more chat platforms and ai services

module.exports = function (App) {
  App.process = function (from, to, message) {
    message = message.trim()

    if (from === App.config.nickname) {
      return
    }  
  
    if (App.proc_nick_mention(from, to, message)) {
      return
    }
    else {
      App.proc_autorespond(from, to, message)
    }
  }
  
  App.proc_nick_mention = function (from, to, message) {
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
            
      if (prompt.startsWith("!")) {
        if (App.config.admins.includes(from)) {
          if (prompt === "!help") {
            App.irc_client.say(to, "Commands: !instructions [x|empty], !silent [true|false], !autorespond [0-100]")
          }
  
          else if (prompt === "!instructions") {
            App.irc_client.say(to, "Instructions: " + (App.config.instructions || "[Empty]"))
          }
  
          else if (prompt.startsWith("!instructions ")) {
            let arg = prompt.replace(/^\!instructions /, "").trim()
            
            if (arg) {
              if (arg.length <= 250) {
                if (arg === "empty") {
                  arg = ""
                }
    
                App.update_config("instructions", arg)
                App.irc_client.say(to, "Instructions have been set to: " + (arg || "empty"))
              }
            }
          }
  
          else if (prompt === "!silent") {
            App.irc_client.say(to, "Silent: " + App.config.silent)
          }          
  
          else if (prompt.startsWith("!silent ")) {
            let arg = prompt.replace(/^\!silent /, "").trim()

            if (arg === "true" || arg === "false") {
              let bool = arg === "true"
              App.update_config("silent", bool)
              App.irc_client.say(to, "Silent has been set to: " + bool)
            }
          }
  
          else if (prompt === "!autorespond") {
            App.irc_client.say(to, "Autorespond: " + App.config.autorespond)
          }          
  
          else if (prompt.startsWith("!autorespond ")) {
            let arg = prompt.replace(/^\!autorespond /, "").trim()
            let n = parseInt(arg)
  
            if (!isNaN(n) && n >= 0 && n <= 100) {
              App.update_config("autorespond", n)
              App.irc_client.say(to, "Autorespond has been set to: " + n)
            }
          }

          else if (prompt.startsWith("!ur ")) {
            let arg = prompt.replace(/^\!ur /, "").trim()

            if (arg) {
              let ins = `Please respond as if you were ${arg}`
  
              if (ins && ins.length <= 250) {  
                App.update_config("instructions", ins)              
                App.irc_client.say(to, "Instructions have been set to: " + ins)
              }
            }
          }
        }
  
        return true
      }
      else {
        App.proc_respond(from, to, prompt)
        return true
      }
    }
  
    return false
  }
  
  App.proc_autorespond = function (from, to, message) {
    if (message.startsWith("!")) {
      return true
    }

    let prev_message = App.last_messages[to]
    App.last_messages[to] = {from: from, to: to, message: message}  
  
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