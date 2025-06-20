# Discord Verification Bot with Advanced Logging

A Discord bot for user verification with comprehensive logging capabilities. Features real-time database logging, channel notifications, and detailed verification tracking.

## Features

### Core Verification
- **Role-based verification system** - Add verified role and remove unverified role
- **Permission controls** - Mod role required for verification commands
- **User-friendly interactions** - Clean slash command interface

### Advanced Logging System
- **Database logging** - SQLite database stores detailed verification records
- **Real-time channel updates** - Automatic notifications in configured channels
- **Server-side file logs** - Daily log files with optional verbose mode
- **Statistics tracking** - Comprehensive verification analytics

## Commands

### `/verify` - User Verification
The main verification command with multiple subcommands:

#### `/verify user <target>`
Standard user verification without logging
- Adds verified role and removes unverified role
- Quick verification for routine cases

#### `/verify sign <target> [notes]`
Verification with comprehensive logging (**Iceman's requested feature**)
- Logs verification to database with 3-column structure:
  - Verified user ID & display name at time of verification
  - Date/time timestamp
  - Verifier username & user ID
- Sends real-time notification to configured channel
- Creates server-side log entry
- Optional notes for verbose logging

#### `/verify config [channel] [verbose]`
Configure logging settings
- `channel`: Set the Discord channel for verification logs
- `verbose`: Enable/disable detailed server-side logging
- Run without parameters to view current configuration

### `/vlog` - Log Management
Comprehensive log management system:

#### `/vlog update`
Manually update the verification log in the configured channel
- Posts summary of recent verifications
- Updates timestamp
- Perfect for the requested "twice/three times per day" updates

#### `/vlog view [limit]`
View recent verification logs (default: 10, max: 50)
- Shows verification history in an embed
- Includes usernames, verifiers, and timestamps

#### `/vlog stats`
Display comprehensive verification statistics
- Total verifications and unique users
- Most active verifiers
- Recent activity (last 7 days)
- Historical data since first verification

## Database Structure

The bot maintains a SQLite database with detailed verification tracking:

### Verification Logs Table
```sql
- id: Auto-incrementing primary key
- verified_user_id: Discord user ID of verified user
- verified_user_display_name: Display name at time of verification
- verifier_user_id: Discord user ID of verifier
- verifier_username: Verifier's display name
- timestamp: ISO timestamp of verification
- guild_id: Server ID for multi-server support
- additional_data: Optional notes (verbose logging)
```

### Settings Table
```sql
- guild_id: Server ID (primary key)
- log_channel_id: Configured log channel
- verbose_logging: Boolean for detailed logging
```

## Logging Outputs

### 1. Real-time Discord Channel Logs
Beautiful embed notifications posted to your configured channel:
- 🔍 **User Verified** embeds for each `/verify sign`
- Mentions verified user and verifier
- Timestamp and clean formatting

### 2. Server-side File Logs
Daily log files stored in `/logs/` directory:
- **Standard format**: `[timestamp] VERIFICATION: DisplayName (userID) verified by VerifierName (verifierID)`
- **Verbose format**: Includes additional notes and metadata
- **Automatic rotation**: New file each day

### 3. Database Persistence
Permanent SQLite storage for:
- Complete audit trail
- Statistics generation
- Historical analysis
- Multi-server support

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your bot token and role IDs
   ```

3. **Build and start**:
   ```bash
   npm run build
   npm start
   
   # Or for development:
   npm run dev
   ```

4. **Configure logging** (in Discord):
   ```
   /verify config channel:#your-log-channel verbose:true
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Discord bot token | ✅ |
| `CLIENT_ID` | Discord application client ID | ✅ |
| `GUILD_ID` | Guild ID for faster development | ❌ |
| `MOD_ROLE_ID` | Role ID for moderators | ✅ |
| `VERIFIED_ROLE_ID` | Role ID for verified users | ✅ |
| `UNVERIFIED_ROLE_ID` | Role ID for unverified users | ✅ |

## Key Advantages (Per Iceman's Vision)

1. **Real-time Updates**: Every `/verify sign` immediately logs to your channel
2. **Complete Audit Trail**: Database maintains permanent record of all verifications  
3. **Flexible Timing**: Use `/vlog update` for manual updates or automated scheduling
4. **Verbose Server Logs**: Detailed file-based logs with additional metadata
5. **Statistical Insights**: Track verification patterns and moderator activity
6. **Multi-server Ready**: Database structure supports multiple Discord servers

## File Structure

```
MiraFY/
├── src/
│   ├── commands/
│   │   ├── verify.ts      # Main verification command with subcommands
│   │   ├── vlog.ts        # Log management commands
│   │   └── handler.ts     # Command routing
│   ├── utils/
│   │   ├── database.ts    # SQLite database operations
│   │   └── logger.ts      # Channel and file logging utilities
│   ├── index.ts           # Bot initialization
│   └── deploy-commands.ts # Command registration
├── data/                  # SQLite database storage (auto-created)
├── logs/                  # Daily verification logs (auto-created)
└── package.json
```

## Usage Examples

### Basic Verification
```
/verify user @NewUser
# Adds role, no logging
```

### Signed Verification with Logging
```
/verify sign @NewUser notes:Verified via voice chat
# Full logging: database, channel, and file
```

### Configure Logging Channel
```
/verify config channel:#verification-logs verbose:true
# Sets up automated logging to #verification-logs
```

### Manual Log Updates
```
/vlog update
# Posts updated verification summary to configured channel
```

This system gives you **complete control** over verification logging with the **real-time updates** and **meticulous record-keeping** that Iceman envisioned!
