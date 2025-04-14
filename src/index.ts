import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { registerCommands } from './deploy-commands';
import { handleCommands } from './commands/handler';

// Load environment variables
config();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// When the client is ready, run this code
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  
  // Register slash commands
  registerCommands().catch(console.error);
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  await handleCommands(interaction);
});

// Login to Discord with the bot token
client.login(process.env.BOT_TOKEN); 