// Package Dependencies
const { Client, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');
const { SpotifyPlugin } = require("@distube/spotify");
const ffmpegPath = require('ffmpeg-static');

// Local Project Dependencies
const { logMessage, logError } = require('./libs/logger');
const { getAllSettings, getTimeoutMinutes, setTimeoutMinutes, getInactivityTimeout, setInactivityTimeout } = require('./libs/serverSettings');
const { getDiscordToken, getBotAdminId, getDebugLoggingMode, setDebugLoggingMode } = require('./libs/adminSettings');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const distube = new DisTube(client, {
    plugins: [
        new YouTubePlugin(),
        new SpotifyPlugin()
    ],
    ffmpeg: {
        path: ffmpegPath,
        options: "-loglevel debug"
    }
});

client.once('ready', () => {
    logMessage(`${client.user.tag} is online and ready!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/g);
    const command = args.shift()?.toLowerCase();

    const userVoiceChannel = message.member?.voice?.channel;
    if (!userVoiceChannel) {
        return message.reply(`You must be in a voice channel to use commands.`);
    }

    const server = userVoiceChannel.guild;
    const queue = distube.getQueue(userVoiceChannel);
    if (queue &&
        queue?.voice?.channel.id != userVoiceChannel.id &&
        command != 'help') {
        return message.reply(`You must be in the bot's voice channel \`${queue?.voice?.channel.name}\` to use this command.`);
    }

    try {

        logMessage(`${server.name}: ${message.author.displayName} issued command "${message.content}"`);

        switch (command) {
            case 'play':

                if (args.length < 1) return message.reply(`Please provide a YouTube/Youtube Music/Spotify URL or search query.`);

                const loadingMsg = await message.channel.send(`Loading song. Please wait a moment...`);

                await distube.play(userVoiceChannel, args.join(' '), {
                    textChannel: message.channel,
                    member: message.member,
                });

                loadingMsg.delete();

                break;
            case 'pause':

                if (!queue) return message.reply(`The queue is empty, so there is nothing to pause.`);
                if (queue.paused) return message.reply(`Music is already paused.`);

                queue.pause();

                message.channel.send(`Playback has been paused.`);

                break;
            case 'resume':

                if (!queue) return message.reply(`The queue is empty, so there is nothing to resume.`);
                if (!queue.paused) return message.reply(`Music is already playing.`);

                queue.resume();

                message.channel.send(`Playback resumed.`);

                break;
            case 'stop':

                if (!queue) return message.reply(`There is no music playing to stop.`);

                queue.stop();

                message.channel.send(`Music has been stopped, and the queue has been cleared.`);

                triggerInactivity(server, queue.textChannel);

                break;
            case 'kill':

                distube.voices.get(server.id)?.leave();

                message.channel.send(`Goodbye!`);

                break;
            case 'skip':
            case 'next':
            case 'ff':

                if (!queue) return message.reply(`The queue is empty, so there is nothing to skip to.`);

                if (args.length < 1) {

                    if (queue.songs.length <= 1) {
                        return message.reply(`You are at the end of the queue, so there is nothing to skip to.`);
                    }
    
                    await queue.skip();

                    await message.channel.send(`Skipping to the next song...`);

                } else {

                    var songNumber = parseInt(args[0]);

                    if (!isNaN(songNumber) &&
                        (songNumber > 0 && songNumber < queue.songs.length)) {

                            await queue.jump(songNumber);

                            await message.channel.send(`Skipped to song #${songNumber}.`);

                    } else if (!isNaN(songNumber) &&
                        (songNumber < 0 && Math.abs(songNumber) <= queue.previousSongs.length)) {

                            var songDist = Math.abs(songNumber);

                            await queue.jump(songNumber);

                            await message.channel.send(`Jumped back ${songDist} song${songDist > 1 ? 's' : ''}.`);

                    } else {

                        return message.reply(`Invalid skip value.`);
                    }
                }

                break;
            case 'previous':
            case 'last':
            case 'rw':

                if (!queue) return message.reply(`The queue is empty, so there is nothing to go back to.`);

                if (queue.previousSongs.length <= 0) {
                    return message.reply(`You are at the beginning of the queue, so there is nothing to go back to.`);
                }

                await queue.previous();
                await message.channel.send(`Going back to the previous song...`);

                break;
            case 'shuffle':
            case 'random':

                if (!queue) return message.reply(`The queue is empty, so there is nothing to shuffle.`);

                await queue.shuffle();
                await message.channel.send(`Queue has been shuffled.`);

                break;
            case 'seek':

                if (!queue) return message.reply(`The queue is empty, so there is nothing to seek.`);

                if (args.length < 1) return message.reply(`Seeking to a time in a song requires a value.`);

                var seekTime = parseInt(args[0]);

                if (!isNaN(seekTime) &&
                    (seekTime >= 0 && seekTime <= 100000)) {

                        await queue.seek(seekTime);

                        await message.channel.send(`Time seek set to ${seekTime} seconds.`);
                } else {

                    return message.reply(`Invalid seek value.`);
                }

                break;
            case 'queue':
            case 'list':

                if (!queue) return message.channel.send(`The queue is empty.`);

                var queueString = `**Current Queue:**\n` +
                    queue.songs
                        .map((song, index) => `${index == 0 ? '🎵  Now Playing:' : `${index}.`} ${song.name} - \`${song.formattedDuration}\``)
                        .join('\n');

                queueString = truncateForDiscord(queueString);

                message.channel.send(`${queueString}`);

                break;
            case 'debug':

                if (message.author.id != getBotAdminId()) return message.reply(`Only the bot administrator may set a debug logging mode.`);

                if (args.length < 1) return message.reply(`Setting a debug logging mode requires a value.`);

                const mode = args[0].toLowerCase();

                switch (mode) {
                    case 'off':
                    case 'on':
                    case 'verbose':

                        setDebugLoggingMode(mode);

                        message.channel.send(`Debug logging mode set to \`${mode.toUpperCase()}\`.`);

                        break;
                    default:

                        return message.reply(`Invalid debug mode value.`);
                }

                break;
            case 'servers':

                if (message.author.id != getBotAdminId()) return message.reply(`Only the bot administrator may view the connected server list.`);

                var serverListString = `Connected servers: ${client.guilds.cache.size}\n` +
                    client.guilds.cache
                        .map(guild => `- ${guild.id}: ${guild.name}`)
                        .join('\n');

                serverListString = truncateForDiscord(serverListString);

                message.channel.send(`${serverListString}`);

                break;
            case 'settings':

                if (message.author.id != getBotAdminId()) return message.reply(`Only the bot administrator may view server settings.`);

                var settingsString = JSON.stringify(getAllSettings(), null, 2);

                settingsString = truncateForDiscord(settingsString);

                message.channel.send(`${settingsString}`);

                break;
            case 'timeout':

                if (args.length < 1) return message.reply(`Setting a timeout requires a value.`);

                const number = parseInt(args[0]);
                if (!isNaN(number) && number >= 0 && number <= 60) {
                    setTimeoutMinutes(server.id, number);

                    message.channel.send(`Inactivity timeout set to \`${number} minutes\`.`);
                } else {
                    return message.reply(`Invalid timeout value.`);
                }

                break;
            case 'help':

                message.channel.send('The following commands are supported:\n\n' +
                    '🎵 **Music Playback**\n\n' +
                    '`!play {url|search term}` - Plays a YouTube/Youtube Music/Spotify link or search term. The song is added to the queue if a song is playing.\n' +
                    '`!pause` - Pauses playback.\n' +
                    '`!resume` - Resumes playback.\n' +
                    '`!seek {seconds}` - Sets the current song playback to the specified time.\n' +
                    '`!stop` - Stops music and clears the queue.\n\n' +
                    '📀 **Playlist Control**\n\n' +
                    '`!queue` - Shows the current song queue.  *Aliases*: `!list`\n' +
                    '`!skip {number (optional)}` - Plays the next song. If a number is provided, skips the specified number of songs.  *Aliases*: `!next`, `!ff`\n' +
                    '`!previous` - Plays the previous song.  *Aliases*: `!last`, `!rw`\n' +
                    '`!shuffle` - Randomizes the order of the queue.  *Aliases*: `!random`\n\n' +
                    '🛠 **Other Commands**\n\n' +
                    '`!help` - Displays the list of available commands.\n' +
                    '`!kill` - Disconnects the bot from the voice channel.\n' +
                    '`!timeout {minutes (0-60)}` - Sets how long the bot waits to disconnect once the queue finishes.');

                break;
        }
    } catch (error) {
        message.reply(`An error occurred while processing your command: ${error.message}`);
        logError(`${server.name}: Error in command "${message.content}":`, error);
    }
});

distube.on('playSong', (queue, song) => {
    const server = getServerInfo(queue);
    triggerActivity(server);

    queue.textChannel.send(`🎶 Playing \`${song.name}\` - \`${song.formattedDuration}\``);
    logMessage(`${server.name}: Playing song: ${song.name} - ${song.formattedDuration}`);
});

distube.on('addSong', (queue, song) => {
    if (queue.songs.length > 1) {
        const server = getServerInfo(queue);

        queue.textChannel.send(`Added \`${song.name}\` - \`${song.formattedDuration}\` to the queue!`);
        logMessage(`${server.name}: Added song: ${song.name} - ${song.formattedDuration}`);
    }
});

distube.on('finish', (queue) => {
    const server = getServerInfo(queue);

    logMessage(`${server.name}: Finished song queue`);

    triggerInactivity(server, queue.textChannel);
});

distube.on('error', (error, queue) => {
    if (queue && queue.textChannel) {
        const server = getServerInfo(queue);

        queue.textChannel.send(`Music playback encountered an error: ${error.message}`);
        logError(`${server.name}: DisTube Error:`, error);
    } else {
        logError(`DisTube Error:`, error);
    }
});

distube.on('debug', (message) => {
    let debugLoggingMode = getDebugLoggingMode();

    if (debugLoggingMode == 'on' || debugLoggingMode == 'verbose') {
        logMessage(`DEBUG: ${message}`);
    }
});

distube.on('ffmpegDebug', (message) => {
    let debugLoggingMode = getDebugLoggingMode();

    if (debugLoggingMode == 'verbose') {
        logMessage(`FFMPEG DEBUG: ${message}`);
    }
});

function getServerInfo(queue) {
    return queue.textChannel.guild;
};

function triggerActivity(server) {
    let inactivityTimeout = getInactivityTimeout(server.id);

    if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
        setInactivityTimeout(server.id, null);
    }
};

function triggerInactivity(server, textChannel) {
    let minutes = getTimeoutMinutes(server.id);

    let inactivityTimeout = createInactivityTimeout(server, textChannel, minutes);

    setInactivityTimeout(server.id, inactivityTimeout);
};

function createInactivityTimeout(server, textChannel, minutes) {
    return setTimeout(function () {
        logMessage(`${server.name}: Inactivity timeout reached (${minutes} minutes). Bot disconnected.`);
        textChannel.send(`Looks like you're done playing music for now. Goodbye!`);

        distube.voices.get(server.id)?.leave();

        setInactivityTimeout(server.id, null);
    }, minutes * 60 * 1000);
};

// Ensure a message respects Discord message limit (2000).
function truncateForDiscord(message) {
    return message.length >= 2000
        ? `${message.slice(0, 1997)}...`
        : message;
};

client.login(getDiscordToken());