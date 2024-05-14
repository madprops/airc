module.exports = (App) => {
  App.models = {
    turbo: {
      name: `gpt-3.5-turbo`,
    },
    gpt_4o: {
      name: `gpt-4o`,
    },
  }

  App.start_openai = () => {
    // Check if model is still supported
    if (!App.models[App.config.model]) {
      App.update_config(`model`, `reset`)
    }

    App.openai_client = new App.i.openai({
      apiKey: process.env[`OPENAI_API_KEY`],
    })
  }

  App.ask_openai = async (prompt, callback) => {
    let model = App.models[App.config.model]
    App.log(`Model: ${model.name}`)

    try {
      let ans = await App.openai_client.chat.completions.create({
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
}