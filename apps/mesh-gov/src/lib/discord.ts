import { supabase } from './supabase';
import { DiscordStats } from '../types/supabase';

export class DiscordAPI {
  /**
   * Fetch Discord stats for a specific guild
   */
  static async getGuildStats(guildId: string): Promise<DiscordStats | null> {
    const { data, error } = await supabase
      .from('discord_stats')
      .select('*')
      .eq('guild_id', guildId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch guild stats: ${error.message}`);
    }

    return data as DiscordStats;
  }
}
