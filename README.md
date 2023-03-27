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

`auto_respond_probability` wil attempt to auto respond with this % chance.
Set it to 0 to disable it.

---

`instructions` Optional commands for the bot, they're prepended before the prompt.

For example: "Please respond in the style of Stewie from Family Guy"

```js
if (config.instructions) {
  prompt = config.instructions + ". " + prompt
}
```

---

![](https://i.imgur.com/H9yo8Jt.jpg)