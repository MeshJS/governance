/**
 * Fetches contributor stats for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import { aggregateApiContributorStats } from '../../utils/contributorStats';
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
    const CONTRIBUTORS_API_KEY = 'contributorsApiData';
    const COMMITS_API_KEY = 'commitsApiData';
    const PULL_REQUESTS_API_KEY = 'pullRequestsApiData';
    const ISSUES_API_KEY = 'issuesApiData';
    const REPOS_API_KEY = 'reposApiData';

    try {
        // Try to load each API result from localStorage
        let contributorsApiData = getCachedItem(CONTRIBUTORS_API_KEY, CACHE_DURATION);
        let commitsApiData = getCachedItem(COMMITS_API_KEY, CACHE_DURATION);
        let pullRequestsApiData = getCachedItem(PULL_REQUESTS_API_KEY, CACHE_DURATION);
        let issuesApiData = getCachedItem(ISSUES_API_KEY, CACHE_DURATION);
        let reposApiData = getCachedItem(REPOS_API_KEY, CACHE_DURATION);

        // Create an array of fetch promises for missing data
        const fetchPromises: Array<{ key: string; promise: Promise<any>; setData: (data: any) => void }> = [];

        if (!contributorsApiData) {
            fetchPromises.push({
                key: 'contributors',
                promise: fetchWithRetry(`/api/github?org=${encodeURIComponent(organizationName)}`),
                setData: (data) => {
                    contributorsApiData = data.contributors;
                    setCachedItem(CONTRIBUTORS_API_KEY, contributorsApiData);
                }
            });
        }

        if (!commitsApiData) {
            fetchPromises.push({
                key: 'commits',
                promise: fetchWithRetry(`/api/github/commits?org=${encodeURIComponent(organizationName)}`),
                setData: (data) => {
                    commitsApiData = data.commits;
                    setCachedItem(COMMITS_API_KEY, commitsApiData);
                }
            });
        }

        if (!pullRequestsApiData) {
            fetchPromises.push({
                key: 'pullRequests',
                promise: fetchWithRetry(`/api/github/pull-requests?org=${encodeURIComponent(organizationName)}`),
                setData: (data) => {
                    pullRequestsApiData = data.pullRequests;
                    setCachedItem(PULL_REQUESTS_API_KEY, pullRequestsApiData);
                }
            });
        }

        if (!issuesApiData) {
            fetchPromises.push({
                key: 'issues',
                promise: fetchWithRetry(`/api/github/issues?org=${encodeURIComponent(organizationName)}`),
                setData: (data) => {
                    issuesApiData = data.issues;
                    setCachedItem(ISSUES_API_KEY, issuesApiData);
                }
            });
        }

        if (!reposApiData) {
            fetchPromises.push({
                key: 'repos',
                promise: fetchWithRetry(`/api/github/repos?org=${encodeURIComponent(organizationName)}`),
                setData: (data) => {
                    reposApiData = data.repos;
                    setCachedItem(REPOS_API_KEY, reposApiData);
                }
            });
        }

        // Execute fetches in batches to avoid overwhelming the API
        const BATCH_SIZE = 2;
        for (let i = 0; i < fetchPromises.length; i += BATCH_SIZE) {
            const batch = fetchPromises.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(batch.map(async ({ key, promise, setData }) => {
                const data = await promise;
                setData(data);
                return { key, data };
            }));

            // Handle any failed requests in this batch
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Failed to fetch ${batch[index].key}:`, result.reason);
                }
            });
        }

        // Aggregate org-wide stats in-memory only
        const orgStats = aggregateApiContributorStats({
            contributorsApiData,
            commitsApiData,
            pullRequestsApiData,
            issuesApiData,
            reposApiData,
        });

        setContributorStats(orgStats);
        if (setError) setError(null);
    } catch (err) {
        console.error('Error fetching contributor stats:', err);
        setContributorStats(null);
        if (setError) setError('Failed to fetch contributor stats');
    }
} 