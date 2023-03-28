module.exports = function (App) {
  App.start_openai = async function () {
    let configuration = new App.openai.Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
  
    App.openai_client = new App.openai.OpenAIApi(configuration)
  }
  
  App.ask_openai = async function (prompt, to) {
    prompt = prompt.trim()
  
    if (prompt.length > App.config.max_prompt_length) {
      return
    }
  
    // Remove periods at the end and trim
    let ins = App.config.instructions.trim().replace(/\.+$/, "").trim()
  
    if (ins) {
      prompt = ins + ". " + prompt
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