module.exports = (App) => {
  App.start_irc = () => {
    App.irc_client = new App.i.irc.Client(App.config.server, App.config.nickname, {
      channels: App.config.channels,
    })

    App.irc_client.addListener(`message`, (from, channel, message) => {
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

    App.irc_client.addListener(`selfMessage`, (channel, message) => {
      // Messages from the bot itself
    })

    // Without this it might crash sometimes
    App.irc_client.addListener(`error`, (e) => {
      console.error(`irc error`)
    })

    App.irc_client.addListener(`join`, (channel, nick, message) => {
      console.info(`Joined ${channel}`)
    })

    App.irc_client.addListener(`part`, (channel, nick, reason, message) => {
      console.info(`Left ${channel}`)
    })

    App.irc_respond = (channel, message) => {
      if (message.length > 400) {
        let lines = message.match(/.{1,250}/g)

        for (let line of lines) {
          App.irc_client.say(channel, line)
        }
      }
      else {
        App.irc_client.say(channel, message)
      }
    }

    App.irc_join = (channel) => {
      App.irc_client.join(channel)
    }

    App.irc_leave = (channel) => {
      App.irc_client.part(channel)
    }

    App.irc_bold = (text) => {
      return `\x02${text}\x0F`
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

    console.info(`Joining irc...`)
  }
}