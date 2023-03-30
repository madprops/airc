module.exports = function (App) {
  App.start_openai = function () {
    let configuration = new App.openai.Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
  
    App.openai_client = new App.openai.OpenAIApi(configuration)
    console.info("Started openai")
  }
  
  App.ask_openai = async function (prompt, to) {
    prompt = prompt.trim()
  
    if (prompt.length > App.config.max_prompt) {
      return
    }
  
    // Remove periods at the end and trim
    let rules = App.remove_dots(App.config.rules)
  
    if (rules) {
      prompt = rules + ". " + prompt
    }
  
    try {
      let ans = await App.openai_client.createCompletion({
        model: App.config.model,
        prompt: prompt,
        max_tokens: App.config.max_tokens
      })
  
      if (ans.status === 200) {
        let text = ans.data.choices[0].text
    
        if (text) {
          App.irc_client.say(to, text)
        }
      }
    }
    catch (err) {
      console.error("openai completion error")
    }
  }  
}