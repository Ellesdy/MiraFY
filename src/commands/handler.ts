import { ChatInputCommandInteraction } from 'discord.js';
import { verifyCommand } from './verify';

/**
 * Handle incoming slash commands
 */
export async function handleCommands(interaction: ChatInputCommandInteraction) {
  const { commandName } = interaction;

  // Route commands to their handlers
  switch (commandName) {
    case 'verify':
      await verifyCommand.execute(interaction);
      break;
    default:
      await interaction.reply({
        content: 'Unknown command',
        ephemeral: true,
      });
      break;
  }
} 