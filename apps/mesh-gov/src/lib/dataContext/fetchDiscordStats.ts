/**
 * Fetches Discord stats for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import fetchData from '../fetchData';
import config from '../../../config';

export async function fetchDiscordStatsForContext({
    safeSetItem,
    setDiscordStats,
    setError,
    DISCORD_STATS_STORAGE_KEY,
}: {
    safeSetItem: (key: string, value: string) => void;
    setDiscordStats: (data: any) => void;
    setError?: (err: string | null) => void;
    DISCORD_STATS_STORAGE_KEY: string;
}) {
    try {
        const guildId = config.discordGuildId;
        if (guildId) {
            try {
                const apiData = await fetchData(`/api/discord/stats/${guildId}`);
                if (apiData && apiData.stats) {
                    const newData = {
                        stats: apiData.stats,
                        lastFetched: Date.now()
                    };
                    safeSetItem(DISCORD_STATS_STORAGE_KEY, JSON.stringify(newData));
                    setDiscordStats(newData);
                    if (setError) setError(null);
                    return;
                }
            } catch (apiError) {
                // If API fails, set error and setDiscordStats(null)
                console.error('Error fetching Discord stats from API:', apiError);
                setDiscordStats(null);
                if (setError) setError('Failed to fetch Discord stats');
                return;
            }
        }
        // Remove fallback to old JSON file method
    } catch (err) {
        console.error('Error fetching Discord stats:', err);
        setDiscordStats(null);
        if (setError) setError('Failed to fetch Discord stats');
    }
} 