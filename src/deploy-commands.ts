import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { verifyCommand } from './commands/verify';
import { vlogCommand } from './commands/vlog';

// Load environment variables
config();

export async function registerCommands() {
  const token = process.env.BOT_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId) {
    console.error('Missing BOT_TOKEN or CLIENT_ID in environment variables');
    return;
  }

  const commands = [
    verifyCommand.data.toJSON(),
    vlogCommand.data.toJSON(),
  ];

  const rest = new REST().setToken(token);

  try {
    console.log('Started refreshing application (/) commands.');

    if (guildId) {
      // Register guild-specific commands (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );
      console.log(`Successfully reloaded ${commands.length} guild application (/) commands.`);
    } else {
      // Register global commands
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );
      console.log(`Successfully reloaded ${commands.length} global application (/) commands.`);
    }
  } catch (error) {
    console.error('Error registering commands:', error);
  }
} 