module.exports = (App) => {
  App.char_regex_1 = (char) => {
    let c = App.escape_regex(char)
    let exp = `${c}(\\S.*?\\S)${c}`
    let regex = new RegExp(exp)
    return new RegExp(regex, `g`)
  }

  App.char_regex_2 = (char) => {
    let c = App.escape_regex(char)
    let exp = `(?<!\\w)${c}(?!\\s)(.+?)(?<!\\s)${c}(?!\\w)`
    let regex = new RegExp(exp)
    return new RegExp(regex, `g`)
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

    action(App.char_regex_1(`\``), App.config.color_backticks)
    action(App.char_regex_1(`"`), App.config.color_quotes, true)
    action(App.char_regex_1(`**`), `bold`)
    action(App.char_regex_1(`*`), `bold`)
    action(App.char_regex_2(`__`), `bold`)
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
}