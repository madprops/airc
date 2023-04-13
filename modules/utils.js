module.exports = (App) => {
  App.get_random_int = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  App.is_user = (nickname) => {
    let nick = nickname.toLowerCase()
    return App.config.users.map(x => x.toLowerCase()).some(x => x === nick)
  }

  App.is_admin = (nickname) => {
    let nick = nickname.toLowerCase()
    return App.config.admins.map(x => x.toLowerCase()).some(x => x === nick)
  }

  App.is_allowed = (what, nickname) => {
    let config = App.config[`allow_${what}`]

    if (config === `users`) {
      if (!App.is_user(nickname) && !App.is_admin(nickname)) {
        return false
      }
    }
    else if (config === `admins`) {
      if (!App.is_admin(nickname)) {
        return false
      }
    }

    return true
  }

  App.MINUTE = 60000
  App.HOUR = 3600000
  App.DAY = 86400000
  App.YEAR = 31536000000

  // Return a timeago string
  App.timeago = (date) => {
    let diff = Date.now() - date
    let result

    if (diff < App.MINUTE) {
      result = `just now`
    }
    else if (diff < App.HOUR) {
      let n = Math.floor(diff / 60 / 1000)

      if (n === 1) {
        result = `${n} minute ago`
      }
      else {
        result = `${n} minutes ago`
      }
    }
    else if (diff >= App.HOUR && diff < App.DAY) {
      let n = Math.floor(diff / 60 / 60 / 1000)

      if (n === 1) {
        result = `${n} hour ago`
      }
      else {
        result = `${n} hours ago`
      }
    }
    else if (diff >= App.DAY && diff < App.YEAR) {
      let n = Math.floor(diff / 24 / 60 / 60 / 1000)

      if (n === 1) {
        result = `${n} day ago`
      }
      else {
        result = `${n} days ago`
      }
    }
    else if (diff >= App.YEAR) {
      let n = Math.floor(diff / 365 / 24 / 60 / 60 / 1000)

      if (n === 1) {
        result = `${n} year ago`
      }
      else {
        result = `${n} years ago`
      }
    }

    return result
  }

  App.escape_regex = (text) => {
    return text.replace(/[^A-Za-z0-9]/g, `\\$&`)
  }

  App.remove_multiple_spaces = (text) => {
    return text.trim().replace(/ +/g, ` `)
  }

  App.remove_multiple_linebreaks = (text) => {
    return text.trim().replace(/\n+/g, `\n`)
  }

  App.clean = (text) => {
    text = App.remove_multiple_spaces(text)
    text = App.remove_multiple_linebreaks(text)
    return text.trim()
  }

  App.capitalize = (text) => {
    let result = text.toLowerCase()
      .split(` `)
      .map(word => word.charAt(0).toUpperCase() + word.substring(1))
      .join(` `)

    return result
  }

  App.limit = (text, limit) => {
    return text.substring(0, limit).trim()
  }

  // Add proper punctuation at the end
  // To avoid autocompletions from the ai
  App.terminate = (text) => {
    if (text && /\w$/.test(text)) {
      text += `.`
    }

    return text
  }

  // Return in MB
  App.get_memory_used = () => {
    let mem = App.i.process.memoryUsage()
    let used = parseInt(mem.rss / 1000000)
    return used
  }

  App.join = (list, char = `👾`) => {
    return list.join(` ${char} `)
  }

  App.unquote = (text) => {
    return text.replace(/^"(.*)"$/, `$1`)
  }

  // Find the similarity between two strings
  App.string_similarity = (string_1, string_2) => {
    let longer = string_1
    let shorter = string_2

    if (string_1.length < string_2.length) {
      longer = string_2
      shorter = string_1
    }

    let longer_length = longer.length

    if (longer_length == 0) {
      return 1.0
    }

    return (longer_length - App.string_similarity_distance(longer, shorter)) / parseFloat(longer_length)
  }

  // Find the similarity distance between two strings
  App.string_similarity_distance = (string_1, string_2) => {
    string_1 = string_1.toLowerCase()
    string_2 = string_2.toLowerCase()

    let costs = new Array()

    for (let i = 0; i <= string_1.length; i++) {
      let last_value = i

      for (let j = 0; j <= string_2.length; j++) {
        if (i == 0) {
          costs[j] = j
        }
        else {
          if (j > 0) {
            let new_value = costs[j - 1]

            if (string_1.charAt(i - 1) != string_2.charAt(j - 1)) {
              new_value = Math.min(Math.min(new_value, last_value),
                costs[j]) + 1
            }

            costs[j - 1] = last_value
            last_value = new_value
          }
        }
      }

      if (i > 0) {
        costs[string_2.length] = last_value
      }
    }

    return costs[string_2.length]
  }
}