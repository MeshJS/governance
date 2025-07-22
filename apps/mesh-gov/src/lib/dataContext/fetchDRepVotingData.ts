/**
 * Fetches DRep voting data for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import fetchData from '../fetchData';
import { DRepVotingData, GovernanceVote } from '../../types';
import config from '../../../config';

export async function fetchDRepVotingDataForContext({
    getCurrentYear,
    safeSetItem,
    setDrepVotingData,
    setError,
    DREP_VOTING_STORAGE_KEY,
}: {
    getCurrentYear: () => number;
    safeSetItem: (key: string, value: string) => void;
    setDrepVotingData: (data: DRepVotingData | null) => void;
    setError?: (err: string | null) => void;
    DREP_VOTING_STORAGE_KEY: string;
}) {
    try {
        const drepId = config.drepId;
        let apiData: any = null;
        try {
            apiData = await fetchData(`/api/drep/votes?drepId=${drepId}`);
        } catch (apiErr) {
            // Ignore, will fallback
        }
        if (apiData && Array.isArray(apiData.votes) && apiData.delegationData) {
            const newData: DRepVotingData = {
                votes: apiData.votes as GovernanceVote[],
                delegationData: apiData.delegationData || null,
                lastFetched: Date.now(),
            };
            safeSetItem(DREP_VOTING_STORAGE_KEY, JSON.stringify(newData));
            setDrepVotingData(newData);
            if (setError) setError(null);
            return;
        }
        // Fallback to JSON files if API fails or is missing data
        const currentYear = getCurrentYear();
        const startYear = 2024;
        const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
        const yearlyVotesResults = await Promise.all(years.map(year => fetchData(`https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/drep-voting/${year}_voting.json`).catch(() => null)));
        const allVotes = yearlyVotesResults.filter(votes => votes !== null).flat() as GovernanceVote[];
        const delegationData = await fetchData('https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/drep-voting/drep-delegation-info.json');
        const newData: DRepVotingData = {
            votes: allVotes,
            delegationData: delegationData || null,
            lastFetched: Date.now(),
        };
        safeSetItem(DREP_VOTING_STORAGE_KEY, JSON.stringify(newData));
        setDrepVotingData(newData);
        if (setError) setError(null);
    } catch (err) {
        console.error('Error fetching DRep voting data:', err);
        setDrepVotingData(null);
        if (setError) setError('Failed to fetch DRep voting data');
    }
} 