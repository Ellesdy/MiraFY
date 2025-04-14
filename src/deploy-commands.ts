import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { verifyCommand } from './commands/verify';

// Load environment variables
config();

const commands = [
  verifyCommand.data.toJSON(),
];

const rest = new REST().setToken(process.env.BOT_TOKEN!);

/**
 * Register slash commands with Discord API
 */
export async function registerCommands() {
  try {
    console.log('Started refreshing application (/) commands.');

    // The put method is used to fully refresh all commands
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
} 