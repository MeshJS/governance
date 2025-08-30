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

// --- GitHub Organizations Table ---
export interface GithubOrg {
  id: number; // BIGINT in DB, use number for TS
  login: string;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  html_url: string | null;
  created_at: string;
  updated_at: string;
}

// --- GitHub Repositories Table ---
export interface GithubRepo {
  id: number; // BIGINT in DB, use number for TS
  org_id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  html_url: string | null;
  created_at: string;
  updated_at: string;
}
