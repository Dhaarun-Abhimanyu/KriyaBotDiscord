// Discord bot setup
const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { io } = require('socket.io-client');
require('dotenv').config();

// Discord bot token
const TOKEN = process.env.DISCORD_TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Connect to chatbot socket
const socket = io('https://kriyachatbot.psgtech.ac.in',{
    transports: ['websocket'],
    secure: true
});

// Discord bot slash command setup
client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ask') {
        const userQuery = interaction.options.getString('query');
        console.log(`Received query: ${userQuery}`);

        try {
            await interaction.deferReply();

            // Emit query with a unique session ID
            const sessionId = `discord-${Date.now()}`;
            socket.emit('query', { query: userQuery, session_id: sessionId });

            // Handle response with timeout
            const responsePromise = new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject('No response from server'), 10000);

                socket.once('response', (data) => {
                    clearTimeout(timer);
                    if (data.session_id === sessionId) {
                        if (data.error) reject(`Error: ${data.error}`);
                        else resolve(data.response);
                    }
                });
            });

            const botResponse = await responsePromise;
            await interaction.editReply(botResponse);

        } catch (error) {
            console.error('Error handling Discord interaction:', error);
            await interaction.editReply(`Failed to get a response: ${error}`);
        }
    }
});

// Login the Discord bot
client.login(TOKEN);
