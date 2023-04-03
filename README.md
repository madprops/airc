<img src="https://i.imgur.com/H9yo8Jt.jpg" width="350">

This is a nodejs bot that allows users in irc channels to ask questions to openai.

It includes commands to alter the way the bot responds.

For example:

---

**You**: Bot, you're an angry squirrel

**Bot**: Rules: Respond as if you were an angry squirrel

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
1) Create and edit `config.user.json`
1) Export api key to environment
1) Run it with 'node bot.js'

---

## Configuration <a name="configuration"></a>

Before you edit `config.json` read this:

When `config.json` changes, it makes it hard for the bot admin to simply `git pull` for updates.

Since the config in the repo conflicts with their own config.

To solve this, a file called `config.user.json` is created at launch if it does not exist.

The format of both config files is the same, they're json objects.

The settings in `config.user.json` override whatever is set in `config.json`.

Leave `config.json` intact, you can still use it as reference.

Now you can `git pull` for updates any time without worrying about conflicts.


---

These are the available settings:

---

`nickname`: irc nickname of the bot. 

Make sure it's not in use yet: `/whois nickname`.

And make sure it's not registered: `/msg nickserv info nickname`.

---

`server`: irc server to connect to.

---

`channels`: List of irc channels to join.

---

`model`: Which openai model to use.

Either "text-davinci-003" or "gpt-3.5-turbo".

davinci is more fun, can impersonate anything.

3.5 turbo is cheaper but a lot more filtered.

---

`max_prompt`: Ignore prompts longer than this.

Prompt is the text sent to openai to ask a question.

Rules length is not considered.

---

`max_tokens`: Maximum amount of tokens openai can play with. 

The bigger this is the bigger responses can be, but it gets more expensive.

---

`max_rules`: Maximum length allowed for rules.

```

`rules`: Optional instructions for the bot, they're prepended before every prompt.

For example: "Please respond in the style of Stewie from Family Guy".

The code used to build the prompt looks like this:

```js
if (rules) {
  prompt = rules + "\n" + prompt
}
```

---

`admins`: Array of nicknames. They can run all the commands.

They are able to add/remove users, and modify permissions.

---

`users`: Array of nicknames. They might have more permissions than non-users.

What they can do can be determined through permissions.

---

`allow_ask`: Who is allowed to ask questions to the ai.

`allow_rules`: Who is allowed to modify the personality of the ai through rules.

These can be set to:

`all` -> Anybody.

`users` -> Users and up.

`admins` -> Admins only.

---

## Credentials <a name="credentials"></a>

It reads the openai api key from the shell environment, it's not added to the code or config. 

You must do this before running the bot:

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

Or with some words:

```
Bob: I wonder what 2 + 2 is

Bob: mybot, ^ that plus 1

mybot: 2 + 2 is 4 plus 1 it's 5.
```

This is an alternative way to make the bot respond which might make sense in some cases.

---

There's a rate limit cooldown of some seconds after the last message.

This is to avoid attacks or mistakes.

Only admins bypass this check.

---

## Commands <a name="commands"></a>

The bot listens to commands when mentioned.

For example: `mybot, help`.

---

These are the available commands:

---

`you're [thing]`: Shortcut to set a personality.

`you're a monkey` would set the rules to `Respond as if you were a monkey`.

Aliases to this are: `ur`, `you are`.

---

`rules [x|clear]`: Sets rules to x.

Rules longer than 250 characters will be ignored.

If `clear` it will set it to an empty string.

Shortcut to `rules clear` is `reset`.

---

`who are you?`: Alternative to read the `rules`.

`what are you?`: Alternative to read the `rules`.

---

`users [add|remove] [nickname]`: Add or remove a nickname from the users array. 

`users [clear]`: Empty the users array.

---

`allow ask [all|users|admins]`: Change "ask" permission.

`allow rules [all|users|admins]`: Change "rules" permission.

---

`model [davinci|turbo]`: Change the openai model.

---

There's a global !report command that causes all instances to report.

Each bot also has an individual `report` command.

---

There's a `config` command that prints a summary of various settings.

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
cd && cd bot1 && git pull
cd && cd bot2 && git pull
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