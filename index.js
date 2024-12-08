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
        path: ffmpegPath
    }
});

client.once('ready', () => {
    logMessage(`${client.user.tag} is online and ready!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/g);
    const command = args.shift()?.toLowerCase();

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
        return message.reply('You must be in a voice channel to use commands.');
    }

    try {
        var queue;

        logMessage(`${message.author.displayName} issued command "${message.content}"`);

        switch (command) {
            case 'play':

                if (args.length < 1) return message.reply('Please provide a YouTube URL or search query.');

                const loadingMsg = await message.channel.send(`Loading song. Please wait a moment...`);

                await distube.play(voiceChannel, args.join(' '), {
                    textChannel: message.channel,
                    member: message.member,
                });

                loadingMsg.delete();

                break;
            case 'stop':

                queue = distube.getQueue(voiceChannel);
                if (!queue) return message.reply('There is no music playing to stop.');

                queue.stop();

                message.channel.send('Music has been stopped, and the queue has been cleared.');

                break;
            case 'kill':

                distube.voices.get(voiceChannel.guild.id)?.leave();

                message.channel.send('Goodbye!');

                break;
            case 'skip':

                queue = distube.getQueue(voiceChannel);

                if (!queue) return message.reply('The queue is empty, so there is nothing to skip to.');

                if (queue.songs.length <= 1) {
                    return message.reply('You are at the end of the queue, so there is nothing to skip to.');
                }

                await queue.skip();
                await message.channel.send(`Skipping to the next song...`);

                break;
            case 'rewind':

                queue = distube.getQueue(voiceChannel);

                if (!queue) return message.reply('The queue is empty, so there is nothing to rewind to.');

                if (queue.previousSongs.length <= 0) {
                    return message.reply('You are at the beginning of the queue, so there is nothing to rewind to.');
                }

                await queue.previous();
                await message.channel.send(`Rewinding to the previous song...`);

                break;
            case 'queue':

                queue = distube.getQueue(voiceChannel);
                if (!queue) return message.channel.send('The queue is empty.');

                const queueString = queue.songs
                    .map((song, index) => `${index + 1}. ${song.name} - \`${song.formattedDuration}\``)
                    .join('\n');

                message.channel.send(`**Current Queue:**\n${queueString}`);

                break;
            case 'help':

                message.channel.send('Available commands are:\n\n' +
                    '- !play {url} - Plays a YouTube URL or adds it to the queue if a song is playing.\n' +
                    '- !stop - Stops any current music and clears the queue.\n' +
                    '- !kill - Disconnects the bot from the voice channel.\n' +
                    '- !skip - Plays the next song in the queue.\n' +
                    '- !rewind - Plays the previous song in the queue.\n' +
                    '- !queue - Displays the current queue.\n' +
                    '- !help - Displays the list of available commands.');

                break;
        }
    } catch (error) {
        message.reply('An error occurred while processing your command.');
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
        queue.textChannel.send(`A fatal error occurred: ${error.message}`);
    }

    logError('DisTube Error:', error);
});

client.login(process.env.DISCORD_TOKEN);