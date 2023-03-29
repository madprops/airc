nodejs irc openai bot

---

## Installation

1) Clone this repo
1) Run 'npm install' inside the dir
1) Configure config.json
1) Export api key to environment
1) Run it with 'node bot.js'

---

## Configuration

The bot is confiuged by editing the config.json file before launching it.

---

`nickname`: irc nickname of the bot. 
Make sure it's not in use yet: `/whois nickname`,
and make sure it's not registered: `/msg nickserv info nickname`.

---

`server`: irc server to connect to.

---

`channels`: List of irc channels to join.

---

`model`: openai model to use.

---

`max_prompt_length`: Ignore prompts longer than this. Instructions length is not considered.

---

`autorespond`: The percentage chance (0 to 100) of whether the bot autoresponds after a message.

This only kicks in on normal comments that are sent right after the bot gave a response.

The idea is that these comments are likely reactions to what the bot said.

```
You: How much is 2 + 2?

Bot: 2 + 2 is 4.

You: That is correct...

* Bot rolls the dice *

Bot: I'm glad that 4 is the correct answer! 
```

The sent prompt looks like:

```js
let prompt = `You: "${prev_message}" Me: "${message}"`
```

Set it to 0 to disable it completely.

---

`instructions`: Optional commands for the bot, they're prepended before every prompt.

For example: "Please respond in the style of Stewie from Family Guy".

The code used to build the prompt looks like this:

```js
if (instructions) {
  prompt = instructions + ". " + prompt
}
```

---

`admins`: An array of irc nicknames that can control the bot through commands.

---

`silent`: If this is true it will ignore all mentions and won't send requests to openai. 
This is when you want the room to be quiet to avoid spam or to counter a raid. 
Admin commands are still active. Mainly meant to be set true or false through a command from a bot admin.

---

## Api Key

It reads the openai api key from the shell environment, it's not added to the code or config. You must do this before running the bot:

`export OPENAI_API_KEY=123mykey456`

Using your secret api key, which is not meant to be shared.

---

## Usage

The bot should join the irc room(s) some seconds after starting the program.

Address the bot in the room like this:

Format: `nickname[, or :] question`

`mybot, some question`

or 

`mybot: some question`

Nickname detection is case insensitive. `MyBot` and `mybot` work.

---

## Commands

Admins of the bot can issue commands to change some of its state.

Commands start with "!" and the bot's nickname must be mentioned.

For example: `mybot, !help`.

These are the available commands:

`!help`: Shows some information about commands.

`!instructions [x|empty]`: Sets instructions to x.
Instructions longer than 250 characters will be ignored.
If set to "empty" it will set it to an empty string.

`!silent [true|false]`: Sets silent to true or false.

`!autorespond [0-100]`: Sets autorespond to a number from 0 to 100.

`!ur [thing]`: Shortcut to set a personality.

`!ur a monkey` would set the instructions to `Please respond as if you were a monkey`.

Changes to config properties are saved to config.json

---

## Scripts

These are some script ideas you can use to manage the bot(s).

---

Start a bot:

```bash
#!/usr/bin/env bash
export OPENAI_API_KEY=123mykey456
while true; do nohup node /home/botguy/mybot/bot.js
done &
```

`nohup` makes the node process persist even after you log out of that session.

If it crashes it will auto-restart because of the while loop.

Change details accordingly.

---

Stop a bot:

```bash
#!/usr/bin/env bash
ps ax | grep -e "start_mybot.sh" -e "mybot/bot.js"| grep -v grep | awk '{print $1}' | xargs kill
```

This stops the start script and the bot process.

Change details accordingly.

--- 

Update bots:

```bash
#!/usr/bin/env bash
cd bot1 && git pull && cd
cd bot2 && git pull && cd
```

This won't work cleanly on config.json updates.

---

Restart bots:

```bash
#!/usr/bin/env bash
./stop_bot1.sh
./stop_bot2.sh
./start_bot1.sh
./start_bot2.sh
```

---

![](https://i.imgur.com/H9yo8Jt.jpg)