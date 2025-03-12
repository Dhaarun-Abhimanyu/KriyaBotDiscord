const { Client, GatewayIntentBits } = require('discord.js');
const { io } = require('socket.io-client');
const https = require('https');
require('dotenv').config();

const app = require('express')();

app.get('/', (req, res) => {
    res.status(200).send('ello');
});

app.listen(4000, () =>{});

const TOKEN = process.env.DISCORD_TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Create an HTTPS agent that bypasses certificate verification (for development only)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Connect to the chatbot socket using options similar to your index.html
const socket = io('https://kriyachatbot.psgtech.ac.in', {
  agent: httpsAgent,
  extraHeaders: {
    // Mimic the browser origin header
    Origin: 'https://kriyachatbot.psgtech.ac.in'
  }
  // Remove forced transports to let Socket.IO negotiate automatically
  // transports: ['websocket', 'polling']
});

socket.on('connect', () => console.log('Connected to chatbot socket!'));
socket.on('connect_error', (error) => console.error('Socket connection error:', error));
socket.on('disconnect', (reason) => console.warn('Disconnected from socket:', reason));

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand() || interaction.commandName !== 'ask') return;

  const userQuery = interaction.options.getString('query');
  console.log(`Received query: ${userQuery}`);
  const sessionId = `discord-${Date.now()}`;

  try {
    await interaction.deferReply();

    // Emit the query to the socket server
    socket.emit('query', { query: userQuery, session_id: sessionId });

    const botResponse = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject('No response from server'), 10000);
      socket.once('response', (data) => {
        clearTimeout(timeout);
        if (data.session_id === sessionId) {
          data.error ? reject(`Error: ${data.error}`) : resolve(data.response);
        }
      });
    });

    await interaction.editReply(botResponse);
  } catch (error) {
    console.error('Error handling query:', error);
    await interaction.editReply(`Failed to get response: ${error}`);
  }
});

client.login(TOKEN);
