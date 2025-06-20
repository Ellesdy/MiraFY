import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  GuildMember,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';
import { verificationDB } from '../utils/database';
import { VerificationLogger } from '../utils/logger';

export const vlogCommand = {
  data: new SlashCommandBuilder()
    .setName('vlog')
    .setDescription('Manage verification logs')
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription('Update the verification log in the configured channel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View recent verification logs')
        .addIntegerOption(option =>
          option
            .setName('limit')
            .setDescription('Number of recent logs to show (default: 10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(50)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Show verification statistics for this server')
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
      if (!modRoleId) {
        return interaction.editReply('Missing mod role configuration.');
      }

      // Get the member who used the command
      const commandMember = interaction.member as GuildMember;
      
      // Check if the user has the mod role
      if (!commandMember.roles.cache.has(modRoleId)) {
        return interaction.editReply('You do not have permission to use this command. Mod role required.');
      }

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'update':
          return await this.handleUpdate(interaction);
        
        case 'view':
          return await this.handleView(interaction);
        
        case 'stats':
          return await this.handleStats(interaction);
        
        default:
          return interaction.editReply('Unknown subcommand.');
      }
    } catch (error) {
      console.error('Error in vlog command:', error);
      return interaction.editReply('An error occurred while processing the command.');
    }
  },

  async handleUpdate(interaction: ChatInputCommandInteraction) {
    const channelId = verificationDB.getLogChannel(interaction.guild!.id);
    
    if (!channelId) {
      return interaction.editReply(
        'No log channel configured. Use `/verify config channel:#channel` to set one.'
      );
    }

    try {
      await VerificationLogger.updateChannelLog(interaction.guild!);
      return interaction.editReply('✅ Verification log updated in the configured channel.');
    } catch (error) {
      console.error('Error updating log:', error);
      return interaction.editReply('❌ Failed to update the verification log.');
    }
  },

  async handleView(interaction: ChatInputCommandInteraction) {
    const limit = interaction.options.getInteger('limit') || 10;
    const logs = verificationDB.getVerificationLogs(interaction.guild!.id, limit);

    if (logs.length === 0) {
      return interaction.editReply('No verification logs found for this server.');
    }

    let logText = '';
    logs.forEach((log, index) => {
      const date = new Date(log.timestamp).toLocaleString();
      logText += `**${index + 1}.** ${log.verified_user_display_name} `;
      logText += `verified by ${log.verifier_username} on ${date}\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`🔍 Recent Verification Logs (${logs.length})`)
      .setDescription(logText)
      .setColor(0x0099ff)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },

  async handleStats(interaction: ChatInputCommandInteraction) {
    const logs = verificationDB.getVerificationLogs(interaction.guild!.id, 1000);
    
    if (logs.length === 0) {
      return interaction.editReply('No verification data available for statistics.');
    }

    // Calculate statistics
    const totalVerifications = logs.length;
    const uniqueVerifiers = new Set(logs.map(log => log.verifier_user_id)).size;
    const uniqueVerified = new Set(logs.map(log => log.verified_user_id)).size;
    
    // Get most active verifier
    const verifierCounts = logs.reduce((acc, log) => {
      acc[log.verifier_username] = (acc[log.verifier_username] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveVerifier = Object.entries(verifierCounts)
      .sort(([,a], [,b]) => b - a)[0];

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(log => new Date(log.timestamp) > sevenDaysAgo);

    const embed = new EmbedBuilder()
      .setTitle('📊 Verification Statistics')
      .setColor(0x00ff00)
      .addFields(
        { name: 'Total Verifications', value: totalVerifications.toString(), inline: true },
        { name: 'Unique Verifiers', value: uniqueVerifiers.toString(), inline: true },
        { name: 'Unique Users Verified', value: uniqueVerified.toString(), inline: true },
        { 
          name: 'Most Active Verifier', 
          value: mostActiveVerifier ? `${mostActiveVerifier[0]} (${mostActiveVerifier[1]} verifications)` : 'None',
          inline: false 
        },
        { name: 'Last 7 Days', value: recentLogs.length.toString(), inline: true },
        { 
          name: 'First Verification', 
          value: logs.length > 0 ? new Date(logs[logs.length - 1].timestamp).toLocaleDateString() : 'None',
          inline: true 
        }
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
}; 