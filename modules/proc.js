// These are functions that process a received message
// Input from irc is checked and maybe sent to openai

module.exports = function (App) {
  App.process = function (from, to, message) {
    // Rate limit to avoid attacks or mistakes
    if (!App.is_admin(from)) {
      if ((Date.now() - App.rate_limit_date) <= App.rate_limit_delay) {
        return
      }
    }
    
    App.rate_limit_date = Date.now()
    message = message.trim()
    let prev_message = App.last_messages[to]
    App.last_messages[to] = {from: from, to: to, message: message} 

    if (!App.is_allowed("allow_ask", from)) {requestAnimationFrame
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
  
    App.proc_nick_mention(from, to, message, prev_message)
  }
  
  App.proc_nick_mention = function (from, to, message, prev_message) {
    let re = new RegExp(/^(?<nickname>\w+)[,:](?<message>.*)$/, "")
    let match = message.match(re)
    
    if (!match) {
      return
    }
  
    let nick = match.groups.nickname.trim()
    let prompt = match.groups.message.trim()
  
    if (!nick || !prompt) {
      return
    }
  
    if (nick.toLowerCase() === App.config.nickname.toLowerCase()) {
      if(prompt === "hi" || prompt === "hello") {
        App.irc_client.say(to, "hi!")
        return
      }    
      else if (prompt.startsWith("^") && prev_message) {
        let context = App.remove_dots(prev_message.message)
        let words = prompt.replace("^", "").trim()

        if (words) {
          context += "\n" + words
        }

        App.proc_respond(from, to, context)
        return
      }
            
      if (prompt.startsWith(App.config.prefix)) {        
        App.check_commands(from, to, prompt)
      }
      else {
        App.proc_respond(from, to, prompt)
      }
    }
  }
  
  App.proc_respond = function (from, to, prompt) {
    if (/\w$/.test(prompt)) {
      prompt += "."
    }

    if (prompt.length <= App.config.max_prompt) {
      console.info(from + ' => ' + to + ': ' + prompt)
      App.ask_openai(prompt, to)
    }
  }  

  App.report = function (to) {
    let ts = App.timeago(App.date_started)
    App.irc_client.say(to, `I'm here! I was launched ${ts}.`)
    return
  }
}