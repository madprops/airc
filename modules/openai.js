module.exports = (App) => {
  App.models = {
    davinci: {
      name: `text-davinci-003`,
      method: 1,
    },
    turbo_instruct: {
      name: `gpt-3.5-turbo-instruct`,
      method: 1,
    },
    turbo: {
      name: `gpt-3.5-turbo`,
      method: 2,
    },
  }

  App.start_openai = () => {
    // Check if model is still supported
    if (!App.models[App.config.model]) {
      App.update_config(`model`, `reset`)
    }

    let configuration = new App.i.openai.Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })

    App.openai_client = new App.i.openai.OpenAIApi(configuration)
    App.log(`Started openai`)
  }

  App.ask_openai = async (prompt, callback) => {
    let model = App.models[App.config.model]
    App.log(`Model: ${model.name} | Method: ${model.method}`)

    try {
      if (model.method === 1) {
        let ans = await App.openai_client.createCompletion({
          model: model.name,
          prompt: prompt,
          max_tokens: App.config.max_tokens,
        })

        if (ans.status === 200) {
          let text = ans.data.choices[0].text.trim()

          if (text) {
            callback(text)
          }
        }
      }

      else if (model.method === 2) {
        let ans = await App.openai_client.createChatCompletion({
          model: model.name,
          messages: [{role: `user`, content: prompt}],
          max_tokens: App.config.max_tokens,
        })

        if (ans.status === 200) {
          let text = ans.data.choices[0].message.content.trim()

          if (text) {
            callback(text)
          }
        }
      }
    }
    catch (err) {
      App.log(err, `error`)
    }
  }
}