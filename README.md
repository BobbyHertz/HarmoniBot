# HarmoniBot
A lightweight music bot for Discord that actually works!

This bot requires no YouTube login, and avoids the hassle of requiring numerous setup dependencies. Just install [Node.js](https://nodejs.org/), get your [Discord bot token](https://www.writebots.com/discord-bot-token/), and run it!

# Features
Supports the following commands:

Music:
- !play {url|search term} - Plays a YouTube/Spotify URL or search term. The song is added to the queue if a song is playing.
- !pause - Pauses current playback.
- !resume - Resumes playback.
- !stop - Stops any current music and clears the queue.
- !kill - Disconnects the bot from the voice channel.
- !skip - Plays the next song in the queue.
- !rewind - Plays the previous song in the queue.
- !jump {number} - Jumps to the specified song number in the queue.
- !shuffle - Randomly re-orders the songs in the queue.
- !seek {seconds} - Sets the current song playback to the specified time.
- !queue - Displays the current queue.

Other:
- !help - Displays the list of available commands.
- !timeout {minutes (0-60)} - Sets the time the bot will wait to disconnect after the queue completes.

Bot Admins Only:
- !debug {off|on|verbose} - Sets the desired debug logging mode.

# Setup

There are two parts to the setup. First, you must create a bot user to add to your Discord. Then, you run the application in your preferred environment using the bot's token.

## Discord Bot User Setup

1) Get your [Discord bot token](https://www.writebots.com/discord-bot-token/) from the Discord [Application Developer site](https://discord.com/developers/applications).
2) Download the project folder.
3) Create a file called ".env" (no name, just the extension) in this folder, with the file's content being a single line of text: `DISCORD_TOKEN={YourTokenGoesHere}`. Replace "{YourTokenGoesHere}," including the brackets, with the token you generated.
    - Optionally, add another line: `BOT_ADMIN_ID={YourDiscordUserId}`. Replace "{YourDiscordUserId}," with the [ID of your Discord user](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID). This will allow your user to have access to the Debug logging commands.
4) Using the same website you retrieved the bot token from, create an invite link to invite your bot to your Discord server.
5) The bot will be added to your server but not yet functional. Proceed with either the Windows or Docker installation steps below depending on how you are hosting the bot.

## Windows Instructions
1) Install [Node.js](https://nodejs.org/).
2) Run "runbot.bat" and enjoy!

## Linux (Docker) Instructions
1) Install [Docker](https://docs.docker.com/engine/install/).
2) Copy the required contents of the project folder (the libs folder, Dockerfile, index.js, package.json, and the .env file you created in the previous step) into a folder on your server (ex. /HarmoniBot).
3) Change your running directory to this newly created folder and run the following command to create the Docker image: `docker build -t harmonibot .`
4) Once complete, run this command to create and run the Docker container: `docker run -d --name harmonibot-container harmonibot`

# Recommended Discord Bot Permissions
When creating the bot's invite link to your Discord server, you will need to specify the permissions it needs. You should set the following permissions:

- General Permissions
    - View Channels
- Text Permissions
    - Send Messages
- Voice Permissions
    - Connect
    - Speak

You should also set the following Privileged Gateway Intents, right above the Bot permissions:
- Message Content Intent

# Dependencies
- [Node.js](https://nodejs.org/) 18.17.0 or higher
- @distube/ytdl-core
- @distube/youtube
- @distube/spotify
- dotenv
- ffmpeg-static
- libsodium-wrappers
- opusscript