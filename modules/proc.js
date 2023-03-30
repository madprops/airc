// These are functions that process a received message
// Input from irc is checked and maybe sent to openai

module.exports = function (App) {
  App.process = function (from, to, message) {
    // Rate limit to avoid attacks or mistakes
    if (!App.is_admin(to)) {
      if ((Date.now() - App.rate_limit_date) <= App.rate_limit_delay) {
        return
      }
    }
    
    App.rate_limit_date = Date.now()
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

    // This causes all airc instances to respond
    if (message === "!who") {
      App.report(to)
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
            
      if (prompt.startsWith(App.config.prefix)) {        
        App.check_commands(from, to, prompt)
        return true
      }
      else {
        App.proc_respond(from, to, prompt)
      }
    }
  
    return true
  }
  
  App.proc_autorespond = function (from, to, message, prev_message) {
    if (message.startsWith(App.config.prefix)) {
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
    if (prompt.length <= App.config.max_prompt) {
      console.info(from + ' => ' + to + ': ' + prompt);
      App.ask_openai(prompt, to)
    }
  }  

  App.report = function (to) {
    let ts = App.timeago(App.date_started)
    App.irc_client.say(to, `I'm here! I was launched ${ts}.`)
    return
  }
}