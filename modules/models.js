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

  App.ask_model = async (messages, channel, callback) => {
    let model = App.config.model

    if (App.debug) {
      App.log(`Model: ${model}`)
    }

    try {
      let client

      if (App.is_gpt()) {
        if (!App.openai_started) {
          App.irc_respond(channel, `OpenAI API Key is missing.`)
          return
        }

        client = App.openai_client
      }
      else if (App.is_gemini()) {
        if (!App.google_started) {
          App.irc_respond(channel, `Google API Key is missing.`)
          return
        }

        client = App.google_client
      }
      else {
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

  App.is_gpt = () => {
    let model = App.config.model
    return model.startsWith(`gpt-`)
  }

  App.is_gemini = () => {
    let model = App.config.model
    return model.startsWith(`gemini-`)
  }
}