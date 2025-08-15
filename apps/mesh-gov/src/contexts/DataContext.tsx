// ../contexts/DataContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MeshData, CatalystContextData, DRepVotingData, DiscordStats, ContributorStats, DataContextType } from '../types';
import { fetchMeshDataForContext } from '../lib/dataContext/fetchMeshData';
import { fetchDRepVotingDataForContext } from '../lib/dataContext/fetchDRepVotingData';
import { fetchCatalystDataForContext } from '../lib/dataContext/fetchCatalystData';
import { fetchDiscordStatsForContext } from '../lib/dataContext/fetchDiscordStats';
import { fetchContributorsAllForContext } from '../lib/dataContext/fetchContributorsAll';

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache is enabled by default unless explicitly disabled via NEXT_PUBLIC_ENABLE_DEV_CACHE=false
const CACHE_DURATION = process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE === 'false'
    ? 0
    : 5 * 60 * 1000;
const DEV_CACHE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE !== 'false';
const MESH_STORAGE_KEY = 'meshGovData';
const CATALYST_STORAGE_KEY = 'catalystData';
const DREP_VOTING_STORAGE_KEY = 'drepVotingData';
const DISCORD_STATS_STORAGE_KEY = 'discordStats';
const CONTRIBUTOR_STATS_STORAGE_KEY = 'contributorStats';

// Utility function to check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
    try {
        const testKey = '__test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        console.warn('localStorage is not available:', e);
        return false;
    }
};

// Safe localStorage getItem with fallback
const safeGetItem = (key: string): string | null => {
    if (!isLocalStorageAvailable()) return null;
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error(`Error reading ${key} from localStorage:`, e);
        return null;
    }
};

