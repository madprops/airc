module.exports = function (App) {
  App.start_openai = function () {
    let configuration = new App.openai.Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
  
    App.openai_client = new App.openai.OpenAIApi(configuration)
    console.info("Started openai")
  }
}