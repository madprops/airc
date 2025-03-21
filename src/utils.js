export default (App) => {
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
  App.HOUR = App.MINUTE * 60
  App.DAY = App.HOUR * 24
  App.MONTH = App.DAY * 30
  App.YEAR = App.DAY * 365

  // Return a timeago string
  App.timeago = (date) => {
    let level = 0
    let diff = App.now() - date
    let result

    if (diff < App.MINUTE) {
      result = `just now`
      level = 1
    }
    else if (diff < App.HOUR) {
      let n = parseInt(diff / App.MINUTE)

      if (n === 1) {
        result = `${n} minute ago`
      }
      else {
        result = `${n} minutes ago`
      }

      level = 2
    }
    else if ((diff >= App.HOUR) && (diff < App.DAY)) {
      let n = parseInt(diff / App.HOUR)

      if (n === 1) {
        result = `${n} hour ago`
      }
      else {
        result = `${n} hours ago`
      }

      level = 3
    }
    else if ((diff >= App.DAY) && (diff < App.MONTH)) {
      let n = parseInt(diff / App.DAY)

      if (n === 1) {
        result = `${n} day ago`
      }
      else {
        result = `${n} days ago`
      }

      level = 4
    }
    else if ((diff >= App.MONTH) && (diff < App.YEAR)) {
      let n = parseInt(diff / App.MONTH)

      if (n === 1) {
        result = `${n} month ago`
      }
      else {
        result = `${n} months ago`
      }

      level = 5
    }
    else if (diff >= App.YEAR) {
      let n = parseInt(diff / App.YEAR)

      if (n === 1) {
        result = `${n} year ago`
      }
      else {
        result = `${n} years ago`
      }

      level = 6
    }

    return [result, level]
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

  App.plural = (num, singular, plural) => {
    if (num === 1) {
      return `${num.toLocaleString()} ${singular}`
    }

    return `${num.toLocaleString()} ${plural}`
  }

  App.bool = (value) => {
    let v = value.toLowerCase()

    if ((v === `true`) || (v === `yes`) || (v === `1`) || (v === `on`)) {
      return true
    }
    else if ((v === `false`) || (v === `no`) || (v === `0`) || (v === `off`)) {
      return false
    }
  }

  // Find the similarity between two strings
  App.similarity = (string_1, string_2) => {
    let longer = string_1
    let shorter = string_2

    if (string_1.length < string_2.length) {
      longer = string_2
      shorter = string_1
    }

    let longer_length = longer.length

    if (longer_length === 0) {
      return 1.0
    }

    return (longer_length - App.similarity_distance(longer, shorter)) / parseFloat(longer_length)
  }

  // Find the similarity distance between two strings
  App.similarity_distance = (string_1, string_2) => {
    string_1 = string_1.toLowerCase()
    string_2 = string_2.toLowerCase()

    let costs = new Array()

    for (let i = 0; i <= string_1.length; i++) {
      let last_value = i

      for (let j = 0; j <= string_2.length; j++) {
        if (i === 0) {
          costs[j] = j
        }
        else if (j > 0) {
          let new_value = costs[j - 1]

          if (string_1.charAt(i - 1) !== string_2.charAt(j - 1)) {
            new_value = Math.min(Math.min(new_value, last_value),
              costs[j]) + 1
          }

          costs[j - 1] = last_value
          last_value = new_value
        }
      }

      if (i > 0) {
        costs[string_2.length] = last_value
      }
    }

    return costs[string_2.length]
  }

  /* eslint-disable no-console */
  App.log = (message, mode = `normal`) => {
    if (mode === `error`) {
      console.error(message)
    }
    else {
      console.info(`🟢 ${message}`)
    }
  }

  App.def_args = (def, args) => {
    for (let key in def) {
      if ((args[key] === undefined) && (def[key] !== undefined)) {
        args[key] = def[key]
      }
    }
  }

  App.now = () => {
    return Date.now()
  }

  App.clean_prompt = (text) => {
    return text.replace(/[^a-zA-Z0-9]/g, ``).toLowerCase().trim()
  }

  App.upload_to_imgur = async (url, callback) => {
    let id = process.env.IMGUR_CLIENT_ID

    try {
      let ans = await App.i.axios.post(`https://api.imgur.com/3/image`, {
        image: url,
        type: `url`,
      }, {
        headers: {
          Authorization: `Client-ID ${id}`,
        },
      })

      if (ans.data.success) {
        callback(ans.data.data.link)
      }
      else {
        throw new Error(`Failed to upload image to Imgur`)
      }
    }
    catch (err) {
      App.log(err, `error`)
    }
  }

  App.imgur_enabled = () => {
    return process.env.IMGUR_CLIENT_ID !== undefined
  }

  App.is_url = (text) => {
    return [`https://`, `http://`, `www.`].some(x => text.startsWith(x))
  }

  App.is_path = (text) => {
    return text.startsWith(`/`)
  }

  App.rentry_upload = (channel, text, callback) => {
    let password = App.config.upload_password

    new App.Rentry(text, password, channel, (url, pw, ch) => {
      callback(url, pw, ch)
    })
  }
}