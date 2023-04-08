module.exports = function (App) {
  App.start_openai = function () {
    let configuration = new App.i.openai.Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })

    App.openai_client = new App.i.openai.OpenAIApi(configuration)
    console.info("Started openai")
  }

  App.ask_openai = async function (prompt, callback) {
    let model = App.get_model()

    try {
      if (model.method === 1) {
        let ans = await App.openai_client.createCompletion({
          model: App.config.model,
          prompt: prompt,
          max_tokens: App.config.max_tokens
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
          model: App.config.model,
          messages: [{role: "user", content: prompt}],
          max_tokens: App.config.max_tokens
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
      console.error("openai completion error")
    }
  }
}