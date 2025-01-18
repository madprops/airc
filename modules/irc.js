module.exports = (App) => {
  App.start_irc = () => {
    App.irc_client = new App.i.irc.Client(App.config.server, App.config.nickname, {
      channels: App.config.channels,
      port: App.config.port,
    })

    App.irc_client.addListener(`message`, (from, channel, message) => {
      // Ignore private messages
      if (!channel.startsWith(`#`)) {
        return
      }

      try {
        App.process_message({from, channel, message})
      }
      catch (err) {
        App.log(err, `error`)
      }
    })

    App.irc_client.addListener(`selfMessage`, (channel, message) => {
      // Messages from the bot itself
    })

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

    App.irc_respond = (channel, message) => {
      if (App.config.show_avatar) {
        message = App.add_avatar(message)
      }

      if (App.config.markdown) {
        message = App.format_irc(message)
      }

      App.irc_client.say(channel, message)
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

    App.irc_color_red = (text) => {
      return `\x0304${text}\x0F`
    }

    App.irc_color_green = (text) => {
      return `\x0303${text}\x0F`
    }

    App.irc_color_blue = (text) => {
      return `\x0312${text}\x0F`
    }

    App.irc_color_cyan = (text) => {
      return `\x0311${text}\x0F`
    }

    App.irc_color_pink = (text) => {
      return `\x0313${text}\x0F`
    }

    App.irc_color_yellow = (text) => {
      return `\x0308${text}\x0F`
    }

    App.irc_color_orange = (text) => {
      return `\x0307${text}\x0F`
    }

    App.irc_color_purple = (text) => {
      return `\x0306${text}\x0F`
    }

    App.irc_color_black = (text) => {
      return `\x0301${text}\x0F`
    }

    App.irc_color_white = (text) => {
      return `\x0300${text}\x0F`
    }

    App.irc_color_brown = (text) => {
      return `\x0305${text}\x0F`
    }

    App.irc_color_grey = (text) => {
      return `\x03014${text}\x0F`
    }

    App.irc_color_silver = (text) => {
      return `\x03015${text}\x0F`
    }

    App.format_irc = (text) => {
      let color = App.config.markdown_color
      let color_func = App[`irc_color_${color}`]

      function char_regex(char) {
        let c = App.escape_regex(char)
        let regex = new RegExp(`(?:(?<=\\s|^|\\(|\\[|\\/)${c}([a-zA-Z- ]+)${c}(?=\\s|$|\\.|,|;|!|\\?|:|\\/|\\)|\\]|…))`)
        return new RegExp(regex, `g`)
      }

      function action(regex, func) {
        let match = regex.exec(text)

        while (match) {
          text = text.replace(match[0], func(match[1]))
          match = regex.exec(text)
        }
      }

      action(char_regex(`\``), color_func)
      action(char_regex(`**`), App.irc_bold)
      action(char_regex(`*`), App.irc_bold)
      action(char_regex(`__`), App.irc_bold)
      action(char_regex(`_`), App.irc_bold)

      return text
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