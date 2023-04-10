module.exports = function (App) {
  App.start_irc = function () {
    App.irc_client = new App.i.irc.Client(App.config.server, App.config.nickname, {
      channels: App.config.channels,
      messageSplit: 444
    })

    App.irc_client.addListener(`message`, function (from, channel, message) {
      // Ignore private messages
      if (!channel.startsWith(`#`)) {
        return
      }

      try {
        App.process_message(from, channel, message)
      }
      catch (err) {
        console.error(err)
      }
    })

    App.irc_client.addListener(`selfMessage`, function (channel, message) {
      // Messages from the bot itself
    })

    // Without this it might crash sometimes
    App.irc_client.addListener(`error`, function(e) {
      console.error(`irc error`)
    })

    App.irc_client.addListener(`join`, function(channel, nick, message) {
      console.info(`Joined ${channel}`)
    })

    App.irc_client.addListener(`part`, function(channel, nick, reason, message) {
      console.info(`Left ${channel}`)
    })

    App.irc_respond = function (channel, message) {
      App.irc_client.say(channel, message)
    }

    App.irc_join = function (channel) {
      App.irc_client.join(channel)
    }

    App.irc_leave = function (channel) {
      App.irc_client.part(channel)
    }

    App.irc_bold = function (text) {
      return `\x02${text}\x0F`
    }

    App.filter_channels = function (ch) {
      App.config.channels = App.config.channels.filter(x => x.split(` `)[0].toLowerCase() !== ch)
    }

    App.join_channel = function (channel, new_channel) {
      // The argument might contain the password
      let split = new_channel.split(` `)
      let ch = split[0].toLowerCase()

      if (!ch.startsWith(`#`)) {
        return
      }

      App.filter_channels(ch)
      App.config.channels.push(new_channel)
      App.update_config(`channels`, App.config.channels)
      App.irc_respond(channel, `Joining ${ch}...`)
      App.irc_join(new_channel)
    }

    App.leave_channel = function (channel, old_channel) {
      let ch = old_channel.toLowerCase()

      if (!ch.startsWith(`#`)) {
        return
      }

      App.filter_channels(ch)
      App.update_config(`channels`, App.config.channels)
      App.irc_respond(channel, `Leaving ${ch}...`)
      App.irc_leave(old_channel)
    }

    App.nick = function () {
      return App.irc_client.nick
    }

    console.info(`Joining irc...`)
  }
}