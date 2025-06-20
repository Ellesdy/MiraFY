import { TextChannel, Guild, EmbedBuilder } from 'discord.js';
import { verificationDB, VerificationLog } from './database';
import * as fs from 'fs-extra';
import * as path from 'path';

export class VerificationLogger {
  
  static async logToChannel(guild: Guild, verification: VerificationLog): Promise<void> {
    const channelId = verificationDB.getLogChannel(guild.id);
    if (!channelId) return;

    try {
      const channel = await guild.channels.fetch(channelId) as TextChannel;
      if (!channel || !channel.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setTitle('🔍 User Verified')
        .setColor(0x00ff00)
        .addFields(
          { name: 'Verified User', value: `<@${verification.verified_user_id}> (${verification.verified_user_display_name})`, inline: true },
          { name: 'Verified By', value: `<@${verification.verifier_user_id}> (${verification.verifier_username})`, inline: true },
          { name: 'Timestamp', value: verification.timestamp, inline: false }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error logging to channel:', error);
    }
  }

  static async updateChannelLog(guild: Guild): Promise<void> {
    const channelId = verificationDB.getLogChannel(guild.id);
    if (!channelId) return;

    try {
      const channel = await guild.channels.fetch(channelId) as TextChannel;
      if (!channel || !channel.isTextBased()) return;

      const logs = verificationDB.getVerificationLogs(guild.id, 20);
      
      let logText = '**📋 Recent Verification Log**\n\n';
      
      if (logs.length === 0) {
        logText += '*No verifications recorded yet.*';
      } else {
        logs.forEach((log, index) => {
          logText += `**${index + 1}.** ${log.verified_user_display_name} `;
          logText += `verified by ${log.verifier_username} `;
          logText += `on ${new Date(log.timestamp).toLocaleString()}\n`;
        });
      }

      logText += `\n*Last updated: ${new Date().toLocaleString()}*`;

      const embed = new EmbedBuilder()
        .setTitle('🔍 Verification Log Summary')
        .setDescription(logText)
        .setColor(0x0099ff)
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error updating channel log:', error);
    }
  }

  static async logToServerFile(verification: VerificationLog): Promise<void> {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      await fs.ensureDir(logDir);
      
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `verifications-${date}.log`);
      
      const isVerbose = verificationDB.isVerboseLogging(verification.guild_id);
      
      let logEntry = `[${verification.timestamp}] `;
      logEntry += `VERIFICATION: ${verification.verified_user_display_name} (${verification.verified_user_id}) `;
      logEntry += `verified by ${verification.verifier_username} (${verification.verifier_user_id})`;
      
      if (isVerbose && verification.additional_data) {
        logEntry += ` | Additional: ${verification.additional_data}`;
      }
      
      logEntry += '\n';
      
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      console.error('Error logging to server file:', error);
    }
  }
} 