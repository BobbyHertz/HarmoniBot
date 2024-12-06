const { Client, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

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
    plugins: [new YtDlpPlugin()],
});

client.once('ready', () => {
    console.log(`${client.user.tag} is online and ready!`);
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
        if (command === 'play') {
            const url = args[0];
            console.log(`Provided url: ${url}`);

            if (!url) return message.reply('Please provide a YouTube URL.');

            await distube.play(voiceChannel, url, {
                textChannel: message.channel,
                member: message.member,
            });
        } else if (command === 'stop') {
            const queue = distube.getQueue(voiceChannel);
            if (!queue) return message.reply('There is no music playing to stop.');

            queue.stop(); // Stops playback and clears the queue

            message.reply('Music has been stopped, and the queue has been cleared.');
        } else if (command === 'kill') {
            distube.voices.get(voiceChannel.guild.id)?.leave(); // Makes the bot leave the voice channel

            message.reply('Goodbye!');
        } else if (command === 'skip') {
            const queue = distube.getQueue(voiceChannel);

            if (!queue) return message.reply('The queue is empty, so there is nothing to skip to.');

            if (queue.songs.length <= 1) {
                return message.reply('You are at the end of the queue, so there is nothing to skip to.');
            }

            try {
                await queue.skip();
                message.reply('Skipped the current song!');
            } catch (error) {
                console.error('Error skipping song:', error);
                message.reply('An error occurred while trying to skip the song.');
            }
        } else if (command === 'rewind') {
            const queue = distube.getQueue(voiceChannel);

            if (!queue) return message.reply('The queue is empty, so there is nothing to rewind to.');

            if (queue.previousSongs.length <= 0) {
                return message.reply('You are at the beginning of the queue, so there is nothing to rewind to.');
            }

            try {
                queue.previous();
                message.reply('Rewound to the previous song!');
            } catch (error) {
                console.error('Error rewinding song:', error);
                message.reply('An error occurred while trying to rewind the song.');
            }
        } else if (command === 'queue') {
            const queue = distube.getQueue(voiceChannel);
            if (!queue) return message.reply('The queue is empty.');

            const queueString = queue.songs
                .map((song, index) => `${index + 1}. ${song.name} - \`${song.formattedDuration}\``)
                .join('\n');

            message.reply(`**Current Queue:**\n${queueString}`);
        } else if (command === 'help') {
            message.reply('Available commands are:\n\n' +
                'play {url} - Plays a YouTube URL or adds it to the queue if a song is playing.\n' +
                'stop - Stops any current music and clears the queue.\n' +
                'kill - Disconnects the bot from the voice channel.\n' +
                'skip - Plays the next song in the queue.\n' +
                'rewind - Plays the previous song in the queue.\n' +
                'queue - Displays the current queue.\n' +
                'help - Displays the list of available commands (please request more!).');
        }
    } catch (error) {
        console.error(`Error in command ${command}:`, error);
        message.reply('An error occurred while processing your command.');
    }
});

distube.on('playSong', (queue, song) =>
    queue.textChannel.send(`🎶 Playing \`${song.name}\` - \`${song.formattedDuration}\``)
);

distube.on('addSong', (queue, song) =>
    queue.textChannel.send(`Added \`${song.name}\` - \`${song.formattedDuration}\` to the queue!`)
);

distube.on('error', (channel, error) => {
    if (channel && channel.send) {
        channel.send(`An error occurred: ${error.message}`);
    } else {
        console.error('DisTube Error:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);