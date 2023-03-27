Simple nodejs irc openai bot.

---

## Installation

1) Clone this repo
1) Run 'npm install' inside the dir
1) Configure config.json
1) Export api key to environment
1) Run it with 'node bot.js'

---

It reads the api key from the environment:

`export OPENAI_API_KEY=123mykey456`

---

Address the bot with:

`mybot, some question`

or 

`mybot: some question`

---

## Config

`nickname`: irc nickname.

---

`server`: irc server.

---

`channels`: List of irc channels to join.

---

`model`: openai model to use.

---

`max_prompt_length`: Ignore prompts longer than this. Instructions length is not considered.

---

`auto_respond_probability`: The percentage chance (1 to 100) of whether the bot autoresponds after a message.

This only kicks on normal comments that are sent right after the bot gave a response.

The idea is that these comments are likely reactions to what the bot said.

```
You: How much is 2 + 2?

Bot: 2 + 2 is 4.

You: That is correct...

* Bot rolls the dice *

Bot: I'm glad that 4 is the correct answer! 
```

Set it to 0 to disable it.

---

`instructions`: Optional commands for the bot, they're prepended before the prompt.

For example: "Please respond in the style of Stewie from Family Guy"

The code used to build the prompt looks like this:

```js
if (config.instructions) {
  prompt = config.instructions + ". " + prompt
}
```

---

![](https://i.imgur.com/H9yo8Jt.jpg)