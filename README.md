<img src="https://i.imgur.com/H9yo8Jt.jpg" width="420">

This is a nodejs bot that allows users in irc channels to ask questions to openai.

It supports [rules](#rules), [commands](#commands), [permissions](#permissions), and [context](#context).

---

This is meant to be used with a group of people in an irc channel.

It works as an assistant for general knowledge questions, or just for fun.

It's easy to create multiple bots with different personalities.

It requires a paid openai api key.

---

## Index
1. [Installation](#installation)
1. [Configuration](#configuration)
1. [Credentials](#credentials)
1. [Usage](#usage)
1. [Commands](#commands)
1. [Manage](#manage)

---

## Installation <a name="installation"></a>

You need to have [Node.js](https://nodejs.org/) installed.

You need to have [Git](https://docs.github.com/en/get-started/using-git/about-git) installed.

You will also need an [openai](https://openai.com/) api key.

---

When you have that ready you can then do this:

---

1) Go to the dir where you want the bot to be
1) `git clone --depth 1 https://github.com/madprops/airc`
1) Get inside the new airc dir `cd airc`
1) Run `npm install` to install the node dependencies
1) Create the first config file in `/configs` (read [Configuration](#configuration))
1) Export api key to the environment (read [Credentials](#credentials))
1) Run it with `node bot.js somebot` and check that it works
1) Check that the bot has read/write permissions on the config files
1) Create scripts to help you manage the bots (read [Manage](#manage))

---

## Configuration <a name="configuration"></a>

You can create many bots from a single installation.

Simply create `json` files inside `/configs` that override the defaults in `config.json`.

For example:

```json
{
  "nickname": "Skeletor",
  "avatar": "💀",
  "channels": [
    "#eternia"
  ],
  "admins": [
    "Marshall"
  ]
}
```

(Remember to make yourself an admin)

Save that file as `/configs/skeletor.json`.

Then start the bot like `node bot.js skeletor`.

Of course you can use any name.

More bots can be added simply by adding more configs.

But each config is started individually with their own process.

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

`port`: The irc port to use.

This is used when connecting to an irc server.

---

`model`: Which openai model to use.

Either `turbo_instruct`, `turbo`, or `davinci`.

Edit: `davinci` is going to be deprecated early 2024 by openai.

The default is now `turbo_instruct`.

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

It gives your bots some personality.

---

`show_avatar`: Whether to show the avatar or not.

---

`autorespond`: Probability % to talk by itself. From 0 to 100.

If set to 0 it will never autorespond.

Autorespond is triggered by normal messages from users.

---

`autorespond_cooldown`: Stop the bot from autoresponding for at least these minutes after the last autorespond.

---

`autorespond_words`: The max amount of words autorespond should aim for.

If set to `0` it won't use a limit.

---

`command_char`: The character used to run commands like `!`.

`context_char`: The character used to use context like `^`.

`mention_char`: The character used to mention users like `@`.

---

`words`: The max amount of words normal bot responses should aim for.

If set to `0` it won't use a limit.

---

## Permissions <a name="permissions"></a>

Access to ai and rules can be defined.

This is controlled by the `allow_ask` and `allow_rules` configs.

These can be set to: `all`, `users`, or `admins`.

For instance, if `allow_ask` is set to `users`, only added users (and admins) can ask questions to the ai.

If `allow_rules` is set to `all`, any user in the room can change the bot's rules with `!ur`.

If they're set to `admins` only admins can use the bot at all.

You can edit these through the bot: `mybot, !allow_ask all`.

Check current permissions with `!config` or directly: `!allow_rules`.

Assign permissions in whatever way they make sense.

Some bots are meant to be fixed, others might be more dynamic, others might belong to certain users.

---

## Users <a name="users"></a>

There is a `users` config that holds a list of irc nicknames.

They are only used to define access to certain bot features.

They are used in the `allow_ask` and `allow_rules` configs.

If these are set to `users`, only nicknames in the list have access.

They can be added and removed with `!add_user` and `!remove_user`.

---

## Admins <a name="admins>

Admins can perform any action on the bot.

They are responsible for configuring the bot and assigning permissions.

Admins are manually added to the `admins` config.

This config can't be modified through commands.

And it won't get resetted when using `!reset`.

Make sure to add your own nickaname(s) to this list.

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

If a message ends with `@somenickname`, the response will be directed at that nickname.

**You**: Bot, What is 2 + 2 @Sam

**Bot**: 🤖 Sam: 2 + 2 = 4

---

If `autorespond` % is between `1` and `100`, there's a chance the bot will talk by itself.

Autorespond has a cooldown, to avoid frequent replies.

---

There's an automatic anti-spam system that bans users who abuse the bot.

---

## Context <a name="context"></a>

If a message starts with `^`, the bot will use the previous question-answer as context:

**You**: Bot, What is 2 + 2 ?

**Bot**: 🤖 2 + 2 = 4

**You**: Bot, ^ that plus 1

**Bot**: 🤖 That would be 5

---

It only supports 1 level of context (the previous interaction).

---

## Rules <a name="rules"></a>

The behavior of a bot can be altered through the `!ur` command.

`ur` meaning something like `you are` but shorter.

This edits the `rules` config, which is prepended before every prompt.

---

**You**: Bot, !ur an angry squirrel

**Bot**: 🤖 Rules: Respond as if you were an angry squirrel

**You**: Bot, why are you in a tree?

**Bot**: 🤖 Oh, you think it's funny, do you? Well, I'm in a tree because it is my home! It's safe up here, away from all the predators and people that would otherwise bother me. So don't you worry about why I'm in a tree - worry about why you're not!

---

To have a vanilla openai bot again (no rules) use `!reset rules`.

---

## Commands <a name="commands"></a>

The bot listens to commands when it is mentioned and `!` is used at the start of the message.

For example: `mybot, !help`.

For example: `mybot, !add_user joe`.

For example: `mybot, !reset rules`.

---

Most configs can be edited through commands. For example:

`!allow_ask all`

`!autorespond 10`

`!avatar 🌴`

---

The value of any config can be read by simply writing its name with no arguments.

`!rules` | `!allow_ask` | `!users`

---

`!ur [thing]`: Set a personality through rules.

`!ur a monkey` would set the rules to `Respond as if you were a monkey`.

See [rules](#rules)

---

`!add_user [nickname]`: Add a nickname to the users array.

`!remove_user [nickname]`: Remove a nickname from the users array.

See [permissions](#permissions)

---

`!join [channel]`: Joins an irc channel.

A password can be supplied: `!join #somechannel somepassword`.

If the channel is not in the `channels` config it will be added.

---

`!leave [channel]` or just `!leave`: Leave an irc channel.

If the channel is in the `channels` config it will be removed.

---

`!ban [nickname]`: Manually ban a user.

`!unban [nickname]`: Manually unban a user.

---

`!reset [config | all]`: Reset a config by removing it from `/configs/botname.json`.

`!reset all` Removes all overriden configs except `server`, `channels`, `port`, and `nickname`.

---

`!config`: Prints a summary of various configs.

This shows a quick overview of what the bot can do.

---

`!report`: It shows how long ago the bot was launched, and how much memory it is using.

---

Owned bots respond to a global `!cmd`.

This can be used to check or change values to all bots at the same time.

For example:

`!cmd words 50`: This changes all owned bots's `words` config to 50.

`!cmd rules`: This displays the rules of all bots.

`!cmd report`: Get an overview of your bots.

(Don't mention a bot when using these, they're global commands)

---

Changes to any config through commands are saved automatically in `/configs/botname.json`.

`config.json` is left intact and used for default values.

---

There's a similarity check to allow minor typos in command names and values.

---

## Manage <a name="manage"></a>

I now use PM2 to manage the bots.

The following config might be useful:

```js
let commmon = {
  script: `airc/bot.js`,
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: `1G`,
  env: {
    NODE_ENV: `production`,
    OPENAI_API_KEY: `secretKey`
  },
  env_production: {
    NODE_ENV: `production`
  },
}

function bot (name) {
  return Object.assign({}, commmon, {
    name: `airc_${name}`,
    args: name,
  })
}

let names = [
  `bot1`,
  `bot2`,
]

let apps = []

for (let name of names) {
  apps.push(bot(name))
}

module.exports = {
  apps: apps
}
```