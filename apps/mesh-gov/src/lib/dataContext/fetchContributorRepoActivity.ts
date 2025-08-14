/**
 * Fetches contributor repo activity data for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import config from '../../../config';
import { getContributorsAllOnce } from '../contributorsAllFetcher';

const organizationName = config.mainOrganization.name;

export async function fetchContributorRepoActivityForContext({
    safeSetItem,
    setContributorRepoActivityData,
    setError,
    CONTRIBUTOR_REPO_ACTIVITY_STORAGE_KEY,
}: {
    safeSetItem: (key: string, value: string) => void;
    setContributorRepoActivityData: (data: any) => void;
    setError: (err: string | null) => void;
    CONTRIBUTOR_REPO_ACTIVITY_STORAGE_KEY: string;
}) {
    try {
        const data = await getContributorsAllOnce(organizationName);
        const contributorRepoActivityData = {
            contributorRepoActivity: data.contributorRepoActivity,
            lastFetched: Date.now()
        };

        setContributorRepoActivityData(contributorRepoActivityData);
        safeSetItem(CONTRIBUTOR_REPO_ACTIVITY_STORAGE_KEY, JSON.stringify(contributorRepoActivityData));
        setError(null);
    } catch (err) {
        console.error('Error fetching contributor repo activity data:', err);
        setContributorRepoActivityData(null);
        setError('Failed to fetch contributor repo activity data');
    }
} 