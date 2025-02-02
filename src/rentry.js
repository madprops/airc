export default (App) => {
  App.Rentry = class {
    constructor(text, password, channel, after_upload) {
      this.text = text
      this.password = password
      this.channel = channel
      this.after_upload = after_upload
      this.site = `https://rentry.org`
      this.cookies = {}

      this.headers = {
        "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0`,
        "Sec-Fetch-Dest": `document`,
        "Sec-Fetch-Mode": `navigate`,
        "Sec-Fetch-Site": `same-origin`,
        "Sec-Fetch-User": `?1`,
        "Referer": this.site,
      }

      this.post().catch(App.log)
    }

    get_cookie(name) {
      return this.cookies[name] || ``
    }

    get_token() {
      return this.get_cookie(`csrftoken`)
    }

    async post() {
      this.session = App.i.axios.create()

      this.session.interceptors.response.use(response => {
        let set_header = response.headers[`set-cookie`]

        if (set_header) {
          for (let cookie of set_header) {
            let [name_value, ...rest] = cookie.split(`;`)
            let [name, value] = name_value.split(`=`)
            this.cookies[name.trim()] = value.trim()
          }
        }

        return response
      })

      await this.session.get(this.site, {
        withCredentials: true,
      })

      let token = this.get_token()
      let params = new FormData()

      params.append(`csrfmiddlewaretoken`, token)
      params.append(`text`, this.text.length > 0 ? this.text : `.`)
      params.append(`edit_code`, this.password)

      this.headers.Cookie = `csrftoken=${token}`

      try {
        let response = await this.session.post(`${this.site}/api/new`, params, {
          headers: this.headers,
          withCredentials: true,
          allowRedirects: false,
        })

        if (response.status !== 200) {
          return
        }

        let url = response.data.url
        this.after_upload(url, this.password, this.channel)
      }
      catch (err) {
        App.log(`Upload failed:`, err)
      }
    }
  }
}