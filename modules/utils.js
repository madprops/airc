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
		let s

		if (diff < App.MINUTE) {
			s = "just now"
		} 
    else if (diff < App.HOUR) {
			let n = Math.floor(diff / 60 / 1000)

			if (n === 1) {
				s = `${n} minute ago`
			} 
      else {
				s = `${n} minutes ago`
			}
		} 
    else if (diff >= App.HOUR && diff < App.DAY) {
			let n = Math.floor(diff / 60 / 60 / 1000)

			if (n === 1) {
				s = `${n} hour ago`
			} 
      else {
				s = `${n} hours ago`
			}
		} 
    else if (diff >= App.DAY && diff < App.YEAR) {
			let n = Math.floor(diff / 24 / 60 / 60 / 1000)

			if (n === 1) {
				s = `${n} day ago`
			} 
      else {
				s = `${n} days ago`
			}
		} 
    else if (diff >= App.YEAR) {
			let n = Math.floor(diff / 365 / 24 / 60 / 60 / 1000)

			if (n === 1) {
				s = `${n} year ago`
			} 
      else {
				s = `${n} years ago`
			}
		}

		return s
	}

  App.escape_regex = function (s) {
		return s.replace(/[^A-Za-z0-9]/g, "\\$&")
	}

  App.remove_multiple_spaces = function (s) {
    return s.trim().replace(/ +/g, " ")
  }

  App.capitalize = function (s) {
    let ns = s.toLowerCase()
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(" ")

    return ns
  }

  App.limit = function (s, limit) {
    return s.substring(0, limit).trim()
  }

  // Add proper punctuation at the end
  // To avoid autocompletions from the ai
  App.terminate = function (s) {
    if (s && /\w$/.test(s)) {
      s += "."
    }

    return s
  }
}