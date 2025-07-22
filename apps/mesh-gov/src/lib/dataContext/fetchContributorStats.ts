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
}: {
    getCurrentYear: () => number;
    safeSetItem: (key: string, value: string) => void;
    setContributorStats: (data: Record<number, ContributorStats> | null) => void;
    setContributorsData: (data: ContributorsData | null) => void;
    setError?: (err: string | null) => void;
    CONTRIBUTOR_STATS_STORAGE_KEY: string;
    CONTRIBUTORS_DATA_STORAGE_KEY: string;
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
    } catch (err) {
        console.error('Error fetching contributor stats:', err);
        setContributorStats(null);
        setContributorsData(null);
        if (setError) setError('Failed to fetch contributor stats');
    }
} 