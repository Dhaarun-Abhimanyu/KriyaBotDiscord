const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
// Replace with your bot token and client ID
const TOKEN = process.env.DISCORD_TOKEN;  // From Developer Portal
const CLIENT_ID = process.env.CLIENT_ID;  // From Developer Portal

// Define the /ask command
const commands = [
    new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask the chatbot anything!')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Your question for the chatbot')
                .setRequired(true)
        )
        .toJSON()
];

// Register commands with Discord
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Refreshing slash commands...');

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log('Slash commands successfully deployed!');
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
})();
