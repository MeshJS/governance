/**
 * Fetches contributor stats for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import fetchData from '../fetchData';
import { aggregateContributorStats } from '../../utils/contributorStats';
import { ContributorStats, ContributorsData } from '../../types';

export async function fetchContributorStatsForContext({
    getCurrentYear,
    safeSetItem,
    setContributorStats,
    setContributorsData,
    setError,
    CONTRIBUTOR_STATS_STORAGE_KEY,
    CONTRIBUTORS_DATA_STORAGE_KEY,
    setContributorsApiData,
    setCommitsApiData,
    setPullRequestsApiData,
    setIssuesApiData,
}: {
    getCurrentYear: () => number;
    safeSetItem: (key: string, value: string) => void;
    setContributorStats: (data: Record<number, ContributorStats> | null) => void;
    setContributorsData: (data: ContributorsData | null) => void;
    setError?: (err: string | null) => void;
    CONTRIBUTOR_STATS_STORAGE_KEY: string;
    CONTRIBUTORS_DATA_STORAGE_KEY: string;
    setContributorsApiData?: (data: any) => void;
    setCommitsApiData?: (data: any) => void;
    setPullRequestsApiData?: (data: any) => void;
    setIssuesApiData?: (data: any) => void;
}) {
    try {
        const currentYear = getCurrentYear();
        const startYear = 2022;
        const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
        const yearlyStatsPromises = years.map(year =>
            fetchData(`https://raw.githubusercontent.com/Signius/mesh-automations/refs/heads/main/mesh-gov-updates/mesh-stats/contributions/contributors-${year}.json`).catch(() => null)
        );
        const yearlyStatsResults = await Promise.all(yearlyStatsPromises);
        const yearlyStats = years.reduce((acc, year, index) => {
            if (yearlyStatsResults[index] !== null) {
                acc[year] = yearlyStatsResults[index];
            }
            return acc;
        }, {} as Record<number, ContributorStats>);
        const aggregatedContributors = aggregateContributorStats(yearlyStats);
        const totals = aggregatedContributors.reduce((acc, contributor) => ({
            total_commits: acc.total_commits + contributor.commits,
            total_pull_requests: acc.total_pull_requests + contributor.pull_requests,
            total_contributions: acc.total_contributions + contributor.contributions
        }), {
            total_commits: 0,
            total_pull_requests: 0,
            total_contributions: 0
        });
        const newData = {
            stats: yearlyStats,
            lastFetched: Date.now()
        };
        safeSetItem(CONTRIBUTOR_STATS_STORAGE_KEY, JSON.stringify(newData));
        setContributorStats(yearlyStats);
        const newContributorsData: ContributorsData = {
            unique_count: aggregatedContributors.length,
            contributors: aggregatedContributors,
            ...totals,
            lastFetched: Date.now()
        };
        safeSetItem(CONTRIBUTORS_DATA_STORAGE_KEY, JSON.stringify(newContributorsData));
        setContributorsData(newContributorsData);
        if (setError) setError(null);
        if (setContributorsApiData) {
            fetch('/api/contributors')
                .then(res => res.json())
                .then(data => setContributorsApiData(data.contributors))
                .catch(err => console.error('Error fetching contributors API data:', err));
        }
        if (setCommitsApiData) {
            fetch('/api/contributors/commits')
                .then(res => res.json())
                .then(data => setCommitsApiData(data.commits))
                .catch(err => console.error('Error fetching commits API data:', err));
        }
        if (setPullRequestsApiData) {
            fetch('/api/contributors/pull-requests')
                .then(res => res.json())
                .then(data => setPullRequestsApiData(data.pullRequests))
                .catch(err => console.error('Error fetching pull requests API data:', err));
        }
        if (setIssuesApiData) {
            fetch('/api/contributors/issues')
                .then(res => res.json())
                .then(data => setIssuesApiData(data.issues))
                .catch(err => console.error('Error fetching issues API data:', err));
        }
    } catch (err) {
        console.error('Error fetching contributor stats:', err);
        setContributorStats(null);
        setContributorsData(null);
        if (setError) setError('Failed to fetch contributor stats');
    }
} 