import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  MeshData,
  CatalystContextData,
  DRepVotingData,
  DiscordStats,
  ContributorStats,
  DataContextType,
} from '../types';
import { fetchMeshDataForContext } from '../lib/dataContext/fetchMeshData';
import { fetchDRepVotingDataForContext } from '../lib/dataContext/fetchDRepVotingData';
import { fetchCatalystDataForContext } from '../lib/dataContext/fetchCatalystData';
import { fetchDiscordStatsForContext } from '../lib/dataContext/fetchDiscordStats';
import { fetchContributorsAllForContext } from '../lib/dataContext/fetchContributorsAll';

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache is enabled by default unless explicitly disabled via NEXT_PUBLIC_ENABLE_DEV_CACHE=false
const CACHE_DURATION = process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE === 'false' ? 0 : 5 * 60 * 1000;
const DEV_CACHE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE !== 'false';
const MESH_STORAGE_KEY = 'meshGovData';
const CATALYST_STORAGE_KEY = 'catalystData';
const DREP_VOTING_STORAGE_KEY = 'drepVotingData';
const DISCORD_STATS_STORAGE_KEY = 'discordStats';
const CONTRIBUTOR_STATS_STORAGE_KEY = 'contributorStats';

const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const safeGetItem = (key: string): string | null => {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  if (!DEV_CACHE_ENABLED) return;
  if (!isLocalStorageAvailable()) return;
  const MAX_CACHE_CHARS = 4_500_000;
  if (value.length > MAX_CACHE_CHARS) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Swallow quota errors
  }
};

/** Try to load fresh cached data from localStorage. Returns parsed data or null. */
function loadFreshCache<T extends { lastFetched: number }>(key: string): T | null {
  const raw = safeGetItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as T;
    if (Date.now() - parsed.lastFetched < CACHE_DURATION) return parsed;
  } catch {
    // Corrupted cache
  }
  return null;
}

