<img src="https://i.imgur.com/H9yo8Jt.jpg" width="350">

This is a nodejs bot that allows users in irc channels to ask questions to openai.

It includes commands to alter the way the bot responds.

For example, here's using the `!ur` command:

---

**You**: Bot, !ur an angry squirrel

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

You need to have [Node.js](https://nodejs.org/) installed.

You need to have [Git](https://docs.github.com/en/get-started/using-git/about-git) installed.

You will also need an [openai](https://openai.com/) api key.

---

When you have that ready you can then do this:

---

1) Go to the dir where you want the bot to be
1) `git clone --depth 1 https://github.com/madprops/airc mybot`
1) Get inside the new mybot dir (or however you named it)
1) Run `npm install` to install the node dependencies
1) Create and edit `config.user.json` (read [Configuration](#configuration))
1) Export api key to the environment (read [Credentials](#credentials))
1) Run it with `node bot.js` and check that it works
1) Check that the bot has read/write permissions on the config files
1) Create scripts to help you manage the bot (read [Scripts](#scripts))

---

## Configuration <a name="configuration"></a>

Before you edit `config.json` read this:

When `config.json` changes, it makes it hard for the bot admin to simply `git pull` for updates.

Since the config in the repo conflicts with their own config.

To solve this, a file called `config.user.json` is created at launch if it does not exist.

The format of both config files is the same, they're json objects.

The configs in `config.user.json` override whatever is set in `config.json`.

Override the required configs like the nickname and channels in `config.user.json`.

Leave `config.json` intact, you can still use it as reference.

Now you can `git pull` for updates any time without worrying about conflicts.

Another reason to not touch `config.json` is that it serves as defaults fallback.

---

These are the available configs:

---

`nickname`: irc nickname of the bot.

Make sure it's not in use yet: `/whois nickname`.

And make sure it's not registered by another person: `/msg nickserv info nickname`.

---

`server`: irc server to connect to.

For example `irc.libera.chat`.

---

`channels`: Array of irc channels to join.

These can contain passwords: `#mychannel channelpass`.

---

`model`: Which openai model to use.

Either `davinci` or `turbo`.

davinci is more fun, can impersonate anything.

turbo is cheaper but a lot more filtered.

---

`max_prompt`: Ignore prompts longer than this.

Prompt is the text sent to openai to ask a question.

Rules length or context length are not considered.

If longer, the remainder is trimmed out.

---

`max_rules`: Maximum length allowed for rules.

If longer, the remainder is trimmed out.

---

`max_context`: How long the context used with `^` can be.

If longer, the remainder is trimmed out.

---

`max_tokens`: Maximum amount of tokens openai can play with.

The bigger this is the bigger responses can be, but it gets more expensive.

---

`rules`: Instructions for the bot. They're prepended before every prompt.

Users change this through the `ur` and `rules` commands.

---

`users`: Array of nicknames. They might have more permissions than non-users.

What they can do can be determined through permissions.

---

`admins`: Array of nicknames. They can run all the commands.

They are able to add/remove users, modify permissions, and change other configs.

---

`allow_ask`: Who is allowed to ask questions to the ai.

`all` | `users` | `admins`

---

`allow_rules`: Who is allowed to modify the personality of the ai through rules.

`all` | `users` | `admins`

---

`all` -> Anybody.

`users` -> Users and up.

`admins` -> Admins only.

---

`spam_limit`: Ban a user after reaching this spam level.

Spam level is increased by 1 on each bot mention.

Spam level gets decreased by 1 every second or so.

`spam_minutes`: Ban a user for these minutes after it reaches the limit.

---

`compact`: Enable or disable compact mode.

Instead of printing new lines on ai response, lines are joined with the `avatar`.

This allows a more compact output.

If this is disabled, the output will leave the newlines as is.

---

`avatar`: Like `👾`.

This appears at the start of messages and in between lines.

It's recommended to make this an emoji character.

---

`show_avatar`: Whether to show the avatar at the start or not.

---

`autorespond`: Probability % to talk by itself. From 0 to 100.

---

`autorespond_prompts`: This is a list of prompts autorespond can use.

An item is picked at random every time autorespond triggers.

These strings can have special tokens:

{{date}}, {{noun}}, {{a_noun}}, {{adjective}}, and {{an_adjective}}.

It replaces each token with an appropriate random word.

For instance `Take this {{noun}}` could be `Take this hammer`.

`I need {{a_noun}}` could be `I need a plane`.

{{a_noun}} and {{an_adjective}} use `a` or `an` automatically.

{{date}} uses today's date like `May 11`.

---

`command_char`: The character used to run commands like `!`.

`context_char`: The character used to use context like `^`.

`mention_char`: The character used to mention users like `@`.

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

If a message starts with `^`, the bot will use the previous message from itself as context:

**You**: Bot, What is 2 + 2 ?

**Bot**: 2 + 2 = 4

**You**: Bot, ^ that plus 1

**Bot**: That would be 5

---

If a message ends with `@somenickname`, the response will be directed at that nickname.

**You**: Bot, What is 2 + 2 @Sam

**Bot**: Sam: 2 + 2 = 4

---

If `autorespond` % is between `1` and `100`, there's a chance the bot will talk by itself.

Autorespond has a cooldown, to avoid frequent replies.

---

There's an automatic anti-spam system that bans users who abuse the bot.

---

## Commands <a name="commands"></a>

The bot listens to commands when it is mentioned and `!` is used at the start of the message.

For example: `mybot, !help`.

For example: `mybot, !add_user joe`.

For example: `mybot, !reset rules`.

---

If a user is allowed to change the rules, it gets access to rules-related commands.

If a user is an admin it gets access to all commands.

These are the available commands:

---

`ur [thing]`: Set a personality through rules.

`ur a monkey` would set the rules to `Respond as if you were a monkey`.

---

`add_user [nickname]`: Add a nickname to the users array.

`remove_user [nickname]`: Remove a nickname from the users array.

---

Most configs can be edited through commands. For example:

`!allow_ask true`

`!autorespond 10`

`!avatar 🌴`

---

The value of any config can be read by simply writing its name with no arguments.

`rules` | `allow_ask` | `users`

---

`join [channel]`: Joins an irc channel.

A password can be supplied: `join #somechannel somepassword`.

If the channel is not in the `channels` config it will be added.

---

`leave [channel]` or just `leave`: Leave an irc channel.

If the channel is in the `channels` config it will be removed.

---

`ban [nickname]`: Manually ban a user.

`unban [nickname]`: Manually unban a user.

---

`reset [config | all]`: Reset a config by removing it from `config.user.json`.

`reset all` Removes all overriden configs except `server`, `channels`, and `nickname`.

---

There's a global `!report` command that causes all owned bots in the room to report.

Each bot also has an individual `report` command.

It shows how long ago the bot was launched, and how much memory it is using.

![](https://i.imgur.com/BJKrcAI.jpg)

---

There's a `config` command that prints a summary of various configs.

This shows a quick overview of what the bot can do.

There's also a global `!config` command.

---

Changes to any config through commands are saved automatically in `config.user.json`.

`config.json` is left intact and used for default values.

---

All commands are ignored if the message ends with `?`.

Because most likely it's meant as a question for the ai.

---

There's a similarity check to allow minor typos in command names and values.

---

## Scripts <a name="scripts"></a>

These are some script ideas you can use to manage the bot(s).

---

`start_airc.sh`

```bash
#!/usr/bin/env bash
export OPENAI_API_KEY=mySecretKey
while true; do nohup node /home/botdude/$1/bot.js
done &
```

Send the name of the bot dir as an argument.

`nohup` makes the node process persist even after you log out of that session (ssh).

If it crashes it will auto-restart because of the while loop.

Change details accordingly.

---

`stop_airc.sh`

```bash
#!/usr/bin/env bash
ps ax | grep -e "start_airc.sh $1" -e "$1/bot.js"| grep -v grep | awk '{print $1}' | xargs kill
```

Send the name of the bot dir as an argument.

This stops the start script and the bot process.

Change details accordingly.

---

`update_airc.sh`

```bash
#!/usr/bin/env bash
cd && cd mybot && git pull && npm install
cd && cd otherbot && git pull && npm install
```

---

`restart_airc.sh`

```bash
#!/usr/bin/env bash
./stop_airc.sh mybot
./stop_airc.sh otherbot

./start_airc.sh mybot
./start_airc.sh otherbot
```

---

On updates I run this:

```bash
./update_airc.sh && ./restart_airc.sh
```

It fetches changes from the repo and restarts the bots.