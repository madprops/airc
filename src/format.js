module.exports = (App) => {
  App.regex_u = (c, n) => {
    return `${c}{${n}}`
  }

  App.regex_t = (c, n) => {
    return `[^\\s${c}]`
  }

  App.regex_t2 = (c, n) => {
    return `[^${c}]`
  }

  App.char_regex_1 = (char, n = 1) => {
    let c = App.escape_regex(char)
    let u = App.regex_u(c, n)
    let t = App.regex_t(c, n)
    let t2 = App.regex_t2(c, n)
    let regex = `${u}(${t}${t2}*${t}|${t})${u}`
    return new RegExp(regex, `g`)
  }

  App.char_regex_2 = (char, n = 1) => {
    let c = App.escape_regex(char)
    let u = App.regex_u(c, n)
    let t = App.regex_t(c, n)
    let regex = `^(?:^|\\s)${u}(${t}.*?${t}|${t})${u}(?:$|\\s)`
    return new RegExp(regex, `g`)
  }

  App.char_regex_3 = (char, n = 1) => {
    let c = App.escape_regex(char)
    let u = App.regex_u(c, n)
    let t = `[^${u}]`
    let regex = `${u}(${t}+)${u}`
    return new RegExp(regex, `g`)
  }

  App.list_regex = (char) => {
    let c = App.escape_regex(char)
    let exp = `^(\\s*${c}\\s+)[^\\s]+`
    return new RegExp(exp, `g`)
  }

  App.format_irc = (text) => {
    function action(regex, mode, full = false) {
      let func

      if (mode === `bold`) {
        func = App.irc_bold
      }
      else {
        func = App[`irc_color_${mode}`]
      }

      let matches = [...text.matchAll(regex)]

      for (let match of matches) {
        if (full) {
          text = text.replace(match[0], func(match[0]))
        }
        else {
          text = text.replace(match[0], func(match[1]))
        }
      }
    }

    action(App.char_regex_3(`\``), App.config.color_backticks)
    action(App.char_regex_1(`"`), App.config.color_quotes, true)

    action(App.char_regex_1(`*`, 2), `bold`)
    action(App.char_regex_1(`*`), `bold`)

    action(App.char_regex_2(`_`, 2), `bold`)
    action(App.char_regex_2(`_`), `bold`)

    return text
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

  App.join = (list, char = ``) => {
    char = char || App.config.join_char || App.config.avatar
    return list.join(` ${char} `)
  }

  App.remove_lists = (text) => {
    let lines = text.split(`\n`)
    let new_lines = []

    function action(line, char) {
      let regex = App.list_regex(char)

      return line.replace(regex, (match, g1) => {
        return match.replace(g1, ``)
      })
    }

    for (let line of lines) {
      let new_line = line
      new_line = action(new_line, `*`)
      new_line = action(new_line, `-`)
      new_lines.push(new_line)
    }

    return new_lines.join(`\n`)
  }

  App.add_avatar = (text) => {
    return `${App.config.avatar} ${text}`
  }

  App.unquote = (text) => {
    return text.replace(/^"(.*)"$/, `$1`)
  }
}