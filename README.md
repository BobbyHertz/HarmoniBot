# HarmoniBot
A lightweight music bot for Discord that actually works!

This bot requires no YouTube login, and avoids the hassle of requiring numerous setup dependencies. Just install [Node.js](https://nodejs.org/), get your [Discord bot token](https://www.writebots.com/discord-bot-token/), and run it!

# Features
Supports the following commands:

- !play {url} - Plays a YouTube URL or adds it to the queue if a song is playing.
- !stop - Stops any current music and clears the queue.
- !kill - Disconnects the bot from the voice channel.
- !skip - Plays the next song in the queue.
- !rewind - Plays the previous song in the queue.
- !queue - Displays the current queue.
- !help - Displays the list of available commands.

# Setup
1) Install [Node.js](https://nodejs.org/).
2) Get your [Discord bot token](https://www.writebots.com/discord-bot-token/) from the Discord [Application Developer site](https://discord.com/developers/applications).
3) Create a file called ".env" in the main project folder, with the file's content being a single line of text: `DISCORD_TOKEN={YourTokenGoesHere}`. Replace "{YourTokenGoesHere}," including the brackets, with the token you generated.
4) Using the same website you retrieved the bot token from, create an invite link to invite your bot to your Discord server.
5) Run "runbot.bat" and enjoy!

# Recommended Discord Bot Permissions
When creating the bot's invite link to your Discord server, you will need to specify the permissions it needs. You should set the following permissions:

- General Permissions
    - View Channels
- Text Permissions
    - Send Messages
    - Manage Messages
- Voice Permissions
    - Connect
    - Speak
    - Use Voice Activity

You should also set the following Privileged Gateway Intents, right above the Bot permissions:
- Message Content Intent

# Dependencies
- [Node.js](https://nodejs.org/) 18.17.0 or higher
- @distube/youtube
- dotenv
- ffmpeg-static
- libsodium-wrappers
- opusscript