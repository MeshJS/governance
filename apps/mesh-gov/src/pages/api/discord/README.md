# Discord API Routes

This directory contains API routes for fetching Discord statistics from the Supabase database.

## Routes

### GET `/api/discord/stats/[guildId]`

Fetches Discord stats for a specific guild ID.

**Parameters:**

- `guildId` (string): The Discord guild ID

**Response:**

```json
{
  "guild_id": "907191435864977459",
  "updated_at": "2025-07-19T06:29:34.297Z",
  "stats": {
    "2025-01": {
      "memberCount": 720,
      "totalMessages": 1124,
      "uniquePosters": 22
    },
    "2025-02": {
      "memberCount": 723,
      "totalMessages": 1854,
      "uniquePosters": 30
    }
  }
}
```

**Error Responses:**

- `404`: Guild stats not found
- `400`: Invalid guild ID parameter
- `500`: Internal server error

## Environment Variables

The following environment variables must be set:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Database Schema

The API connects to the `discord_stats` table with the following structure:

- `guild_id` (varchar): Discord guild ID (primary key)
- `updated_at` (timestamptz): Last update timestamp
- `stats` (jsonb): JSON object containing monthly statistics with:
  - `memberCount`: Number of members in the guild
  - `totalMessages`: Total messages sent in that month
  - `uniquePosters`: Number of unique users who posted messages

## Utility Functions

The `DiscordAPI` class in `src/lib/discord.ts` provides reusable functions:

- `getGuildStats(guildId)`: Fetch stats for a specific guild
