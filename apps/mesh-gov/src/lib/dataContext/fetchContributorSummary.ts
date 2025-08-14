/**
 * Fetches contributor summary data for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import config from '../../../config';
import { getContributorsAllOnce } from '../contributorsAllFetcher';

const organizationName = config.mainOrganization.name;

export async function fetchContributorSummaryForContext({
    safeSetItem,
    setContributorSummaryData,
    setError,
    CONTRIBUTOR_SUMMARY_STORAGE_KEY,
}: {
    safeSetItem: (key: string, value: string) => void;
    setContributorSummaryData: (data: any) => void;
    setError: (err: string | null) => void;
    CONTRIBUTOR_SUMMARY_STORAGE_KEY: string;
}) {
    try {
        const data = await getContributorsAllOnce(organizationName);
        const contributorSummaryData = {
            contributorSummary: data.contributorSummary,
            lastFetched: Date.now()
        };

        setContributorSummaryData(contributorSummaryData);
        safeSetItem(CONTRIBUTOR_SUMMARY_STORAGE_KEY, JSON.stringify(contributorSummaryData));
        setError(null);
    } catch (err) {
        console.error('Error fetching contributor summary data:', err);
        setContributorSummaryData(null);
        setError('Failed to fetch contributor summary data');
    }
} 