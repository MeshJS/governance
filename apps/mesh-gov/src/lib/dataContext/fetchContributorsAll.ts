/**
 * Fetches all contributor-related datasets in one shot for use in DataContext.
 * This reduces races between separate fetches and keeps datasets in sync.
 */
import config from '../../../config';
import type { ContributorStats } from '../../types';

const organizationName = config.mainOrganization.name;

// In-memory fetch/cache for contributors-all (aggregated ContributorStats)

let inFlight: Promise<ContributorStats> | null = null;
let lastValue: ContributorStats | null = null;
let lastFetchedAt: number | null = null;

const IN_MEMORY_TTL_MS = 60 * 1000;

export const getContributorsAllOnce = async (
    orgName: string = organizationName
): Promise<ContributorStats> => {
    const now = Date.now();
    if (lastValue && lastFetchedAt && now - lastFetchedAt < IN_MEMORY_TTL_MS) {
        return lastValue;
    }
    if (inFlight) return inFlight;

    inFlight = (async () => {
        const response = await fetch(`/api/github/contributors-all?org=${encodeURIComponent(orgName)}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = (await response.json()) as ContributorStats;
        lastValue = data;
        lastFetchedAt = Date.now();
        return data;
    })()
        .finally(() => {
            inFlight = null;
        });

    return inFlight;
};

export interface FetchContributorsAllArgs {
    safeSetItem: (key: string, value: string) => void;
    setContributorStats: (data: ContributorStats | null) => void;
    setError: (err: string | null) => void;
    CONTRIBUTOR_STATS_STORAGE_KEY: string;
}

export async function fetchContributorsAllForContext({
    safeSetItem,
    setContributorStats,
    setError,
    CONTRIBUTOR_STATS_STORAGE_KEY,
}: FetchContributorsAllArgs) {
    try {
        const data = await getContributorsAllOnce(organizationName);
        const nowTs = Date.now();

        // API already returns aggregated ContributorStats
        const contributorStats: ContributorStats = data;
        setContributorStats(contributorStats);

        // Persist aggregated stats only (safeSetItem is a no-op if disabled/unavailable)
        safeSetItem(
            CONTRIBUTOR_STATS_STORAGE_KEY,
            JSON.stringify({ ...contributorStats, lastFetched: nowTs })
        );

        setError(null);

        return {
            contributorStats,
        };
    } catch (err) {
        console.error('Error fetching contributors-all data:', err);
        // Keep individual states untouched on failure to preserve last good render
        setError('Failed to fetch contributors data');
        return null;
    }
}


