module.exports = (App) => {
  App.models = {
    turbo: {
      name: `gpt-3.5-turbo`,
    },
    gpt_4o: {
      name: `gpt-4o`,
    },
    gpt_4o_mini: {
      name: `gpt-4o-mini`,
    },
    gemini_pro: {
      name: `gemini-1.5-pro`,
    },
    gemini_flash: {
      name: `gemini-1.5-flash`,
    },
    gemini_flash_8b: {
      name: `gemini-1.5-flash-8b`,
    }
  }

  App.start_openai = () => {
    let key = process.env[`OPENAI_API_KEY`]

    if (!key) {
      return
    }

    App.openai_client = new App.i.openai({
      apiKey: key,
    })

    App.openai_started = true
    console.log(`OpenAI started`)
  }

  App.start_google = () => {
    let key = process.env[`GOOGLE_API_KEY`]

    if (!key) {
      return
    }

    App.google_client = new App.i.openai({
      apiKey: process.env[`GOOGLE_API_KEY`],
      baseURL: `https://generativelanguage.googleapis.com/v1beta/openai/`,
    })

    App.google_started = true
    console.log(`Google started`)
  }

  App.ask_openai = async (prompt, callback) => {
    let model = App.models[App.config.model]
    App.log(`Model: ${model.name}`)

    try {
      let client

      if (App.is_gpt()) {
        if (!App.openai_started) {
          return
        }

        client = App.openai_client
      }
      else if (App.is_gemini()) {
        if (!App.google_started) {
          return
        }

        client = App.google_client
      }
      else {
        return
      }

      let ans = await client.chat.completions.create({
        model: model.name,
        messages: [{role: `user`, content: prompt}],
        max_tokens: App.config.max_tokens,
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

  App.check_model = () => {
    if (!App.models[App.config.model]) {
      App.update_config(`model`, `reset`)
    }
  }

  App.is_gpt = () => {
    let model = App.models[App.config.model]
    return model.name.startsWith(`gpt-`)
  }

  App.is_gemini = () => {
    let model = App.models[App.config.model]
    return model.name.startsWith(`gemini-`)
  }
}