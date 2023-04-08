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

You need to have `Node.js` installed.

And be able to install packages through the `npm` commmand.

You will need an openai api key.

---

When you have that ready you can then do this:

---

1) Go to the dir where you want the bot to be
1) `git clone https://github.com/madprops/airc`
1) Rename the new dir (optional)
1) Get inside the new dir
1) Run `npm install` to install dependencies
1) Create and edit `config.user.json` (read [Configuration](#configuration))
1) Export api key to the environment (read [Credentials](#credentials))
1) Run it with `node bot.js` to test it
1) Create scripts to help you manage the bot (read [Scripts](#scripts))

---

## Configuration <a name="configuration"></a>

Before you edit `config.json` read this:

When `config.json` changes, it makes it hard for the bot admin to simply `git pull` for updates.

Since the config in the repo conflicts with their own config.

To solve this, a file called `config.user.json` is created at launch if it does not exist.

The format of both config files is the same, they're json objects.

The settings in `config.user.json` override whatever is set in `config.json`.

Override the required configs like the nickname and channels in `config.user.json`.

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

Either `text-davinci-003` or `gpt-3.5-turbo`.

davinci is more fun, can impersonate anything.

3.5 turbo is cheaper but a lot more filtered.

---

`max_prompt`: Ignore prompts longer than this.

Prompt is the text sent to openai to ask a question.

Rules length or context length are not considered.

---

`max_rules`: Maximum length allowed for rules.

---

`max_context`: How long the context used with `^` can be.

---

`max_tokens`: Maximum amount of tokens openai can play with. 

The bigger this is the bigger responses can be, but it gets more expensive.

---

`rules`: Optional instructions for the bot, they're prepended before every prompt.

For example: `Please respond in the style of Stewie from Family Guy`.

The code used to build the prompt looks like this:

```js
if (rules) {
  prompt = rules + "\n" + prompt
}
```

---

`users`: Array of nicknames. They might have more permissions than non-users.

What they can do can be determined through permissions.

---

`admins`: Array of nicknames. They can run all the commands.

They are able to add/remove users, and modify permissions.

---

`allow_ask`: Who is allowed to ask questions to the ai.

`allow_rules`: Who is allowed to modify the personality of the ai through rules.

These can be set to:

`all` -> Anybody.

`users` -> Users and up.

`admins` -> Admins only.

---

## Credentials <a name="credentials"></a>

The program reads the openai api key from the shell environment, it's not added to the code or config. 

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

If a message starts with `^`, the bot will use the previous message (from the bot) as context.

It does this by saving the last response from each channel.

This is the only way in which context/history is used.

---

**You**: What is 2 + 2 ?

**Bot**: 2 + 2 = 4

**You**: Bot, ^ that plus 1

**Bot**: That would be 5

---

There is a rate limit cooldown of some seconds after the last message.

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

`respond`: Shortcut to set the rules.

`respond like a lawyer` will set the rules to exactly that.

---

Shortcut to `rules default` is `reset`.

This empties the rules. Making the bot respond with its default personality.

---

`add user [nickname]`: Add a nickname to the users array. 

`remove user [nickname]`: Remove a nickname from the users array. 

---

`allow ask [all|users|admins]`: Change `ask` permission.

`allow rules [all|users|admins]`: Change `rules` permission.

---

`model [davinci|turbo]`: Change the openai model.

---

`max_prompt` | `max_rules` | `max_context` | `max_tokens`

Can be changed by providing a number as an argument:

`max prompt 200`

---

The value of any config can be read by simply writing its name with no arguments.

`rules` | `allow ask` | `users`

---

`join [channel]`: Joins an irc channel.

A password can be supplied: `join #somechannel somepassword`.

If the channel is not in the `channels` config it will be added.

---

`leave [channel]` or just `leave`: Leave an irc channel.

If the channel is in the `channels` config it will be removed.

---

There's a global `!report` command that causes all owned bots in the room to report.

Each bot also has an individual `report` command.

It shows how long ago the bot was launched, and how much memory it is using.

---

There's a `config` command that prints a summary of various settings.

---

Changes to any config are saved in `config.user.json`.

`config.json` is left intact.

---

If `default` is sent to a command as a value, it will remove the overriden value from `config.user.json`.

So the default in `config.json` is used.

---

All commands are ignored if the message ends with `?`.

Because most likely it's meant as a question for the ai.

---

## Scripts <a name="scripts"></a>

These are some script ideas you can use to manage the bot(s).

---

`start_mybot.sh`

```bash
#!/usr/bin/env bash
export OPENAI_API_KEY=mySecretKey
while true; do nohup node /home/botguy/mybot/bot.js
done &
```

`nohup` makes the node process persist even after you log out of that session (ssh).

If it crashes it will auto-restart because of the while loop.

Change details accordingly.

---

`stop_mybot.sh`

```bash
#!/usr/bin/env bash
ps ax | grep -e "start_mybot.sh" -e "mybot/bot.js"| grep -v grep | awk '{print $1}' | xargs kill
```

This stops the start script and the bot process.

Change details accordingly.

--- 

`update_airc.sh`

```bash
#!/usr/bin/env bash
cd && cd mybot && git pull
cd && cd otherbot && git pull
```

---

`restart_airc.sh`

```bash
#!/usr/bin/env bash
./stop_mybot.sh
./stop_otherbot.sh
./start_mybot.sh
./start_otherbot.sh
```

---

On updates I run this:

```bash
./update_airc.sh && ./restart_airc.sh
```

It fetches changes from the repo and restarts the bots.