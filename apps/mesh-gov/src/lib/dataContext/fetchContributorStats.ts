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

        // Fetch from API if not cached
        if (!contributorsApiData) {
            const res = await fetch(`/api/github?org=${encodeURIComponent(organizationName)}`);
            contributorsApiData = (await res.json()).contributors;
            setCachedItem(CONTRIBUTORS_API_KEY, contributorsApiData);
        }
        if (!commitsApiData) {
            const res = await fetch(`/api/github/commits?org=${encodeURIComponent(organizationName)}`);
            commitsApiData = (await res.json()).commits;
            setCachedItem(COMMITS_API_KEY, commitsApiData);
        }
        if (!pullRequestsApiData) {
            const res = await fetch(`/api/github/pull-requests?org=${encodeURIComponent(organizationName)}`);
            pullRequestsApiData = (await res.json()).pullRequests;
            setCachedItem(PULL_REQUESTS_API_KEY, pullRequestsApiData);
        }
        if (!issuesApiData) {
            const res = await fetch(`/api/github/issues?org=${encodeURIComponent(organizationName)}`);
            issuesApiData = (await res.json()).issues;
            setCachedItem(ISSUES_API_KEY, issuesApiData);
        }
        if (!reposApiData) {
            const res = await fetch(`/api/github/repos?org=${encodeURIComponent(organizationName)}`);
            reposApiData = (await res.json()).repos;
            setCachedItem(REPOS_API_KEY, reposApiData);
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