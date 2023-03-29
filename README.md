<img src="https://i.imgur.com/H9yo8Jt.jpg" width="300">

This is a nodejs bot that allows users in irc channels to ask questions to openai.

It includes commands to alter the way the bot responds.

For example:

---

**You**: Bot, !ur an angry squirrel

**Bot**: Instructions have been set to: Please respond as if you were an angry squirrel

**You**: Bot, why are you in a tree?

**Bot**: Oh, you think it's funny, do you? Well, I'm in a tree because it is my home! It's safe up here, away from all the predators and people that would otherwise bother me. So don't you worry about why I'm in a tree - worry about why you're not!


---

## Index
1. [Installation](#installation)
1. [Configuration](#configuration)
1. [Credentials](#credentials)
1. [Usage](#usage)
1. [Commands](#commands)
1. [Scripts](#scripts)

---

## Installation <a name="installation"></a>

1) Clone this repo
1) Run 'npm install' inside the dir
1) Copy `config.json` to `config.user.json`
1) Edit `config.user.json`
1) Export api key to environment
1) Run it with 'node bot.js'

---

## Configuration <a name="configuration"></a>

Before you edit `config.json` read this:

When `config.json` changes, it makes it hard for the bot users to simply `git pull` all the time.

Since the config in the repo conflicts with their own config.

To solve this, a file called `config.user.json` is created at launch if it does not exist.

Edit what you need in the `config.user.json`, leave `config.json` intact, you can still use it as reference.

Now you can `git pull` for updates any time without worrying about conflicts.

---

These are the available settings:

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

`owners`: Array of nicknames. They can run all the commands.

They are able to add/remove admins, and modify permissions.

---

`admins`: Array of nicknames. They have access to some commands.

What they can do can be determined through permissions.

---

`commands_prefix`: The character used to invoke commands. Like `!help` if `!` or `.help` if `.`

---

`allow_ask`: Who is allowed to ask questions to the ai.

"all" -> anybody, "admins" -> admins and up, "owners" -> only owners.

---

`allow_modify`: Who is allowed to modify the personality of the ai through instructions.

"all" -> anybody, "admins" -> admins and up, "owners" -> only owners.

---

## Credentials <a name="credentials"></a>

It reads the openai api key from the shell environment, it's not added to the code or config. You must do this before running the bot:

`export OPENAI_API_KEY=mySecretKey`

Using your secret api key, which is not meant to be shared.

---

## Usage <a name="usage"></a>

The bot should join the irc room(s) some seconds after starting the program.

---

Address the bot in the room like this:

Format: `nickname[, or :] question`

`mybot, some question`

or 

`mybot: some question`

---

Nickname detection is case insensitive. `MyBot` and `mybot` work.

---

If a user writes `mybot, ^` or `mybot: ^`, the bot will use the previous message as the prompt.

```
Bob: What a lovely day

Bob: mybot, ^

mybot: Indeed, it's a nice day.
```

This is an alternative way to make the bot respond which might make sense in some cases.

---

The bot might autorespond in some cases if the autorespond config is greater than 0.

---

## Commands <a name="commands"></a>

Commands start with a prefix and the bot's nickname must be mentioned.

For example: `mybot, !help`.

---

These are the available commands:

---

`help`: Shows some information about commands.

---

`instructions [x|clear]`: Sets instructions to x.

Instructions longer than 250 characters will be ignored.

If `clear` it will set it to an empty string.

---

`reset`: This is a shortcut to `instructions clear`.

---

`autorespond [0-100]`: Sets autorespond to a number from 0 to 100.

---

`ur [thing]`: Shortcut to set a personality.

`ur a monkey` would set the instructions to `Please respond as if you were a monkey`.

---

`admins [add|remove] [nickname]`: Add or remove a nickname from the admins array. 

`admins [clear]`: Empty the admins array.

---

`allow_ask [all|admins|owners]`: Change "ask" permission.

`allow_modify [all|admins|owners]`: Change "instructions" permission.

These can only be performed by `owners`.

---

Changes to config properties are saved in `config.user.json`

---

## Scripts <a name="scripts"></a>

These are some script ideas you can use to manage the bot(s).

---

Start a bot:

```bash
#!/usr/bin/env bash
export OPENAI_API_KEY=mySecretKey
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

---

Restart bots:

```bash
#!/usr/bin/env bash
./stop_bot1.sh
./stop_bot2.sh
./start_bot1.sh
./start_bot2.sh
```