/** Create a fetch wrapper that manages loading + error state around a fetch fn. */
function createFetchWrapper(
  setLoading: (v: boolean) => void,
  setError: (v: string | null) => void,
  fetchFn: () => Promise<any>
): () => Promise<void> {
  return async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchFn();
    } finally {
      setLoading(false);
    }
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [meshData, setMeshData] = useState<MeshData | null>(null);
  const [catalystData, setCatalystData] = useState<CatalystContextData | null>(null);
  const [drepVotingData, setDrepVotingData] = useState<DRepVotingData | null>(null);
  const [discordStats, setDiscordStats] = useState<DiscordStats | null>(null);
  const [contributorStats, setContributorStats] = useState<ContributorStats | null>(null);
  const [repoStats, setRepoStats] = useState<any>(null);
  const [nomosStats, setNomosStats] = useState<any>(null);

  const [isLoadingMesh, setIsLoadingMesh] = useState(true);
  const [isLoadingCatalyst, setIsLoadingCatalyst] = useState(true);
  const [isLoadingDRep, setIsLoadingDRep] = useState(true);
  const [isLoadingDiscord, setIsLoadingDiscord] = useState(true);
  const [isLoadingContributors, setIsLoadingContributors] = useState(false);

  const [meshError, setMeshError] = useState<string | null>(null);
  const [catalystError, setCatalystError] = useState<string | null>(null);
  const [drepError, setDrepError] = useState<string | null>(null);
  const [discordError, setDiscordError] = useState<string | null>(null);
  const [contributorsError, setContributorsError] = useState<string | null>(null);

  const isLoading = isLoadingMesh || isLoadingCatalyst || isLoadingDRep || isLoadingDiscord;
  const error = meshError || catalystError || drepError || discordError || contributorsError;

  const getCurrentYear = () => new Date().getFullYear();

  const fetchMeshDataWrapper = createFetchWrapper(setIsLoadingMesh, setMeshError, () =>
    fetchMeshDataForContext({
      getCurrentYear,
      safeSetItem,
      setMeshData,
      setError: setMeshError,
      MESH_STORAGE_KEY,
    })
  );

  const fetchCatalystDataWrapper = createFetchWrapper(setIsLoadingCatalyst, setCatalystError, () =>
    fetchCatalystDataForContext({
      safeSetItem,
      setCatalystData,
      setError: setCatalystError,
      CATALYST_STORAGE_KEY,
    })
  );

  const fetchDRepVotingDataWrapper = createFetchWrapper(setIsLoadingDRep, setDrepError, () =>
    fetchDRepVotingDataForContext({
      getCurrentYear,
      safeSetItem,
      setDrepVotingData,
      setError: setDrepError,
      DREP_VOTING_STORAGE_KEY,
    })
  );

  const fetchDiscordStatsWrapper = createFetchWrapper(setIsLoadingDiscord, setDiscordError, () =>
    fetchDiscordStatsForContext({
      safeSetItem,
      setDiscordStats,
      setError: setDiscordError,
      DISCORD_STATS_STORAGE_KEY,
    })
  );

  const fetchContributorsAllWrapper = createFetchWrapper(
    setIsLoadingContributors,
    setContributorsError,
    () =>
      fetchContributorsAllForContext({
        safeSetItem,
        setContributorStats,
        setError: setContributorsError,
        CONTRIBUTOR_STATS_STORAGE_KEY,
      })
  );

  const loadContributorStats = async () => {
    if (!contributorStats) {
      await fetchContributorsAllWrapper();
    }
  };

  const loadRepoStats = async () => {
    if (!repoStats) {
      try {
        const response = await fetch(
          '/api/github/repo-stats?org=MeshJS&repos=mesh,web3-services,web3-sdk,multisig,midnight,mimir,cquisitor-lib,governance,mesh-pbl'
        );
        if (response.ok) {
          const data = await response.json();
          setRepoStats(data);
        }
      } catch {
        // Repo stats fetch failed
      }
    }
  };

  const loadNomosStats = async () => {
    if (!nomosStats) {
      try {
        const cached = loadFreshCache<{ lastFetched: number }>('nomosStats');
        if (cached) {
          setNomosStats(cached);
          return;
        }
        const response = await fetch('/api/github/nomos-stats');
        if (response.ok) {
          const data = await response.json();
          setNomosStats(data);
          safeSetItem('nomosStats', JSON.stringify({ ...data, lastFetched: Date.now() }));
        }
      } catch {
        // Nomos stats fetch failed
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      // Load cached data immediately for better UX (stale-while-revalidate)
      if (isLocalStorageAvailable() && DEV_CACHE_ENABLED) {
        const cacheEntries: Array<{
          key: string;
          setData: (data: any) => void;
          setLoading: (v: boolean) => void;
        }> = [
          { key: MESH_STORAGE_KEY, setData: setMeshData, setLoading: setIsLoadingMesh },
          { key: CATALYST_STORAGE_KEY, setData: setCatalystData, setLoading: setIsLoadingCatalyst },
          { key: DREP_VOTING_STORAGE_KEY, setData: setDrepVotingData, setLoading: setIsLoadingDRep },
          { key: DISCORD_STATS_STORAGE_KEY, setData: setDiscordStats, setLoading: setIsLoadingDiscord },
          { key: CONTRIBUTOR_STATS_STORAGE_KEY, setData: setContributorStats, setLoading: setIsLoadingContributors },
        ];

        for (const { key, setData, setLoading } of cacheEntries) {
          const cached = loadFreshCache(key);
          if (cached) {
            setData(cached);
            setLoading(false);
          }
        }
      }

      // Start fetching fresh data in parallel (excluding contributors for lazy loading)
      const fetchPromises: Promise<void>[] = [];
      if (isLoadingMesh) fetchPromises.push(fetchMeshDataWrapper());
      if (isLoadingCatalyst) fetchPromises.push(fetchCatalystDataWrapper());
      if (isLoadingDRep) fetchPromises.push(fetchDRepVotingDataWrapper());
      if (isLoadingDiscord) fetchPromises.push(fetchDiscordStatsWrapper());

      await Promise.all(fetchPromises);
    };
    void load();
    // We intentionally run this bootstrap only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetchData = async () => {
    setIsLoadingMesh(true);
    setIsLoadingCatalyst(true);
    setIsLoadingDRep(true);
    setIsLoadingDiscord(true);
    setIsLoadingContributors(true);
    setMeshError(null);
    setCatalystError(null);
    setDrepError(null);
    setDiscordError(null);
    setContributorsError(null);

    await Promise.all([
      fetchMeshDataWrapper(),
      fetchCatalystDataWrapper(),
      fetchDRepVotingDataWrapper(),
      fetchDiscordStatsWrapper(),
      fetchContributorsAllWrapper(),
    ]);
  };

  return (
    <DataContext.Provider
      value={{
        meshData,
        catalystData,
        drepVotingData,
        discordStats,
        contributorStats,
        repoStats,
        nomosStats,
        isLoading,
        error,
        isLoadingMesh,
        isLoadingCatalyst,
        isLoadingDRep,
        isLoadingDiscord,
        isLoadingContributors,
        meshError,
        catalystError,
        drepError,
        discordError,
        contributorsError,
        refetchData,
        loadContributorStats,
        loadRepoStats,
        loadNomosStats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
