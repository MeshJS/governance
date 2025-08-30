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
      // If API fails, set error and setDrepVotingData(null)
      console.error('Error fetching DRep voting data from API:', apiErr);
      setDrepVotingData(null);
      if (setError) setError('Failed to fetch DRep voting data');
      return;
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
    // Remove fallback to JSON files
  } catch (err) {
    console.error('Error fetching DRep voting data:', err);
    setDrepVotingData(null);
    if (setError) setError('Failed to fetch DRep voting data');
  }
}
