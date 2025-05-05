import React, { createContext, useContext, useEffect, useState } from 'react';
import fetchData from '../lib/fetchData';
import { MeshData, CatalystContextData, DRepVotingData, YearlyStats, DiscordStats } from '../types';

interface DataContextType {
    meshData: MeshData | null;
    catalystData: CatalystContextData | null;
    drepVotingData: DRepVotingData | null;
    discordStats: DiscordStats | null;
    isLoading: boolean;
    error: string | null;
    refetchData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache is enabled by default unless explicitly disabled via NEXT_PUBLIC_ENABLE_DEV_CACHE=false
const CACHE_DURATION = process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE === 'false'
    ? 0
    : 30 * 60 * 1000;
const MESH_STORAGE_KEY = 'meshGovData';
const CATALYST_STORAGE_KEY = 'catalystData';
const DREP_VOTING_STORAGE_KEY = 'drepVotingData';
const DISCORD_STATS_STORAGE_KEY = 'discordStats';

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getCurrentYear = () => new Date().getFullYear();

    const fetchYearlyStats = async (year: number) => {
        try {
            return await fetchData(`https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/mesh-stats/mesh-yearly-stats-${year}.json`);
        } catch (error) {
            console.warn(`Failed to fetch stats for year ${year}:`, error);
            return null;
        }
    };

    const fetchYearlyVotes = async (year: number) => {
        try {
            return await fetchData(`https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/drep-voting/${year}_voting.json`);
        } catch (error) {
            console.warn(`Failed to fetch votes for year ${year}:`, error);
            return null;
        }
    };

