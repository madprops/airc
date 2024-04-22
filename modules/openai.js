module.exports = (App) => {
  App.models = {
    turbo_instruct: {
      name: `gpt-3.5-turbo-instruct`,
      method: 1,
    },
    turbo: {
      name: `gpt-3.5-turbo`,
      method: 2,
    },
    gpt_4: {
      name: `gpt-4`,
      method: 2,
    },
    gpt_4_turbo: {
      name: `gpt-4-turbo-preview`,
      method: 2,
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
    App.log(`Model: ${model.name} | Method: ${model.method}`)

    try {
      if (model.method === 1) {
        let ans = await App.openai_client.chat.completions.create({
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
    }
    catch (err) {
      App.log(err, `error`)
    }
  }
}