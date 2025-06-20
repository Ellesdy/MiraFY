import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  GuildMember,
  PermissionFlagsBits
} from 'discord.js';
import { config } from 'dotenv';
import { verificationDB } from '../utils/database';
import { VerificationLogger } from '../utils/logger';

// Load environment variables
config();

export const verifyCommand = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify a user by adding the verified role and removing the unverified role')
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Verify a user (standard verification)')
        .addUserOption(option => 
          option
            .setName('target')
            .setDescription('The user to verify')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('sign')
        .setDescription('Verify a user and log the verification with signature')
        .addUserOption(option => 
          option
            .setName('target')
            .setDescription('The user to verify')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('notes')
            .setDescription('Optional notes for verbose logging')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('config')
        .setDescription('Configure verification logging settings')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Set the channel for verification logs')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('verbose')
            .setDescription('Enable verbose server-side logging')
            .setRequired(false)
        )
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

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'user':
        case 'sign':
          return await this.handleVerification(interaction, subcommand === 'sign');
        
        case 'config':
          return await this.handleConfig(interaction);
        
        default:
          return interaction.editReply('Unknown subcommand.');
      }
    } catch (error) {
      console.error('Error in verify command:', error);
      return interaction.editReply('An error occurred while processing the command.');
    }
  },

  async handleVerification(interaction: ChatInputCommandInteraction, withLogging: boolean) {
    const verifiedRoleId = process.env.VERIFIED_ROLE_ID!;
    const unverifiedRoleId = process.env.UNVERIFIED_ROLE_ID!;

    // Get the targeted user
    const targetUser = interaction.options.getUser('target');
    if (!targetUser) {
      return interaction.editReply('You must specify a user to verify.');
    }

    // Get the target member from the guild
    const targetMember = await interaction.guild!.members.fetch(targetUser.id);
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

    // If this is a signed verification, log it
    if (withLogging) {
      const verifier = interaction.member as GuildMember;
      const notes = interaction.options.getString('notes');
      
      const verification = {
        verified_user_id: targetUser.id,
        verified_user_display_name: targetMember.displayName,
        verifier_user_id: verifier.id,
        verifier_username: verifier.displayName,
        timestamp: new Date().toISOString(),
        guild_id: interaction.guild!.id,
        additional_data: notes || undefined
      };

      // Log to database
      verificationDB.logVerification(verification);

      // Log to channel if configured
      await VerificationLogger.logToChannel(interaction.guild!, verification);

      // Log to server file
      await VerificationLogger.logToServerFile(verification);

      return interaction.editReply(
        `Successfully verified ${targetUser.username} and logged the verification. ` +
        `${notes ? `Notes: ${notes}` : ''}`
      );
    }

    return interaction.editReply(`Successfully verified ${targetUser.username}.`);
  },

  async handleConfig(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel');
    const verbose = interaction.options.getBoolean('verbose');

    let responses = [];

    if (channel) {
      if (channel.type === 0 || channel.type === 5) { // GUILD_TEXT or GUILD_ANNOUNCEMENT
        verificationDB.setLogChannel(interaction.guild!.id, channel.id);
        responses.push(`✅ Log channel set to ${channel}`);
      } else {
        responses.push('❌ Channel must be a text channel');
      }
    }

    if (verbose !== null) {
      verificationDB.setVerboseLogging(interaction.guild!.id, verbose);
      responses.push(`✅ Verbose logging ${verbose ? 'enabled' : 'disabled'}`);
    }

    if (responses.length === 0) {
      // Show current configuration
      const logChannelId = verificationDB.getLogChannel(interaction.guild!.id);
      const isVerbose = verificationDB.isVerboseLogging(interaction.guild!.id);
      
      let config = '**Current Configuration:**\n';
      config += `Log Channel: ${logChannelId ? `<#${logChannelId}>` : 'Not set'}\n`;
      config += `Verbose Logging: ${isVerbose ? 'Enabled' : 'Disabled'}`;
      
      return interaction.editReply(config);
    }

    return interaction.editReply(responses.join('\n'));
  }
}; 