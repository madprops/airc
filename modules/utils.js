module.exports = function (App) {
  App.get_random_int = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  App.is_user = function (nickname) {
    let nick = nickname.toLowerCase()
    return App.config.users.map(x => x.toLowerCase()).some(x => x === nick)
  }

  App.is_admin = function (nickname) {
    let nick = nickname.toLowerCase()
    return App.config.admins.map(x => x.toLowerCase()).some(x => x === nick)
  }

  App.is_allowed = function (key, nickname) {
    if (App.config[key] === "users") {
      if (!App.is_user(nickname) && !App.is_admin(nickname)) {
        return false
      }
    }
    else if (App.config[key] === "admins") {
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
  App.timeago = function (date) {
    let diff = Date.now() - date
    let result

    if (diff < App.MINUTE) {
      result = "just now"
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

  App.escape_regex = function (text) {
    return text.replace(/[^A-Za-z0-9]/g, "\\$&")
  }

  App.remove_multiple_spaces = function (text) {
    return text.trim().replace(/ +/g, " ")
  }

  App.remove_multiple_linebreaks = function (text) {
    return text.trim().replace(/\n+/g, "\n")
  }  

  App.capitalize = function (text) {
    let result = text.toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.substring(1))
      .join(" ")

    return result
  }

  App.limit = function (text, limit) {
    return text.substring(0, limit).trim()
  }

  // Add proper punctuation at the end
  // To avoid autocompletions from the ai
  App.terminate = function (text) {
    if (text && /\w$/.test(text)) {
      text += "."
    }

    return text
  }

  // Return in MB
  App.get_memory_used = function () {
    let mem = App.i.process.memoryUsage()
    let used = parseInt(mem.rss / 1000000)
    return used
  }

  App.join = function (list) {
    return list.join(" 👾 ")
  }
}