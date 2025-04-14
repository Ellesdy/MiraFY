import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  GuildMember,
  PermissionFlagsBits
} from 'discord.js';
import { config } from 'dotenv';

// Load environment variables
config();

export const verifyCommand = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify a user by adding the verified role and removing the unverified role')
    .addUserOption(option => 
      option
        .setName('user')
        .setDescription('The user to verify')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction: ChatInputCommandInteraction) {
    // Defer reply to give us time to process
    await interaction.deferReply({ ephemeral: true });

    try {
      // Check if the command was used in a guild (server)
      if (!interaction.guild) {
        return interaction.editReply('This command can only be used in a server.');
      }

      // Get the mod role ID from environment variables
      const modRoleId = process.env.MOD_ROLE_ID;
      const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
      const unverifiedRoleId = process.env.UNVERIFIED_ROLE_ID;

      if (!modRoleId || !verifiedRoleId || !unverifiedRoleId) {
        return interaction.editReply('Missing role configuration in environment variables.');
      }

      // Get the member who used the command
      const commandMember = interaction.member as GuildMember;
      
      // Check if the user has the mod role
      if (!commandMember.roles.cache.has(modRoleId)) {
        return interaction.editReply('You do not have permission to use this command. Mod role required.');
      }

      // Get the targeted user
      const targetUser = interaction.options.getUser('user');
      if (!targetUser) {
        return interaction.editReply('You must specify a user to verify.');
      }

      // Get the target member from the guild
      const targetMember = await interaction.guild.members.fetch(targetUser.id);
      if (!targetMember) {
        return interaction.editReply('Could not find that user in this server.');
      }

      // Check if the user already has the verified role
      if (targetMember.roles.cache.has(verifiedRoleId)) {
        return interaction.editReply(`${targetUser.username} is already verified.`);
      }

      // Add the verified role and remove the unverified role
      await targetMember.roles.add(verifiedRoleId);
      
      // Check if they have the unverified role before trying to remove it
      if (targetMember.roles.cache.has(unverifiedRoleId)) {
        await targetMember.roles.remove(unverifiedRoleId);
      }

      return interaction.editReply(`Successfully verified ${targetUser.username}.`);
    } catch (error) {
      console.error('Error in verify command:', error);
      return interaction.editReply('An error occurred while trying to verify the user.');
    }
  }
}; 