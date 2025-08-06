/**
 * Aggregates contributor stats from individual data sources for use in DataContext.
 * This function now expects the individual data to be already fetched and cached by the context.
 */
import { aggregateMaterializedViewContributorStats } from '../../utils/contributorStats';

export async function aggregateContributorStatsForContext({
    contributorSummaryData,
    contributorRepoActivityData,
    contributorTimestampsData,
    setContributorStats,
    setError
}: {
    contributorSummaryData: any | null;
    contributorRepoActivityData: any | null;
    contributorTimestampsData: any | null;
    setContributorStats: (data: any | null) => void;
    setError?: (err: string | null) => void;
}) {
    try {
        // Check if all required data is available
        if (!contributorSummaryData?.contributorSummary ||
            !contributorRepoActivityData?.contributorRepoActivity ||
            !contributorTimestampsData?.contributorTimestamps) {
            setContributorStats(null);
            if (setError) setError('Missing contributor data for aggregation');
            return;
        }

        // Aggregate org-wide stats using the materialized view function
        const orgStats = aggregateMaterializedViewContributorStats({
            contributorSummaryData: contributorSummaryData.contributorSummary,
            contributorRepoActivityData: contributorRepoActivityData.contributorRepoActivity,
            contributorTimestampsData: contributorTimestampsData.contributorTimestamps,
        });

        setContributorStats(orgStats);
        if (setError) setError(null);
    } catch (err) {
        console.error('Error aggregating contributor stats:', err);
        setContributorStats(null);
        if (setError) setError('Failed to aggregate contributor stats');
    }
} 