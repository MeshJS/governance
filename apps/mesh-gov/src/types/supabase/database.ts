// Supabase Database Schema Types
// This file contains TypeScript types that match your Supabase database schema

// Database table types - these match the actual Supabase schema
export interface DiscordStatsTable {
    guild_id: string;
    updated_at: string;
    stats: {
        [yearMonth: string]: {
            memberCount: number;
            totalMessages: number;
            uniquePosters: number;
        };
    };
}

export interface DiscordStatsResponse {
    data: DiscordStatsTable[];
}

// Re-export the table type with the original name for backward compatibility
export type DiscordStats = DiscordStatsTable;

// Add more database table types here as needed
// Example:
// export interface Users {
//     id: string;
//     email: string;
//     created_at: string;
//     updated_at: string;
// }

// export interface Projects {
//     id: string;
//     name: string;
//     description: string;
//     created_at: string;
//     updated_at: string;
// } 