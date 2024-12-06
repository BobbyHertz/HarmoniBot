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
  plugins: [new YtDlpPlugin()], // Enable YouTube support
});

client.once('ready', () => {
  console.log(`${client.user.tag} is online and ready!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/g);
  const command = args.shift()?.toLowerCase();

  if (command === 'play') {
    const url = args[0];
    console.log(`Provided url: ${url}`);

    if (!url) return message.reply('Please provide a YouTube URL.');

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply('You need to join a voice channel first!');
    }

    try {
      await distube.play(voiceChannel, url, {
        textChannel: message.channel,
        member: message.member,
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      message.reply('There was an error playing the audio.');
    }
  }
});

distube.on('playSong', (queue, song) =>
  queue.textChannel.send(`🎶 Playing \`${song.name}\` - \`${song.formattedDuration}\``)
);

distube.on('error', (channel, error) => {
    if (channel && channel.send) {
      channel.send(`An error occurred: ${error.message}`);
    } else {
      console.error('DisTube Error:', error);
    }

    console.error('Channel:', channel);
    console.error('Error:', error);
  });

client.login(process.env.DISCORD_TOKEN);