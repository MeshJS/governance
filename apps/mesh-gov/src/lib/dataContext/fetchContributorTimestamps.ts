/**
 * Fetches contributor timestamps data for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import config from '../../../config';

const organizationName = config.mainOrganization.name;

export async function fetchContributorTimestampsForContext({
    safeSetItem,
    setContributorTimestampsData,
    setError,
    CONTRIBUTOR_TIMESTAMPS_STORAGE_KEY,
}: {
    safeSetItem: (key: string, value: string) => void;
    setContributorTimestampsData: (data: any) => void;
    setError: (err: string | null) => void;
    CONTRIBUTOR_TIMESTAMPS_STORAGE_KEY: string;
}) {
    try {
        const response = await fetch(`/api/github/contributor-timestamps-mat?org=${encodeURIComponent(organizationName)}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const contributorTimestampsData = {
            contributorTimestamps: data.contributorTimestamps,
            lastFetched: Date.now()
        };

        setContributorTimestampsData(contributorTimestampsData);
        safeSetItem(CONTRIBUTOR_TIMESTAMPS_STORAGE_KEY, JSON.stringify(contributorTimestampsData));
        setError(null);
    } catch (err) {
        console.error('Error fetching contributor timestamps data:', err);
        setContributorTimestampsData(null);
        setError('Failed to fetch contributor timestamps data');
    }
} 