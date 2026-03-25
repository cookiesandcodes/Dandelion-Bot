# Dandelion-Bot

A Discord bot themed around Dandelion from *Girls' Frontline*. It's got the usual server management function like moderation, leveling, economy, plus a Leetify/Steam integration for tracking CS2 stats directly in Discord. Built with Node.js and Discord.js, MongoDB for persistence, and a handful of other libraries for misc. features.

## Stack

- **Language:** JavaScript (ES6+)
- **Framework:** Discord.js v14
- **Database:** MongoDB + Mongoose
- **Libraries:** Canvacord (image stuff), Math.js, ms/pretty-ms, dotenv
- **External APIs:** Steam Web API, Leetify CS2 API v3
- **Deployment:** Discloud or any Node.js host
- **Architecture:** Modular command/event handler system

## What it does

- **Moderation:** Ban, kick, timeout — standard stuff, role-permission gated.
- **Economy:** Balance and shop commands.
- **Leveling:** XP from messages, resets monthly.
- **Autorole:** Automatically assign a role when someone joins.
- **Banned Word Minigame:** Pick a banned word per channel; saying it earns escalating timeouts. A bit chaotic, intentionally so.
- **Utilities:** Ping, dice roll, Leetify rating converter.
- **Leetify + Steam Integration:**
  - `/iam` — Link your Steam account (Steam64 ID, vanity URL, or full profile URL all work)
  - `/whois` — See which Steam profile a user has linked
  - `/leetify stats [user]` — Full Leetify CS2 stats for yourself or someone else
  - `/leetify recent [count:1-5] [user]` — Recent match history with scores, maps, ratings, rank changes
  - `/leetify match [gameid]` — Dig into a specific match

## Who it's for

Gaming servers, mainly. Works best small-to-medium scale where you want some personality alongside the moderation tools. The CS2 integration is the main differentiator — if your server has competitive players, having Leetify stats a slash command away is pretty handy. Not built for enterprise use or anything like that.

## Limitations / Known Quirks

- Needs a MongoDB instance (local or Atlas, either works).
- Guild-only — no DM support.
- Permissions are entirely Discord-side; you'll need to configure roles yourself.
- No anti-spam or extended audit logging beyond basic mod actions.
- Canvacord is in there but image features are mostly for future expansion right now.
- Monthly resets for leveling/timeouts could lose data if the bot is down when the reset runs.
- No web dashboard — everything's via slash commands.
- Leetify commands need a valid Steam API key and depend on Leetify's API being up.
- One Steam account per Discord account.

## Setup

```bash
git clone <repo-url>
npm install
```

Create a `.env` file with:
```
TOKEN=your_discord_bot_token
MONGODB_URI=your_mongodb_connection_string
GUILD_ID=your_test_server_id   # optional
STEAM_API_KEY=your_steam_api_key
```
Get a Steam API key from https://steamcommunity.com/dev/apikey.

Then deploy commands and start:
```bash
node src/deploy-commands.js
node src/index.js
```

## Commands

### Moderation & Server Management
- `/ban <user> [reason]`
- `/kick <user> [reason]`
- `/timeout <user> <duration> [reason]`
- `/set-banned-word <word>` — Set a banned word for the current channel
- `/get-banned-word` — View banned words in current channel
- `/remove-banned-word <word>`
- `/autorole-configure <role>`
- `/autorole-disable`

### Economy & Fun
- `/balance`
- `/shop`
- `/ping`
- `/roll`

### Leetify & Steam

First, link your Steam profile:
```
/iam steam64_id:76561198123456789
/iam vanity_url:your-steam-vanity
/iam profile_url:https://steamcommunity.com/profiles/76561198123456789
```

Then the stats commands will just work for you by default, or you can point them at someone else:
```
/leetify stats                          # your stats
/leetify stats user:@SomeUser           # someone else's
/leetify recent                         # last 5 matches
/leetify recent count:3                 # last 3
/leetify recent user:@SomeUser count:5
/leetify match gameid:abc123def         # specific match
/whois @user                            # see their linked Steam profile
```

## Contributing

Fork it, open a PR. Always happy to see it grow.

## License

ISC
