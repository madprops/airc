<img src="https://i.imgur.com/H9yo8Jt.jpg" width="420">

---

This is a [Node.js](https://nodejs.org/) bot
for [irc](https://en.wikipedia.org/wiki/Internet_Relay_Chat)
that interfaces with `OpenAI` or `Google`.

It supports [rules](#rules), [commands](#commands),
[permissions](#permissions), [autorespond](#autorespond), [anti-spam](#antispam).

---

This is meant to be used with a group of people in an irc channel.

It works as an assistant for general knowledge questions, or just for fun.

It's easy to create multiple bots with different personalities.

It requires a `OpenAI` api key, and/or a `Google` api key.

Some good ideas provided by `spynxic`.

---

## Index
1. [Installation](#installation)
1. [Configuration](#configuration)
1. [Credentials](#credentials)
1. [Usage](#usage)
1. [Commands](#commands)
1. [Manage](#manage)
1. [Rules](#rules)
1. [Permissions](#permissions)
1. [Users](#users)
1. [Admins](#admins)
1. [Autorespond](#autorespond)
1. [MultiProcess](#multiprocess)
1. [Markdown](#markdown)
1. [Lists](#lists)
1. [Talk](#talk)
1. [Anti-Spam](#antispam)
1. [Image](#image)

---

## Installation <a name="installation"></a>

You need to have [Node.js](https://nodejs.org/) installed.

You need to have [Git](https://docs.github.com/en/get-started/using-git/about-git) installed.

You will also need an [OpenAI](https://openai.com/) api key,
or a [Google](https://aistudio.google.com/apikey) api key.

---

If you are running this on some sort of server:

You might want to have a dedicated system user to handle the bots to avoid using root.

You can name it `botdude` for example, or just use a user that isn't root.

---

1. Go to the parent directory where you want the airc directory to be created
1. Clone the repo: `git clone --depth 1 https://github.com/madprops/airc`
1. Get inside the new directory: `cd airc`
1. Install `yarn` if you don't have it: `npm install -g yarn`
1. Install the node dependencies: `yarn install`
1. Create the first bot in `/configs` (read [Configuration](#configuration))
1. Export the api key to the environment (read [Credentials](#credentials))
1. Run the bot with `node bot.js mybot` and check that it can connect
1. Check that the bot has read/write permissions on the config files
- You can do this by changing a config like the avatar with `mybot, !avatar 😎`
- Then check that the avatar config was updated in `/configs/mybot.json`

---

Read [Commands](#commands) to learn how to manage your bots from irc.

Read [Manage](#manage) to learn more about managing airc.

---

## Configuration <a name="configuration"></a>

You can create many bots from a single installation.

Simply create `json` files inside `/configs` that override the defaults.

All the defaults are defined in [config.json](config.json). You shouldn't edit this file.

Use [config.json](config.json) as a reference only.

For example, this is a bot: `configs/skeletor.json` :

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

Override only the configs you need, you don't need to define all.

Remember to add yourself as an admin.

Then start the bot with `node bot.js skeletor`.

Of course, you can name the files anything.

Each `json` file inside `/configs` is a bot.

Bots have to be started and stopped manually by you.

Each bot is started individually with its own process.

When you modify configs through commands the files get updated automatically.

---

These are the available configs:

---

`nickname` : irc nickname of the bot.

Make sure it's not in use yet: `/whois nickname`.

And make sure it's not registered by another person: `/msg nickserv info nickname`.

---

`server` : irc server to connect to.

For example `irc.libera.chat`.

---

`channels` : Array of irc channels to join.

These can contain passwords: `#mychannel channelpass`.

---

`port` : The irc port to use.

This is used when connecting to an irc server.

---

`model` : Which ChatGPT or Gemini model to use.

Give the exact model name, like `gpt-3.5-turbo`, or `gemini-1.5-pro`.

---

`context`: Max number of context levels to remember.

Each item is a prompt and its response.

---

`max_prompt` : Ignore prompts longer than this.

The prompt is the text sent to openai to ask a question.

Rules length or context length are not considered.

If longer, the remainder is trimmed out.

---

`max_rules` : Maximum length allowed for rules.

If longer, the remainder is trimmed out.

---

`max_context` : How long context messages can be.

The rest is trimmed out.

---

`max_tokens` : Maximum amount of tokens openai can play with.

The bigger this is the bigger responses can be, but it gets more expensive.

---

`rules` : Instructions for the bot. They're prepended before every prompt.

This can be changed through the `!ur` and `!rules` commands.

---

`users` : Array of nicknames. They might have more permissions than non-users.

What they can do can be determined through permissions.

See [Users](#users)

See [Permissions](#permissions)

---

`admins` : Array of nicknames. They can run all the commands.

They can add/remove users, modify permissions, and change other configs.

See [Admins](#admins)

---

`allow_ask` : Who is allowed to ask questions to the ai.

`allow_rules` : Who is allowed to modify the personality of the ai through rules.

These can be `all`, `users`, or `admins`.

See [Permissions](#permissions)

---

`spam_limit` : Ban a nickname after reaching this spam level.

`spam_minutes` : Ban a nickname for these minutes after it reaches the limit.

See [Anti-Spam](#antispam)

---

`compact` : Enable or disable compact mode.

Instead of printing new lines on ai responses, lines are joined with the `avatar`.

This allows a more compact output which we found works nicely.

If this is disabled, the output will leave the newlines as is.

---

`avatar` : This is the bot's image, like `🤖`.

This appears at the start of messages and in between lines.

It's recommended to make this an emoji character.

It's recommended to give each bot a unique avatar.

It gives your bots some personality.

---

`show_avatar` : Whether to show the avatar or not.

---

`autorespond` : Probability percentage to respond by itself. From `0` to `100`.

`autorespond_cooldown` : Stop the bot from autoresponding for at least these minutes after the last autorespond.

`autorespond_words` : The max amount of words autorespond should aim for. If set to `0` it won't use a limit.

See [Autorespond](#autorespond)

---

`command_char` : The character used to run commands, like `!`.

`mention_char` : The character used to mention nicknames, like `@`.

`join_char` : The character used to join lines. Empty by default.

If empty it will use the avatar.

---

`words` : The max amount of words bot responses should aim for.

At most, this instructs the bot to not exceed that word limit, but it's not guaranteed.

If set to `0` it won't use a limit.

---

`markdown` : Apply some effects to irc text.

For example words or phrases between backticks (`) get colored green.

And words or phrases between two asterisks (**) get bold.

---

`color_backticks` : Color used for backticks markdown.

`color_quotes` : Color used for quotes markdown.

---

`reveal_user` : Tell the AI what the user's nickname is in the system prompt.

The user is the one doing that particular prompt.

`reveal_ai` : Tell the AI what its own irc nickname is in the system prompt.

---

`max_messages_length` : Safe limit to avoid printing ridiculous irc messages.

---

`timeago` : If enabled, it will inject relative timeago messages to the prompt.

For instance, if the previous message was 8 minutes ago, it will inject:

`(Last response was 8 minutes ago)`

So the AI can have an idea of the passage of time.

The minimum is 1 minute, it won't use seconds.

It goes up to `days`,

---

## Permissions <a name="permissions"></a>

Access to ai and rules can be defined.

This is controlled by the `allow_ask` and `allow_rules` configs.

These can be set to: `all`, `users`, or `admins`.

---

`all` means anybody.

`users` means users and admins.

`admins` means only admins.

---

Users and admins are defined in the bot, they don't refer to the irc channel roles.

---

For instance, if `allow_ask` is set to `users`, only users and admins can ask questions to the ai.

If `allow_rules` is set to `all`, any nickname in the channel can change the bot's rules with `!ur`.

If set to `admins` only admins can use the feature.

You can edit these through commands: `!allow_ask all`.

Check current permissions with `!config` or directly: `!allow_rules`.

Assign permissions in whatever way they make sense.

Some bots are meant to be fixed, others might be more dynamic, and others might belong to certain users.

There is also the `prompts` rule that controls who gets to set the prompts.

---

## Users <a name="users"></a>

There is a `users` config that holds a list of irc nicknames.

They are only used to define access to certain bot features.

They are used in the `allow_ask` and `allow_rules` configs.

If these are set to `users`, only nicknames in the list have access.

They can be added and removed with `!add_user` and `!remove_user`.

See [Permissions](#permissions)

---

## Admins <a name="admins"></a>

This is a list of irc nicknames.

Admins can perform any bot action.

They are responsible for configuring the bot and assigning permissions.

Admins are manually added to the `admins` config by editing the file.

This config can't be modified through commands.

And it won't get resetted when using `!reset`.

Make sure to add your nickname to the list.

---

## Credentials <a name="credentials"></a>

The program reads the openai api key from the shell environment, it's not added to the code or config.

You must do this before running the bot:

`export OPENAI_API_KEY=mySecretKey`

Using your secret api key, which is not meant to be shared.

Doing it once is enough for the duration of that shell instance.

---

Using `Google Gemini` is now also supported.

You can set the key with:

`export GOOGLE_API_KEY=mySecretKey`

---

## Usage <a name="usage"></a>

The bot should join the irc channels automatically some seconds after starting the program.

Depending on the irc network it might take a while.

In Libera it might be something like 15 seconds or so.

---

Ask a question to a bot in the channel by highlighting it:

`mybot, some question` or `mybot: some question`

---

Nickname detection is case-insensitive. `MyBot` and `mybot` work.

---

If a message ends with `@nickname`, the response will be directed at that nickname.

**You**: &nbsp; Bot, What is 2 + 2 @Sam

**Bot**: &nbsp; 🤖 Sam: 2 + 2 = 4

---

Ask it questions related to the conversation you're having, so you and others learn.

Ask it specific facts, or to explain how something works.

Keep in mind that its knowledge data can be cut off and it might not be aware of current events.

If you give it a distinct personality it can respond in humorous ways.

---

There are symbols or `chars` you can use:

### clear_char

Default: `^`

Don't use context for this prompt.

This is when you want a clean response without context affecting it.

### emphasize_char

Default: `!`

Alias to "Please emphasize the last point."

### explain_char

Default: `?`

Alias to "Please explain."

### continue_char

Default: `>`

Alias to "Please continue."

---

For instance you can use them like `mybot, !`.

Or `mybot, ^ what is 2 + 2`.

---

There is per-user memory that can be used by using a nickname as the first word.

For instance:

`Bob: ai, what is 2 + 2`

---

Prompts can be saved:

`mybot, !prompt weather = What is the weather right now?`

Then you can use it like :

`mybot, !prompt weather`

---

`Joe: ai, trees are real right?`

---

`Bob: ai, Bob that plus 10`

(This would use the 2 + 2 thread)

---

See [Autorespond](#autorespond)

See [Anti-Spam](#antispam)

---

## Rules <a name="rules"></a>

The behavior of a bot can be altered through the `!ur` command.

`ur` meaning something like `you are` but shorter.

This edits the `rules` config, which is prepended before every prompt.

---

**You**: &nbsp; Bot, !ur an angry squirrel

**Bot**: &nbsp; 🤖 Rules: Respond as an angry squirrel

**You**: &nbsp; Bot, why are you in a tree?

**Bot**: &nbsp; 🤖 Oh, you think it's funny, do you? Well, I'm in a tree because it is my home! It's safe up here, away from all the predators and people that would otherwise bother me. So don't you worry about why I'm in a tree - worry about why you're not!

---

To have a vanilla openai bot again (no rules) use `!reset rules`.

---

## Commands <a name="commands"></a>

Bots listen to commands from nicknames in the channel.

The bot admins can use all the commands.

Others might have access to commands like `!ur` if they have permission.

To use commands you highlight the bot and use `!` or whatever is configured as the `command_char`:

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

`!ur [something]` : Set a personality through rules.

`!ur a monkey` would set the rules to `Respond as a monkey`.

See [Rules](#rules)

---

`!add_user [nickname]` : Add a nickname to the users list.

`!remove_user [nickname]` : Remove a nickname from the users list.

See [Users](#users)

See [Permissions](#permissions)

---

`!join [channel]` : Joins an irc channel.

A password can be supplied: `!join #somechannel somepassword`.

If the channel is not in the `channels` config it will be added.

---

`!leave [channel]` or just `!leave` : Leave an irc channel.

If the channel is in the `channels` config it will be removed.

---

`!ban [nickname]` : Manually ban a nickname.

`!unban [nickname]` : Manually unban a nickname.

See [Anti-Spam](#antispam)

---

`!reset [config | all]` : Reset a config by removing it from `/configs/mybot.json`.

`!reset all` Removes all overriden configs except `server`, `channels`, `port`, `nickname`, and `admins`.

---

These either enable or disable the ai responses for all users including admins.

These can be used when you want to stop the service temporarily without having to turn off the bots.

`!enable` : Enable responses from the bot.

`!disable` : Disable responses from the bot.

---

`!config` : Prints a summary of various configs.

This shows a quick overview of what the bot can do.

---

`!report` : It shows how long ago the bot was launched, and how much memory it is using.

---

Owned bots respond to a global `!cmd` command.

This can be used to check or change values on all bots at the same time.

For example:

`!cmd words 50` : This changes all owned bots's `words` config to `50`.

`!cmd rules` : This displays the rules of all bots.

`!cmd report` : Get an overview of all your bots.

Don't highlight a bot when using these, they're global commands.

They work on all owned bots in the current channel.

---

`!clear` : Clear the channel's context.

---

`!debug` : Enable or disable debug mode.

This makes requests print some information in the console.

---

Changes to any config through commands are saved automatically in `/configs/mybot.json`.

[config.json](config.json) is left intact and used for default values.

---

There's a similarity check to allow minor typos in command names and values.

---

## Manage <a name="manage"></a>

When you need to update, use `git pull` inside the airc directory and restart the bots.

---

[PM2](https://github.com/Unitech/pm2) can be used to manage the bots more easily.

The following script might be useful:

```js
const API_KEY = `secretKey`

const BOTS = [
  `bot1`,
  `bot2`,
]

const COMMON = {
  script: `airc/bot.js`,
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: `1G`,
  env: {
    NODE_ENV: `production`,
    OPENAI_API_KEY: API_KEY,
  },
  env_production: {
    NODE_ENV: `production`,
  },
}

function bot (name) {
  return Object.assign({}, COMMON, {
    name: `airc_${name}`,
    args: name,
  })
}

const apps = []

for (const name of BOTS) {
  apps.push(bot(name))
}

module.exports = {
  apps: apps,
}
```

1) Fill `API_KEY` with your secret api key.

2) Fill `BOTS` with the names of your bots.

3) Modify `COMMON` if you must.

Save it as `airc_config.js` or any other name.

Then use it like `pm2 start airc_config.js`.

---

## MultiProcess <a name="multiprocess"></a>

By default if the AI is busy it will ignore more requests.

To make it do multiple requests in parallel you can enable `multiprocess`.

For example `!multiprocess true`. Or set the config file.

---

## Markdown <a name="markdown"></a>

There is translation of some markdown syntax to effects like bold or color.

These include backticks, asterisks, underscores and quotes.

For example `*this thing*` will turn bold, using irc escape codes.

Or \`this thing` will turn green.

Or `_this thing_` will turn bold too.

Quotes change the color but they also include the full text (includes the quotes).

The color of backticks and quotes can be configured through `color_backticks` and `color_quotes` configs.

---

## Lists <a name="lists"></a>

By default it will clean lists that use `*` or `-` notation.

For example `* thing 1\n* thing 2` will become: `thing 1\nthing 2`

To disable this, set `lists` to `true`.

---

## Autorespond <a name="autorespond"></a>

Bots have the ability to respond when not being directly prompted.

Autorespond is triggered by normal messages from nicknames.

The bot will use the message that triggered autorespond as the prompt.

So it can be somewhat relevant to the current discussion and can be funny.

If set to `0` it will never autorespond.

If you enable this, `1` might be a good value.

That's a 1% chance to respond to messages, which is enough in heavy channels.

`autorespond_words` defines the maximum number of words the responses should be, similar to `words`.

It's suggested to use a small number for this, like `12`, to avoid spamming the channel.

Some find autorespond to be problematic for their privacy, so it's disabled by default.

---

Related configs: `autorespond`, `autorespond_cooldown`, `autorespond_words`.

---

## Talk <a name="talk"></a>

There is a special mode to make bots talk between each other.

You can do for instance `Bob, !talkto Ray`.

And they will have an exchange.

The length of the conversation is defined by the `talk_limit` config.

The initial message is a random thought.

A subject can be used with: `Bob, what is your favorite song? @Ray`.

---

## Anti-Spam <a name="antispam"></a>

There's an anti-spam system that automatically bans nicknames from using the bot.

This is to avoid abuse but also accidents that could lead to many requests to openai.

By banning it means that nicknames get flagged and ignored by the bot temporarily.

2 configs that control this, `spam_limit`, and `spam_minutes`.

Nicknames get assigned a `spam level` internally that starts at `0`.

The spam level reflects recent bot usage by a nickname.

The spam level is increased by `1` on each bot prompt from the nickname.

The spam level gets decreased by `1` every second or so.

If the spam level reaches the `spam_limit`, the nickname is banned.

Nicknames get automatically unbanned after `spam_minutes` passes.

Admins can ban and unban nicknames manually with `!ban` and `!unban`.

Bot admins and users can also get banned.

Restarting the bot unbans all nicknames.

---

## Image Generation <a name="image"></a>

It's possible to generate images using `dalle-3`.

An `openai key` is required.

Then you can use the `!image` command.

For example: `!image grasshopper`.

If the `IMGUR_CLIENT_ID` environment variable exists, it will upload the image to `Imgur`.

An `Imgur` URL is much shorter.

Else, it will print the original URL.

There's a `allow_image` permission specifically for the `!image` command.

By default only `users` can use it.