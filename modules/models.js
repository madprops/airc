module.exports = (App) => {
  App.start_openai = () => {
    let key = process.env.OPENAI_API_KEY

    if (!key) {
      return
    }

    App.openai_client = new App.i.openai({
      apiKey: key,
    })

    App.openai_started = true
    App.log(`OpenAI started`)
  }

  App.start_google = () => {
    let key = process.env.GOOGLE_API_KEY

    if (!key) {
      return
    }

    App.google_client = new App.i.openai({
      apiKey: process.env.GOOGLE_API_KEY,
      baseURL: `https://generativelanguage.googleapis.com/v1beta/openai/`,
    })

    App.google_started = true
    App.log(`Google started`)
  }

  App.is_gpt = () => {
    let model = App.config.model
    return model.startsWith(`gpt-`)
  }

  App.is_gemini = () => {
    let model = App.config.model
    return model.startsWith(`gemini-`)
  }

  App.get_client = (channel) => {
    if (App.is_gpt()) {
      if (!App.openai_started) {
        App.irc_respond(channel, `OpenAI API Key is missing.`)
        return
      }

      return App.openai_client
    }
    else if (App.is_gemini()) {
      if (!App.google_started) {
        App.irc_respond(channel, `Google API Key is missing.`)
        return
      }

      return App.google_client
    }
  }

  App.ask_model = async (messages, channel, callback) => {
    let model = App.config.model

    if (App.debug) {
      App.log(`Text Gen: ${model}`)
    }

    try {
      let client = App.get_client(channel)

      if (!client) {
        return
      }

      let ans = await client.chat.completions.create({
        model,
        max_tokens: App.config.max_tokens,
        messages,
      })

      if (ans && ans.choices) {
        let text = ans.choices[0].message.content.trim()

        if (text) {
          callback(text)
        }
      }
    }
    catch (err) {
      App.log(err, `error`)
    }
  }

  App.make_image = async (prompt, callback) => {
    if (!App.openai_started) {
      return
    }

    let model = `dall-e-3`
    let size = `1024x1024`

    if (App.debug) {
      App.log(`Image Gen: ${model}`)
    }

    try {
      let client = App.openai_client

      if (!client) {
        return
      }

      let ans = await client.images.generate({
        n: 1,
        model,
        size,
        prompt,
      })

      if (ans && ans.data) {
        callback(ans.data[0].url)
      }
    }
    catch (err) {
      App.log(err, `error`)
      return
    }
  }
}