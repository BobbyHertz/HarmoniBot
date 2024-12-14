// Package Dependencies
const { Client, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');
const ffmpegPath = require('ffmpeg-static');

// Local Project Dependencies
const { logMessage, logError } = require('./logger');

// Environment variables
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const distube = new DisTube(client, {
    plugins: [new YouTubePlugin()],
    ffmpeg: {
        path: ffmpegPath,
        options: "-loglevel debug"
    }
});

var debugLoggingMode = 'off';

client.once('ready', () => {
    logMessage(`${client.user.tag} is online and ready!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/g);
    const command = args.shift()?.toLowerCase();

    const userVoiceChannel = message.member?.voice?.channel;
    if (!userVoiceChannel) {
        return message.reply('You must be in a voice channel to use commands.');
    }

    const queue = distube.getQueue(userVoiceChannel);
    if (queue &&
        queue?.voice?.channel.id != userVoiceChannel.id &&
        command != 'help') {
        return message.reply(`You must be in the bot's voice channel \`${queue?.voice?.channel.name}\` to use this command.`);
    }

    try {

        logMessage(`${message.author.displayName} issued command "${message.content}"`);

        switch (command) {
            case 'play':

                if (args.length < 1) return message.reply('Please provide a YouTube URL or search query.');

                const loadingMsg = await message.channel.send(`Loading song. Please wait a moment...`);

                await distube.play(userVoiceChannel, args.join(' '), {
                    textChannel: message.channel,
                    member: message.member,
                });

                loadingMsg.delete();

                break;
            case 'pause':

                if (!queue) return message.reply('The queue is empty, so there is nothing to pause.');
                if (queue.paused) return message.reply('Music is already paused.');

                queue.pause();

                message.channel.send('Playback has been paused.');

                break;
            case 'resume':

                if (!queue) return message.reply('The queue is empty, so there is nothing to resume.');
                if (!queue.paused) return message.reply('Music is already playing.');

                queue.resume();

                message.channel.send('Playback resumed.');

                break;
            case 'stop':

                if (!queue) return message.reply('There is no music playing to stop.');

                queue.stop();

                message.channel.send('Music has been stopped, and the queue has been cleared.');

                break;
            case 'kill':

                distube.voices.get(userVoiceChannel.guild.id)?.leave();

                message.channel.send('Goodbye!');

                break;
            case 'skip':

                if (!queue) return message.reply('The queue is empty, so there is nothing to skip to.');

                if (queue.songs.length <= 1) {
                    return message.reply('You are at the end of the queue, so there is nothing to skip to.');
                }

                await queue.skip();
                await message.channel.send(`Skipping to the next song...`);

                break;
            case 'rewind':

                if (!queue) return message.reply('The queue is empty, so there is nothing to rewind to.');

                if (queue.previousSongs.length <= 0) {
                    return message.reply('You are at the beginning of the queue, so there is nothing to rewind to.');
                }

                await queue.previous();
                await message.channel.send(`Rewinding to the previous song...`);

                break;
            case 'queue':

                if (!queue) return message.channel.send('The queue is empty.');

                var queueString = `**Current Queue:**\n` +
                    queue.songs
                        .map((song, index) => `${index + 1}. ${song.name} - \`${song.formattedDuration}\``)
                        .join('\n');

                // Respect Discord message limit (2000);
                queueString = queueString.length >= 2000 ? `${queueString.slice(0, 1997)}...` : queueString;

                message.channel.send(`${queueString}`);

                break;
            case 'debug':

                if (args.length < 1) return message.reply('Setting a debug logging mode requires a value.');

                const mode = args[0].toLowerCase();

                switch (mode) {
                    case 'off':
                    case 'on':
                    case 'verbose':

                        debugLoggingMode = mode;

                        message.channel.send(`Debug logging mode set to \`${mode.toUpperCase()}\`.`);

                        break;
                    default:

                        return message.reply('Invalid debug mode value.');
                }

                break;
            case 'help':

                message.channel.send('```Available commands are:\n\n' +
                    '!play {url|search term} - Plays a YouTube URL or search term. The song is added to the queue if a song is playing.\n' +
                    '!pause - Pauses current playback.\n' +
                    '!resume - Resumes playback.\n' +
                    '!stop - Stops any current music and clears the queue.\n' +
                    '!kill - Disconnects the bot from the voice channel.\n' +
                    '!skip - Plays the next song in the queue.\n' +
                    '!rewind - Plays the previous song in the queue.\n' +
                    '!queue - Displays the current queue.\n' +
                    '!debug {off|on|verbose} - Sets the desired debug logging mode.\n' +
                    '!help - Displays the list of available commands.```');

                break;
        }
    } catch (error) {
        message.reply(`An error occurred while processing your command: ${error.message}`);
        logError(`Error in command "${message.content}":`, error);
    }
});

distube.on('playSong', (queue, song) => {
    queue.textChannel.send(`🎶 Playing \`${song.name}\` - \`${song.formattedDuration}\``);
    logMessage(`Playing song: ${song.name} - ${song.formattedDuration}`);
});

distube.on('addSong', (queue, song) => {
    if (queue.songs.length > 1) {
        queue.textChannel.send(`Added \`${song.name}\` - \`${song.formattedDuration}\` to the queue!`);
        logMessage(`Added song: ${song.name} - ${song.formattedDuration}`);
    }
});

distube.on('finish', () => {
    logMessage(`Finished song queue`);
});

distube.on('error', (error, queue) => {
    if (queue && queue.textChannel) {
        queue.textChannel.send(`Music playback encountered an error: ${error.message}`);
    }

    logError('DisTube Error:', error);
});

distube.on('debug', (message) => {
    if (debugLoggingMode == 'on' || debugLoggingMode == 'verbose') {
        logMessage(`DEBUG: ${message}`);
    }
});

distube.on('ffmpegDebug', (message) => {
    if (debugLoggingMode == 'verbose') {
        logMessage(`FFMPEG DEBUG: ${message}`);
    }
});

client.login(process.env.DISCORD_TOKEN);