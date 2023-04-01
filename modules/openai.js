module.exports = function (App) {
  App.start_openai = function () {
    let configuration = new App.openai.Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })

    App.openai_client = new App.openai.OpenAIApi(configuration)
    console.info("Started openai")
  }

  App.ask_openai = async function (rules, context, prompt, callback) {
    let messages = []

    if (rules) {
      messages.push({"role": "system", "content": rules})
    }

    if (context && context.length > 0) {
      for (let c of context) {
        messages.push({"role": "assistant", "content": c})
      }
    }

    messages.push({"role": "user", "content": prompt})
    
    console.info("---")
    console.info(messages)

    try {
      let ans = await App.openai_client.createChatCompletion({
        model: App.model,
        messages: messages,
        max_tokens: App.config.max_tokens
      })

      if (ans.status === 200) {
        let text = ans.data.choices[0].message.content.trim()

        if (text) {
          callback(text)
        }
      }
    }
    catch (err) {
      console.error("openai error")
    }
  }
}