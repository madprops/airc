module.exports = function (App) {
  App.start_irc = function () {
    App.irc_client = new App.irc.Client(App.config.server, App.config.nickname, {
      channels: App.config.channels
    })
    
    App.irc_client.addListener("message", function (from, to, message) {
      App.process(from, to, message)
    })
  
    App.irc_client.addListener("selfMessage", function (to, message) {
      App.last_messages[to] = {from: App.config.nickname, to: to, message: message}
    })

    App.irc_client.addListener("error", function(message) {
      console.error("irc error")
    })
  }  
}