// Safe localStorage setItem
const safeSetItem = (key: string, value: string): void => {
    if (!DEV_CACHE_ENABLED) return;
    if (!isLocalStorageAvailable()) return;
    // Rough guard to avoid exceeding typical 5MB quota (UTF-16 ~2 bytes/char)
    // 4.5M chars ~ 9MB worst case; this is conservative. Skip if too large.
    const MAX_CACHE_CHARS = 4_500_000;
    if (value.length > MAX_CACHE_CHARS) {
        console.warn(`Skipping cache for ${key}: payload too large (${value.length} chars)`);
        return;
    }
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // Swallow quota errors in development to avoid crashing the app
        console.warn(`Skipping cache for ${key} due to storage error:`, e);
    }
};

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [meshData, setMeshData] = useState<MeshData | null>(null);
    const [catalystData, setCatalystData] = useState<CatalystContextData | null>(null);
    const [drepVotingData, setDrepVotingData] = useState<DRepVotingData | null>(null);
    const [discordStats, setDiscordStats] = useState<DiscordStats | null>(null);

    // Contributor stats only
    const [contributorStats, setContributorStats] = useState<ContributorStats | null>(null);

    // Individual loading states
    const [isLoadingMesh, setIsLoadingMesh] = useState(true);
    const [isLoadingCatalyst, setIsLoadingCatalyst] = useState(true);
    const [isLoadingDRep, setIsLoadingDRep] = useState(true);
    const [isLoadingDiscord, setIsLoadingDiscord] = useState(true);
    const [isLoadingContributors, setIsLoadingContributors] = useState(false);

    // Individual error states
    const [meshError, setMeshError] = useState<string | null>(null);
    const [catalystError, setCatalystError] = useState<string | null>(null);
    const [drepError, setDrepError] = useState<string | null>(null);
    const [discordError, setDiscordError] = useState<string | null>(null);
    const [contributorsError, setContributorsError] = useState<string | null>(null);

    // Computed overall loading state (exclude contributors for initial load)
    const isLoading = isLoadingMesh || isLoadingCatalyst || isLoadingDRep || isLoadingDiscord;

    // Computed overall error state
    const error = meshError || catalystError || drepError || discordError || contributorsError;

    const getCurrentYear = () => new Date().getFullYear();

    const fetchDRepVotingDataWrapper = async () => {
        setIsLoadingDRep(true);
        setDrepError(null);
        try {
            await fetchDRepVotingDataForContext({
                getCurrentYear,
                safeSetItem,
                setDrepVotingData,
                setError: setDrepError,
                DREP_VOTING_STORAGE_KEY,
            });
        } finally {
            setIsLoadingDRep(false);
        }
    };

    const fetchCatalystDataWrapper = async () => {
        setIsLoadingCatalyst(true);
        setCatalystError(null);
        try {
            await fetchCatalystDataForContext({
                safeSetItem,
                setCatalystData,
                setError: setCatalystError,
                CATALYST_STORAGE_KEY,
            });
        } finally {
            setIsLoadingCatalyst(false);
        }
    };

    const fetchDiscordStatsWrapper = async () => {
        setIsLoadingDiscord(true);
        setDiscordError(null);
        try {
            await fetchDiscordStatsForContext({
                safeSetItem,
                setDiscordStats,
                setError: setDiscordError,
                DISCORD_STATS_STORAGE_KEY,
            });
        } finally {
            setIsLoadingDiscord(false);
        }
    };

    const fetchContributorsAllWrapper = async () => {
        setIsLoadingContributors(true);
        setContributorsError(null);
        try {
            const combined = await fetchContributorsAllForContext({
                safeSetItem,
                setContributorStats,
                setError: setContributorsError,
                CONTRIBUTOR_STATS_STORAGE_KEY,
            });
            return combined;
        } finally {
            setIsLoadingContributors(false);
        }
    };

    const fetchMeshDataWrapper = async () => {
        setIsLoadingMesh(true);
        setMeshError(null);
        try {
            await fetchMeshDataForContext({
                getCurrentYear,
                safeSetItem,
                setMeshData,
                setError: setMeshError,
                MESH_STORAGE_KEY,
            });
        } finally {
            setIsLoadingMesh(false);
        }
    };

    const loadContributorStats = async () => {
        if (!contributorStats) {
            await fetchContributorsAllWrapper();
        }
    };

    useEffect(() => {
        const load = async () => {
            // Load cached data immediately for better UX
            if (isLocalStorageAvailable() && process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE !== 'false') {
                const cachedMeshData = safeGetItem(MESH_STORAGE_KEY);
                const cachedCatalystData = safeGetItem(CATALYST_STORAGE_KEY);
                const cachedDRepVotingData = safeGetItem(DREP_VOTING_STORAGE_KEY);
                const cachedDiscordStats = safeGetItem(DISCORD_STATS_STORAGE_KEY);
                const cachedContributorStats = safeGetItem(CONTRIBUTOR_STATS_STORAGE_KEY);

                // Load cached data immediately if available and fresh
                if (cachedMeshData) {
                    const parsed = JSON.parse(cachedMeshData);
                    const cacheAge = Date.now() - parsed.lastFetched;
                    if (cacheAge < CACHE_DURATION) {
                        setMeshData(parsed);
                        setIsLoadingMesh(false);
                    }
                }

                if (cachedCatalystData) {
                    const parsed = JSON.parse(cachedCatalystData);
                    const cacheAge = Date.now() - parsed.lastFetched;
                    if (cacheAge < CACHE_DURATION) {
                        setCatalystData(parsed);
                        setIsLoadingCatalyst(false);
                    }
                }

                if (cachedDRepVotingData) {
                    const parsed = JSON.parse(cachedDRepVotingData);
                    const cacheAge = Date.now() - parsed.lastFetched;
                    if (cacheAge < CACHE_DURATION) {
                        setDrepVotingData(parsed);
                        setIsLoadingDRep(false);
                    }
                }

                if (cachedDiscordStats) {
                    const parsed = JSON.parse(cachedDiscordStats);
                    const cacheAge = Date.now() - parsed.lastFetched;
                    if (cacheAge < CACHE_DURATION) {
                        setDiscordStats(parsed);
                        setIsLoadingDiscord(false);
                    }
                }

                // Load cached contributor stats
                if (cachedContributorStats) {
                    const parsed = JSON.parse(cachedContributorStats);
                    const cacheAge = Date.now() - parsed.lastFetched;
                    if (cacheAge < CACHE_DURATION) {
                        setContributorStats(parsed);
                        setIsLoadingContributors(false);
                    }
                }
            }

            // Start fetching fresh data in parallel (excluding contributors for lazy loading)
            const fetchPromises = [] as Promise<any>[];

            // Always fetch mesh data first (it's most critical)
            if (isLoadingMesh) {
                fetchPromises.push(fetchMeshDataWrapper());
            }

            // Fetch other data in parallel
            if (isLoadingCatalyst) {
                fetchPromises.push(fetchCatalystDataWrapper());
            }
            if (isLoadingDRep) {
                fetchPromises.push(fetchDRepVotingDataWrapper());
            }
            if (isLoadingDiscord) {
                fetchPromises.push(fetchDiscordStatsWrapper());
            }

            // Wait for all fetches to complete
            await Promise.all(fetchPromises);
        };
        void load();
        // We intentionally run this bootstrap only once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refetchData = async () => {
        // Reset all loading states
        setIsLoadingMesh(true);
        setIsLoadingCatalyst(true);
        setIsLoadingDRep(true);
        setIsLoadingDiscord(true);
        setIsLoadingContributors(true);

        // Clear all errors
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
            fetchContributorsAllWrapper()
        ]);
    };

    return (
        <DataContext.Provider value={{
            meshData,
            catalystData,
            drepVotingData,
            discordStats,
            contributorStats,
            isLoading,
            error,
            // Individual loading states
            isLoadingMesh,
            isLoadingCatalyst,
            isLoadingDRep,
            isLoadingDiscord,
            isLoadingContributors,
            // Individual error states
            meshError,
            catalystError,
            drepError,
            discordError,
            contributorsError,
            refetchData,
            // Lazy loading function
            loadContributorStats
        }}>
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