    const fetchMeshData = async () => {
        try {
            // console.log('Fetching mesh data...');
            const currentYear = getCurrentYear();
            const startYear = 2024;
            const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);

            // Fetch current stats
            let currentStats;
            try {
                // console.log('Fetching current stats...');
                currentStats = await fetchData('https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/mesh-stats/mesh_stats.json');
                // console.log('Current stats fetched:', currentStats);
            } catch (error) {
                console.error('Error fetching current stats:', error);
                currentStats = null;
            }

            // Fetch yearly stats
            // console.log('Fetching yearly stats for years:', years);
            const yearlyStatsPromises = years.map(year => fetchYearlyStats(year));
            const yearlyStatsResults = await Promise.all(yearlyStatsPromises);

            // console.log('Yearly stats results:', yearlyStatsResults);

            // Create yearlyStats object, filtering out null results
            const yearlyStats = years.reduce((acc, year, index) => {
                if (yearlyStatsResults[index] !== null) {
                    acc[year] = yearlyStatsResults[index];
                }
                return acc;
            }, {} as Record<number, YearlyStats>);

            // console.log('Processed yearly stats:', yearlyStats);

            // Only save data if we have at least current stats or some yearly stats
            if (!currentStats && Object.keys(yearlyStats).length === 0) {
                throw new Error('No mesh data available');
            }

            const newData: MeshData = {
                currentStats,
                yearlyStats,
                lastFetched: Date.now()
            };

            // console.log('Setting new mesh data:', newData);
            safeSetItem(MESH_STORAGE_KEY, JSON.stringify(newData));
            setMeshData(newData);
            setError(null);
        } catch (err) {
            console.error('Error fetching mesh data:', err);
            setError('Failed to fetch mesh data');
            setMeshData(null);
        }
    };

    const fetchDRepVotingData = async () => {
        try {
            // console.log('Fetching DRep voting data...');
            const currentYear = getCurrentYear();
            const startYear = 2024;
            const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);

            // Fetch yearly votes
            const yearlyVotesResults = await Promise.all(years.map(year => fetchYearlyVotes(year)));

            // Combine all votes and sort by blockTime, filtering out null results
            const allVotes = yearlyVotesResults
                .filter(votes => votes !== null)
                .flat()
                .sort((a, b) => new Date(b.blockTime).getTime() - new Date(a.blockTime).getTime());

            // Fetch delegation data
            console.log('Fetching delegation data...');
            const delegationData = await fetchData('https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/drep-voting/drep-delegation-info.json');
            console.log('Received delegation data:', delegationData);

            const newData: DRepVotingData = {
                votes: allVotes,
                delegationData: delegationData || null,
                lastFetched: Date.now()
            };

            console.log('Setting DRep voting data:', newData);
            safeSetItem(DREP_VOTING_STORAGE_KEY, JSON.stringify(newData));
            setDrepVotingData(newData);
        } catch (err) {
            console.error('Error fetching DRep voting data:', err);
            setDrepVotingData(null);
        }
    };

    const fetchCatalystData = async () => {
        try {
            const data = await fetchData('https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/catalyst-proposals/catalyst-data.json');
            const newData: CatalystContextData = {
                catalystData: data,
                lastFetched: Date.now()
            };
            safeSetItem(CATALYST_STORAGE_KEY, JSON.stringify(newData));
            setCatalystData(newData);
        } catch (err) {
            console.error('Error fetching catalyst data:', err);
            setCatalystData(null);
        }
    };

    const fetchDiscordStats = async () => {
        try {
            const data = await fetchData('https://raw.githubusercontent.com/Signius/mesh-automations/refs/heads/main/mesh-gov-updates/discord-stats/stats.json');
            const newData = {
                stats: data,
                lastFetched: Date.now()
            };
            safeSetItem(DISCORD_STATS_STORAGE_KEY, JSON.stringify(newData));
            setDiscordStats(newData);
        } catch (err) {
            console.error('Error fetching Discord stats:', err);
            setDiscordStats(null);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE === 'false' || !isLocalStorageAvailable()) {
                // console.log(isLocalStorageAvailable()
                //     ? 'Cache disabled: Fetching fresh data'
                //     : 'localStorage not available: Fetching fresh data');
                await Promise.all([fetchMeshData(), fetchCatalystData(), fetchDRepVotingData(), fetchDiscordStats()]);
                setIsLoading(false);
                return;
            }

            // console.log('Cache enabled: Checking cache status...');
            const cachedMeshData = safeGetItem(MESH_STORAGE_KEY);
            const cachedCatalystData = safeGetItem(CATALYST_STORAGE_KEY);
            const cachedDRepVotingData = safeGetItem(DREP_VOTING_STORAGE_KEY);
            const cachedDiscordStats = safeGetItem(DISCORD_STATS_STORAGE_KEY);

            if (cachedMeshData) {
                const parsed = JSON.parse(cachedMeshData);
                const cacheAge = Date.now() - parsed.lastFetched;
                if (cacheAge < CACHE_DURATION) {
                    // console.log(`Using cached mesh data (cache age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
                    setMeshData(parsed);
                } else {
                    // console.log(`Mesh data cache expired (age: ${Math.round(cacheAge / 1000 / 60)} minutes), fetching fresh data`);
                }
            }

            if (cachedCatalystData) {
                const parsed = JSON.parse(cachedCatalystData);
                const cacheAge = Date.now() - parsed.lastFetched;
                if (cacheAge < CACHE_DURATION) {
                    // console.log(`Using cached catalyst data (cache age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
                    setCatalystData(parsed);
                } else {
                    // console.log(`Catalyst data cache expired (age: ${Math.round(cacheAge / 1000 / 60)} minutes), fetching fresh data`);
                }
            }

            if (cachedDRepVotingData) {
                const parsed = JSON.parse(cachedDRepVotingData);
                const cacheAge = Date.now() - parsed.lastFetched;
                if (cacheAge < CACHE_DURATION) {
                    // console.log(`Using cached DRep voting data (cache age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
                    setDrepVotingData(parsed);
                } else {
                    // console.log(`DRep voting data cache expired (age: ${Math.round(cacheAge / 1000 / 60)} minutes), fetching fresh data`);
                }
            }

            if (cachedDiscordStats) {
                const parsed = JSON.parse(cachedDiscordStats);
                const cacheAge = Date.now() - parsed.lastFetched;
                if (cacheAge < CACHE_DURATION) {
                    // console.log(`Using cached Discord stats (cache age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
                    setDiscordStats(parsed);
                } else {
                    // console.log(`Discord stats cache expired (age: ${Math.round(cacheAge / 1000 / 60)} minutes), fetching fresh data`);
                }
            }

            // Fetch fresh data if cache is expired or missing
            await Promise.all([
                (!cachedMeshData || Date.now() - JSON.parse(cachedMeshData).lastFetched >= CACHE_DURATION) && fetchMeshData(),
                (!cachedCatalystData || Date.now() - JSON.parse(cachedCatalystData).lastFetched >= CACHE_DURATION) && fetchCatalystData(),
                (!cachedDRepVotingData || Date.now() - JSON.parse(cachedDRepVotingData).lastFetched >= CACHE_DURATION) && fetchDRepVotingData(),
                (!cachedDiscordStats || Date.now() - JSON.parse(cachedDiscordStats).lastFetched >= CACHE_DURATION) && fetchDiscordStats()
            ]);
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
        await Promise.all([fetchMeshData(), fetchCatalystData(), fetchDRepVotingData(), fetchDiscordStats()]);
        setIsLoading(false);
    };

    return (
        <DataContext.Provider value={{ meshData, catalystData, drepVotingData, discordStats, isLoading, error, refetchData }}>
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