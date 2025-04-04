export default (App) => {
  App.start_irc = () => {
    App.irc_client = new App.i.irc.Client(App.config.server, App.config.nickname, {
      userName: App.config.username,
      channels: App.config.channels,
      port: App.config.port,
      retryCount: 10,
    })

    App.irc_client.addListener(`message`, (from, channel, message) => {
      App.on_irc_message(from, channel, message)

      App.last_irc_message = {
        from,
        message,
      }
    })

    App.irc_client.addListener(`selfMessage`, (channel, message) => {
      App.on_irc_message(App.nick(), channel, message)
    })

    App.on_irc_message = (from, channel, message) => {
      // Ignore private messages
      if (!channel.startsWith(`#`)) {
        return
      }

      // Ignore ridiculous messages
      // Though likely not necessary because irc messages get split
      // But still better to be safe
      // Quick messages should still be rate limited
      if (message.length > 2000) {
        return
      }

      try {
        App.process_message({from, channel, message})
      }
      catch (err) {
        App.log(err, `error`)
      }
    }

    // Without this it might crash sometimes
    App.irc_client.addListener(`error`, (err) => {
      App.log(err, `error`)
    })

    App.irc_client.addListener(`join`, (channel, nick, message) => {
      if (nick === App.nick()) {
        App.log(`Joined ${channel}`)
      }
    })

    App.irc_client.addListener(`part`, (channel, nick, reason, message) => {
      if (nick === App.nick()) {
        App.log(`Left ${channel}`)
      }
    })

    App.irc_respond = (channel, message, format = true) => {
      message = message.slice(0, App.config.max_message_length).trim()

      if (App.config.markdown && format) {
        message = App.format_irc(message)
      }

      if (App.config.show_avatar) {
        message = App.add_avatar(message)
      }

      App.irc_client.say(channel, message)
    }

    App.irc_join = (channel) => {
      App.irc_client.join(channel)
    }

    App.irc_leave = (channel) => {
      App.irc_client.part(channel)
    }

    App.filter_channels = (ch) => {
      App.config.channels = App.config.channels.filter(x => x.split(` `)[0].toLowerCase() !== ch)
    }

    App.join_channel = (channel, new_channel) => {
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

    App.leave_channel = (channel, old_channel) => {
      let ch = old_channel.toLowerCase()

      if (!ch.startsWith(`#`)) {
        return
      }

      App.filter_channels(ch)
      App.update_config(`channels`, App.config.channels)
      App.irc_respond(channel, `Leaving ${ch}...`)
      App.irc_leave(old_channel)
    }

    App.nick = () => {
      return App.irc_client.nick
    }

    App.change_nickname = (new_nickname) => {
      App.irc_client.send(`NICK`, new_nickname)
    }

    App.log(`Joining irc...`)
  }
}