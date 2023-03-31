module.exports = function (App) {
  App.start_irc = function () {
    App.irc_client = new App.irc.Client(App.config.server, App.config.nickname, {
      channels: App.config.channels
    })
    
    App.irc_client.addListener("message", function (from, to, message) {
      if (App.config.channels.includes(to)) {
        try {
          App.process_message(from, to, message)
        }
        catch (err) {
          console.error(err)
        }
      }
    })
  
    App.irc_client.addListener("selfMessage", function (to, message) {
      App.last_messages[to] = {from: App.config.nickname, to: to, message: message}
    })

    // Without this it might crash sometimes
    App.irc_client.addListener("error", function(message) {
      console.error("irc error")
    })

    App.irc_client.addListener("join", function(channel, nick, message) {
      console.info(`Joined ${channel}`)
    })

    App.irc_respond = function (to, s) {
      App.irc_client.say(to, s)
    }

    console.info("Joining irc...")
  }
}