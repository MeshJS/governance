/**
 * Fetches contributor stats for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import { aggregateMaterializedViewContributorStats } from '../../utils/contributorStats';
import config from '../../../config';

const organizationName = config.mainOrganization.name;

// Helper for localStorage caching with timestamp
function getCachedItem(key: string, cacheDuration: number) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.lastFetched < cacheDuration) {
            return parsed.data;
        }
    } catch { }
    return null;
}

function setCachedItem(key: string, data: any) {
    try {
        localStorage.setItem(key, JSON.stringify({ data, lastFetched: Date.now() }));
    } catch (e) {
        // Ignore quota errors for individual items
    }
}

// Helper to fetch with retry logic
async function fetchWithRetry(url: string, retries = 2): Promise<any> {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                return await res.json();
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        } catch (error) {
            if (i === retries) throw error;
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}

export async function fetchContributorStatsForContext({
    setContributorStats,
    setError
}: {
    setContributorStats: (data: any | null) => void;
    setError?: (err: string | null) => void;
}) {
    // Use the same cache duration as other context variables
    const CACHE_DURATION = process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE === 'false'
        ? 0
        : 5 * 60 * 1000;
    const CONTRIBUTOR_SUMMARY_API_KEY = 'contributorSummaryApiData';
    const CONTRIBUTOR_REPO_ACTIVITY_API_KEY = 'contributorRepoActivityApiData';
    const CONTRIBUTOR_TIMESTAMPS_API_KEY = 'contributorTimestampsApiData';

    try {
        // Try to load each API result from localStorage
        let contributorSummaryData = getCachedItem(CONTRIBUTOR_SUMMARY_API_KEY, CACHE_DURATION);
        let contributorRepoActivityData = getCachedItem(CONTRIBUTOR_REPO_ACTIVITY_API_KEY, CACHE_DURATION);
        let contributorTimestampsData = getCachedItem(CONTRIBUTOR_TIMESTAMPS_API_KEY, CACHE_DURATION);

        // Create an array of fetch promises for missing data
        const fetchPromises: Array<{ key: string; promise: Promise<any>; setData: (data: any) => void }> = [];

        if (!contributorSummaryData) {
            fetchPromises.push({
                key: 'contributorSummary',
                promise: fetchWithRetry(`/api/github/contributor-summary?org=${encodeURIComponent(organizationName)}`),
                setData: (data) => {
                    contributorSummaryData = data.contributorSummary;
                    setCachedItem(CONTRIBUTOR_SUMMARY_API_KEY, contributorSummaryData);
                }
            });
        }

        if (!contributorRepoActivityData) {
            fetchPromises.push({
                key: 'contributorRepoActivity',
                promise: fetchWithRetry(`/api/github/contributor-repo-activity?org=${encodeURIComponent(organizationName)}`),
                setData: (data) => {
                    contributorRepoActivityData = data.contributorRepoActivity;
                    setCachedItem(CONTRIBUTOR_REPO_ACTIVITY_API_KEY, contributorRepoActivityData);
                }
            });
        }

        if (!contributorTimestampsData) {
            fetchPromises.push({
                key: 'contributorTimestamps',
                promise: fetchWithRetry(`/api/github/contributor-timestamps-mat?org=${encodeURIComponent(organizationName)}`),
                setData: (data) => {
                    contributorTimestampsData = data.contributorTimestamps;
                    setCachedItem(CONTRIBUTOR_TIMESTAMPS_API_KEY, contributorTimestampsData);
                }
            });
        }

        // Execute all fetches in parallel for better performance
        if (fetchPromises.length > 0) {
            const results = await Promise.allSettled(fetchPromises.map(async ({ key, promise, setData }) => {
                const data = await promise;
                setData(data);
                return { key, data };
            }));

            // Handle any failed requests
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Failed to fetch ${fetchPromises[index].key}:`, result.reason);
                }
            });
        }

        // Aggregate org-wide stats using the new materialized view function
        const orgStats = aggregateMaterializedViewContributorStats({
            contributorSummaryData,
            contributorRepoActivityData,
            contributorTimestampsData,
        });

        setContributorStats(orgStats);
        if (setError) setError(null);
    } catch (err) {
        console.error('Error fetching contributor stats:', err);
        setContributorStats(null);
        if (setError) setError('Failed to fetch contributor stats');
    }
} 