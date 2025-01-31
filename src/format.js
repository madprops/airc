module.exports = (App) => {
  App.regex_u = (c, n) => {
    return `${c}{${n}}`
  }

  App.regex_t = (c, n) => {
    let u = App.regex_u(c, n)
    return `(?:(?!${u}|\\s).)`
  }

  App.regex_t2 = (c, n) => {
    let u = App.regex_u(c, n)
    return `(?:(?!${u}).)`
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
    let regex = `(?:^|\\s)${u}(${t}.*?${t}|${t})${u}(?:$|\\s)`
    return new RegExp(regex, `g`)
  }

  App.char_regex_3 = (char, n = 1) => {
    let c = App.escape_regex(char)
    let u = App.regex_u(c, n)
    let t2 = App.regex_t2(c, n)
    let regex = `${u}(${t2}+)${u}`
    return new RegExp(regex, `g`)
  }

  App.list_regex = (char) => {
    let c = App.escape_regex(char)
    let exp = `^(\\s*${c}\\s+)[^\\s]+`
    return new RegExp(exp, `g`)
  }

  App.format_irc = (text) => {
    function action(regex, mode, full = false) {
      function func(s) {
        let code

        if (mode === `bold`) {
          code = App.irc_bold()
        }
        else {
          code = App[`irc_color_${mode}`]()
        }

        return `${code}${s}${code}`
      }

      let matches = [...text.matchAll(regex)]

      for (let match of matches) {
        let m

        if (full) {
          m = match[0]
        }
        else {
          m = match[1]
        }

        if (App.check_outer_code(text, match.index, m.length, mode)) {
          continue
        }

        text = text.replace(match[0], func(m))
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

  App.irc_bold = () => {
    return `\x02`
  }

  App.irc_color_red = () => {
    return `\x0304`
  }

  App.irc_color_green = () => {
    return `\x0303`
  }

  App.irc_color_blue = () => {
    return `\x0312`
  }

  App.irc_color_cyan = () => {
    return `\x0311`
  }

  App.irc_color_pink = () => {
    return `\x0313`
  }

  App.irc_color_yellow = () => {
    return `\x0308`
  }

  App.irc_color_orange = () => {
    return `\x0307`
  }

  App.irc_color_purple = () => {
    return `\x0306`
  }

  App.irc_color_black = () => {
    return `\x0301`
  }

  App.irc_color_white = () => {
    return `\x0300`
  }

  App.irc_color_brown = () => {
    return `\x0305`
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

  App.check_outer_code = (text, index, length, mode) => {
    let s

    if (mode === `bold`) {
      s = `\\x02`
    }
    else {
      s = `\\x03\\d{1,2}`
    }

    let regex = new RegExp(`${s}(?:(?!${s}).)${s}`, `g`)
    let matches = [...text.matchAll(regex)]

    for (let match of matches) {
      let index_start = match.index
      let index_end = match.index + match[0].length - 1

      if ((index_start <= index) && (index_end >= (index + length - 1))) {
        return true
      }
    }

    return false
  }
}