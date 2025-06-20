import Database from 'better-sqlite3';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface VerificationLog {
  id?: number;
  verified_user_id: string;
  verified_user_display_name: string;
  verifier_user_id: string;
  verifier_username: string;
  timestamp: string;
  guild_id: string;
  additional_data?: string; // For verbose logging
}

class VerificationDatabase {
  private db: Database.Database;

  constructor() {
    // Ensure database directory exists
    const dbDir = path.join(process.cwd(), 'data');
    fs.ensureDirSync(dbDir);
    
    // Initialize database
    this.db = new Database(path.join(dbDir, 'verifications.db'));
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create verification logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS verification_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        verified_user_id TEXT NOT NULL,
        verified_user_display_name TEXT NOT NULL,
        verifier_user_id TEXT NOT NULL,
        verifier_username TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        additional_data TEXT
      )
    `);

    // Create settings table for channel configuration
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        guild_id TEXT PRIMARY KEY,
        log_channel_id TEXT,
        verbose_logging BOOLEAN DEFAULT 0
      )
    `);
  }

  logVerification(verification: VerificationLog): number {
    const stmt = this.db.prepare(`
      INSERT INTO verification_logs 
      (verified_user_id, verified_user_display_name, verifier_user_id, verifier_username, timestamp, guild_id, additional_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      verification.verified_user_id,
      verification.verified_user_display_name,
      verification.verifier_user_id,
      verification.verifier_username,
      verification.timestamp,
      verification.guild_id,
      verification.additional_data || null
    );
    
    return result.lastInsertRowid as number;
  }

  getVerificationLogs(guildId: string, limit: number = 100): VerificationLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM verification_logs 
      WHERE guild_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    return stmt.all(guildId, limit) as VerificationLog[];
  }

  setLogChannel(guildId: string, channelId: string) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (guild_id, log_channel_id)
      VALUES (?, ?)
    `);
    
    stmt.run(guildId, channelId);
  }

  getLogChannel(guildId: string): string | null {
    const stmt = this.db.prepare(`
      SELECT log_channel_id FROM settings WHERE guild_id = ?
    `);
    
    const result = stmt.get(guildId) as { log_channel_id: string } | undefined;
    return result?.log_channel_id || null;
  }

  setVerboseLogging(guildId: string, enabled: boolean) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (guild_id, verbose_logging)
      VALUES (?, ?)
    `);
    
    stmt.run(guildId, enabled ? 1 : 0);
  }

  isVerboseLogging(guildId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT verbose_logging FROM settings WHERE guild_id = ?
    `);
    
    const result = stmt.get(guildId) as { verbose_logging: number } | undefined;
    return result?.verbose_logging === 1;
  }
}

export const verificationDB = new VerificationDatabase(); 