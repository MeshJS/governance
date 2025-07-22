// ../contexts/DataContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MeshData, CatalystContextData, DRepVotingData, YearlyStats, DiscordStats, ContributorStats, DataContextType, ContributorsData, GovernanceVote, MeshPackagesApiResponse } from '../types';
import { fetchMeshDataForContext } from '../lib/dataContext/fetchMeshData';
import { fetchDRepVotingDataForContext } from '../lib/dataContext/fetchDRepVotingData';
import { fetchCatalystDataForContext } from '../lib/dataContext/fetchCatalystData';
import { fetchDiscordStatsForContext } from '../lib/dataContext/fetchDiscordStats';
import { fetchContributorStatsForContext } from '../lib/dataContext/fetchContributorStats';

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache is enabled by default unless explicitly disabled via NEXT_PUBLIC_ENABLE_DEV_CACHE=false
const CACHE_DURATION = process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE === 'false'
    ? 0
    : 5 * 60 * 1000;
const MESH_STORAGE_KEY = 'meshGovData';
const CATALYST_STORAGE_KEY = 'catalystData';
const DREP_VOTING_STORAGE_KEY = 'drepVotingData';
const DISCORD_STATS_STORAGE_KEY = 'discordStats';
const CONTRIBUTOR_STATS_STORAGE_KEY = 'contributorStats';
const CONTRIBUTORS_DATA_STORAGE_KEY = 'contributorsData';

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
    if (!isLocalStorageAvailable()) return;
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error(`Error writing ${key} to localStorage:`, e);
    }
};

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [meshData, setMeshData] = useState<MeshData | null>(null);
    const [catalystData, setCatalystData] = useState<CatalystContextData | null>(null);
    const [drepVotingData, setDrepVotingData] = useState<DRepVotingData | null>(null);
    const [discordStats, setDiscordStats] = useState<DiscordStats | null>(null);
    const [contributorStats, setContributorStats] = useState<Record<number, ContributorStats> | null>(null);
    const [contributorsData, setContributorsData] = useState<ContributorsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getCurrentYear = () => new Date().getFullYear();

    const fetchDRepVotingDataWrapper = async () => {
        await fetchDRepVotingDataForContext({
            getCurrentYear,
            safeSetItem,
            setDrepVotingData,
            setError,
            DREP_VOTING_STORAGE_KEY,
        });
    };
    const fetchCatalystDataWrapper = async () => {
        await fetchCatalystDataForContext({
            safeSetItem,
            setCatalystData,
            setError,
            CATALYST_STORAGE_KEY,
        });
    };
    const fetchDiscordStatsWrapper = async () => {
        await fetchDiscordStatsForContext({
            safeSetItem,
            setDiscordStats,
            setError,
            DISCORD_STATS_STORAGE_KEY,
        });
    };
    const fetchContributorStatsWrapper = async () => {
        await fetchContributorStatsForContext({
            getCurrentYear,
            safeSetItem,
            setContributorStats,
            setContributorsData,
            setError,
            CONTRIBUTOR_STATS_STORAGE_KEY,
            CONTRIBUTORS_DATA_STORAGE_KEY,
        });
    };

    const fetchMeshDataWrapper = async () => {
        await fetchMeshDataForContext({
            getCurrentYear,
            safeSetItem,
            setMeshData,
            setError,
            MESH_STORAGE_KEY,
        });
    };

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE === 'false' || !isLocalStorageAvailable()) {
                // First fetch mesh data
                await fetchMeshDataWrapper();
                // Then fetch other data
                await Promise.all([
                    fetchCatalystDataWrapper(),
                    fetchDRepVotingDataWrapper(),
                    fetchDiscordStatsWrapper(),
                    fetchContributorStatsWrapper()
                ]);
                setIsLoading(false);
                return;
            }

            const cachedMeshData = safeGetItem(MESH_STORAGE_KEY);
            const cachedCatalystData = safeGetItem(CATALYST_STORAGE_KEY);
            const cachedDRepVotingData = safeGetItem(DREP_VOTING_STORAGE_KEY);
            const cachedDiscordStats = safeGetItem(DISCORD_STATS_STORAGE_KEY);
            const cachedContributorStats = safeGetItem(CONTRIBUTOR_STATS_STORAGE_KEY);
            const cachedContributorsData = safeGetItem(CONTRIBUTORS_DATA_STORAGE_KEY);

            // First handle mesh data
            if (cachedMeshData) {
                const parsed = JSON.parse(cachedMeshData);
                const cacheAge = Date.now() - parsed.lastFetched;
                if (cacheAge < CACHE_DURATION) {
                    setMeshData(parsed);
                }
            }

            // Then handle other cached data
            if (cachedCatalystData) {
                const parsed = JSON.parse(cachedCatalystData);
                const cacheAge = Date.now() - parsed.lastFetched;
                if (cacheAge < CACHE_DURATION) {
                    setCatalystData(parsed);
                }
            }

            if (cachedDRepVotingData) {
                const parsed = JSON.parse(cachedDRepVotingData);
                const cacheAge = Date.now() - parsed.lastFetched;
                if (cacheAge < CACHE_DURATION) {
                    setDrepVotingData(parsed);
                }
            }

            if (cachedDiscordStats) {
                const parsed = JSON.parse(cachedDiscordStats);
                const cacheAge = Date.now() - parsed.lastFetched;
                if (cacheAge < CACHE_DURATION) {
                    setDiscordStats(parsed);
                }
            }

            if (cachedContributorStats) {
                const parsed = JSON.parse(cachedContributorStats);
                const cacheAge = Date.now() - parsed.lastFetched;
                if (cacheAge < CACHE_DURATION) {
                    setContributorStats(parsed.stats);
                }
            }

            if (cachedContributorsData) {
                const parsed = JSON.parse(cachedContributorsData);
                const cacheAge = Date.now() - parsed.lastFetched;
                if (cacheAge < CACHE_DURATION) {
                    setContributorsData(parsed);
                }
            }

            // Fetch fresh data if cache is expired or missing
            const fetchPromises = [];

            // Always fetch mesh data first
            if (!cachedMeshData || Date.now() - JSON.parse(cachedMeshData).lastFetched >= CACHE_DURATION) {
                await fetchMeshDataWrapper();
            }

            // Then fetch other data
            if (!cachedCatalystData || Date.now() - JSON.parse(cachedCatalystData).lastFetched >= CACHE_DURATION) {
                fetchPromises.push(fetchCatalystDataWrapper());
            }
            if (!cachedDRepVotingData || Date.now() - JSON.parse(cachedDRepVotingData).lastFetched >= CACHE_DURATION) {
                fetchPromises.push(fetchDRepVotingDataWrapper());
            }
            if (!cachedDiscordStats || Date.now() - JSON.parse(cachedDiscordStats).lastFetched >= CACHE_DURATION) {
                fetchPromises.push(fetchDiscordStatsWrapper());
            }
            if (!cachedContributorStats || Date.now() - JSON.parse(cachedContributorStats).lastFetched >= CACHE_DURATION) {
                fetchPromises.push(fetchContributorStatsWrapper());
            }

            await Promise.all(fetchPromises);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const refetchData = async () => {
        setIsLoading(true);
        await Promise.all([
            fetchMeshDataWrapper(),
            fetchCatalystDataWrapper(),
            fetchDRepVotingDataWrapper(),
            fetchDiscordStatsWrapper(),
            fetchContributorStatsWrapper()
        ]);
        setIsLoading(false);
    };

    return (
        <DataContext.Provider value={{ meshData, catalystData, drepVotingData, discordStats, contributorStats, contributorsData, isLoading, error, refetchData }}>
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