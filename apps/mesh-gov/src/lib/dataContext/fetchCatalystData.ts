/**
 * Fetches Catalyst data for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import fetchData from '../fetchData';
import { CatalystContextData } from '../../types';
import { fetchCatalystProposalsViaAPI } from '../../utils/catalystDataTransform';
import config from '../../../config';

export async function fetchCatalystDataForContext({
  safeSetItem,
  setCatalystData,
  setError,
  CATALYST_STORAGE_KEY,
}: {
  safeSetItem: (key: string, value: string) => void;
  setCatalystData: (data: CatalystContextData | null) => void;
  setError?: (err: string | null) => void;
  CATALYST_STORAGE_KEY: string;
}) {
  try {
    const meshProjectIds = config.catalystProjectIds.split(',').map((id: string) => id.trim());
    try {
      const apiData = await fetchCatalystProposalsViaAPI(meshProjectIds);
      if (apiData && apiData.projects && apiData.projects.length > 0) {
        const newData: CatalystContextData = {
          catalystData: apiData,
          lastFetched: Date.now(),
        };
        safeSetItem(CATALYST_STORAGE_KEY, JSON.stringify(newData));
        setCatalystData(newData);
        if (setError) setError(null);
        return;
      }
    } catch (apiError) {
      // If API fails, set error and setCatalystData(null)
      console.error('Error fetching catalyst data from API:', apiError);
      setCatalystData(null);
      if (setError) setError('Failed to fetch catalyst data');
      return;
    }
  } catch (err) {
    console.error('Error fetching catalyst data:', err);
    setCatalystData(null);
    if (setError) setError('Failed to fetch catalyst data');
  }
}
