export default (App) => {
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

  App.get_client = async (channel) => {
    if (App.is_gpt()) {
      if (!App.openai_started) {
        App.irc_respond(channel, `OpenAI API Key is missing.`)
        return [undefined, `none`]
      }

      return [App.openai_client, `gpt`]
    }
    else if (App.is_gemini()) {
      if (!App.google_started) {
        App.irc_respond(channel, `Google API Key is missing.`)
        return [undefined, `none`]
      }

      return [App.google_client, `gemini`]
    }

    if (App.llama && (App.loaded_model === App.config.model)) {
      return [App.llama, `local`]
    }

    if (!App.i.get_llama) {
      App.irc_respond(channel, `Llama is not supported. Install the optional dependencies.`)
      return [undefined, `none`]
    }

    App.llama = await App.i.get_llama()

    App.llama_model = await App.llama.loadModel({
      modelPath: App.config.model,
    })

    App.loaded_model = App.config.model
    App.log(`Llama model loaded: ${App.config.model}`)
    return [App.llama_model, `local`]
  }

  App.set_session_history = (channel) => {
    let items = App.context[channel]

    if (!items || !items.length) {
      return
    }

    let history = []

    for (let item of items) {
      history.push({type: `user`, text: item.user})
      history.push({type: `model`, response: [item.ai]})
    }

    App.llama_session.setChatHistory(history)
  }

  App.ask_ai = async (messages, channel, callback) => {
    if (App.check_working()) {
      return
    }

    let model = App.config.model

    if (App.debug) {
      App.log(`Text Gen: ${model}`)
    }

    try {
      let [client, type] = await App.get_client(channel)

      if (!client) {
        return
      }

      App.working = true

      let text

      if (type === `local`) {
        let context = await App.llama_model.createContext()
        let seq = context.getSequence()
        let sysprompt = App.get_sysprompt(messages)

        App.llama_session = new App.i.LlamaChatSession({
          contextSequence: seq,
          systemPrompt: sysprompt,
        })

        App.set_session_history(channel)
        let prompt = messages.at(-1).content
        text = await App.llama_session.prompt(prompt, {
          maxTokens: App.config.max_tokens,
        })
      }
      else {
        let ans = await client.chat.completions.create({
          model,
          max_completion_tokens: App.config.max_tokens,
          messages,
        })

        if (ans && ans.choices) {
          text = ans.choices[0].message.content.trim()
        }
      }

      if (text) {
        callback(text)
      }

      App.working = false
    }
    catch (err) {
      App.log(err, `error`)
      App.working = false
    }
  }

  App.make_image = async (prompt, callback) => {
    if (App.check_working()) {
      return
    }

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

      App.working = true

      let ans = await client.images.generate({
        n: 1,
        model,
        size,
        prompt,
      })

      if (ans && ans.data) {
        callback(ans.data[0].url)
      }

      App.working = false
    }
    catch (err) {
      App.log(err, `error`)
      App.working = false
    }
  }

  App.check_working = () => {
    return App.working && !App.config.multiprocess
  }

  App.get_sysprompt = (messages) => {
    for (let item of messages) {
      if (item.role === `system`) {
        return item.content
      }
    }

    return ``
  }
}