import React, { createContext, useContext, useEffect, useState } from 'react';
import fetchData from '../lib/fetchData';
import { MeshData, CatalystContextData, DRepVotingData, YearlyStats, DiscordStats, ContributorStats, DataContextType, ContributorsData } from '../types';
import { aggregateContributorStats } from '../utils/contributorStats';
import { fetchCatalystProposalsViaAPI } from '../utils/catalystDataTransform';
import config from '../../config';

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
            // console.log('Fetching delegation data...');
            const delegationData = await fetchData('https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/drep-voting/drep-delegation-info.json');
            // console.log('Received delegation data:', delegationData);

            const newData: DRepVotingData = {
                votes: allVotes,
                delegationData: delegationData || null,
                lastFetched: Date.now()
            };

            // console.log('Setting DRep voting data:', newData);
            safeSetItem(DREP_VOTING_STORAGE_KEY, JSON.stringify(newData));
            setDrepVotingData(newData);
        } catch (err) {
            console.error('Error fetching DRep voting data:', err);
            setDrepVotingData(null);
        }
    };

    const fetchCatalystData = async () => {
        try {
            // First try to fetch from the new API route
            const meshProjectIds = config.catalystProjectIds.split(',').map(id => id.trim());

            try {
                //console.log('Attempting to fetch Catalyst proposals via API route...');
                //console.log('Using project IDs from config:', meshProjectIds);
                const apiData = await fetchCatalystProposalsViaAPI(meshProjectIds);

                if (apiData && apiData.projects && apiData.projects.length > 0) {
                    //console.log(`API route returned ${apiData.projects.length} proposals`);
                    const newData: CatalystContextData = {
                        catalystData: apiData,
                        lastFetched: Date.now()
                    };
                    safeSetItem(CATALYST_STORAGE_KEY, JSON.stringify(newData));
                    setCatalystData(newData);
                    console.log('Catalyst proposals fetched successfully via API route');
                    return;
                } else {
                    console.warn('API route returned no proposals, falling back to JSON file');
                }
            } catch (apiError) {
                console.warn('Failed to fetch Catalyst proposals via API route, falling back to JSON file:', apiError);
            }

            // Fallback to the old JSON file method
            console.log('Fetching Catalyst proposals via JSON file fallback...');
            const data = await fetchData('https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/catalyst-proposals/catalyst-data.json');
            const newData: CatalystContextData = {
                catalystData: data,
                lastFetched: Date.now()
            };
            safeSetItem(CATALYST_STORAGE_KEY, JSON.stringify(newData));
            setCatalystData(newData);
            console.log('Catalyst proposals fetched successfully via JSON file fallback');
        } catch (err) {
            console.error('Error fetching catalyst data:', err);
            setCatalystData(null);
        }
    };

    const fetchDiscordStats = async () => {
        try {
            // First try to fetch from the new API route
            const guildId = config.discordGuildId;
            if (guildId) {
                try {
                    //console.log('Attempting to fetch Discord stats via API route...');
                    const apiData = await fetchData(`/api/discord/stats/${guildId}`);

                    if (apiData && apiData.stats) {
                        const newData = {
                            stats: apiData.stats,
                            lastFetched: Date.now()
                        };
                        safeSetItem(DISCORD_STATS_STORAGE_KEY, JSON.stringify(newData));
                        setDiscordStats(newData);
                        console.log('Discord stats fetched successfully via API route');
                        return;
                    }
                } catch (apiError) {
                    console.warn('Failed to fetch Discord stats via API route, falling back to JSON file:', apiError);
                }
            }

            // Fallback to the old JSON file method
            console.log('Fetching Discord stats via JSON file fallback...');
            const data = await fetchData('https://raw.githubusercontent.com/Signius/mesh-automations/refs/heads/main/mesh-gov-updates/discord-stats/stats.json');
            const newData = {
                stats: data,
                lastFetched: Date.now()
            };
            safeSetItem(DISCORD_STATS_STORAGE_KEY, JSON.stringify(newData));
            setDiscordStats(newData);
            console.log('Discord stats fetched successfully via JSON file fallback');
        } catch (err) {
            console.error('Error fetching Discord stats:', err);
            setDiscordStats(null);
        }
    };

    const fetchContributorStats = async () => {
        try {
            const currentYear = getCurrentYear();
            const startYear = 2022;
            const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);

            // Fetch yearly contributor stats
            const yearlyStatsPromises = years.map(year =>
                fetchData(`https://raw.githubusercontent.com/Signius/mesh-automations/refs/heads/main/mesh-gov-updates/mesh-stats/contributions/contributors-${year}.json`)
                    .catch(error => {
                        console.warn(`Failed to fetch contributor stats for year ${year}:`, error);
                        return null;
                    })
            );

            const yearlyStatsResults = await Promise.all(yearlyStatsPromises);

            // Create yearlyStats object, filtering out null results
            const yearlyStats = years.reduce((acc, year, index) => {
                if (yearlyStatsResults[index] !== null) {
                    acc[year] = yearlyStatsResults[index];
                }
                return acc;
            }, {} as Record<number, ContributorStats>);

            // Aggregate contributor stats
            const aggregatedContributors = aggregateContributorStats(yearlyStats);

            // Calculate totals
            const totals = aggregatedContributors.reduce((acc, contributor) => ({
                total_commits: acc.total_commits + contributor.commits,
                total_pull_requests: acc.total_pull_requests + contributor.pull_requests,
                total_contributions: acc.total_contributions + contributor.contributions
            }), {
                total_commits: 0,
                total_pull_requests: 0,
                total_contributions: 0
            });

            const newData = {
                stats: yearlyStats,
                lastFetched: Date.now()
            };

            safeSetItem(CONTRIBUTOR_STATS_STORAGE_KEY, JSON.stringify(newData));
            setContributorStats(yearlyStats);

            // Create and store contributors data separately
            const newContributorsData: ContributorsData = {
                unique_count: aggregatedContributors.length,
                contributors: aggregatedContributors,
                ...totals,
                lastFetched: Date.now()
            };

            safeSetItem(CONTRIBUTORS_DATA_STORAGE_KEY, JSON.stringify(newContributorsData));
            setContributorsData(newContributorsData);
        } catch (err) {
            console.error('Error fetching contributor stats:', err);
            setContributorStats(null);
            setContributorsData(null);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (process.env.NEXT_PUBLIC_ENABLE_DEV_CACHE === 'false' || !isLocalStorageAvailable()) {
                // First fetch mesh data
                await fetchMeshData();
                // Then fetch other data
                await Promise.all([
                    fetchCatalystData(),
                    fetchDRepVotingData(),
                    fetchDiscordStats(),
                    fetchContributorStats()
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
                await fetchMeshData();
            }

            // Then fetch other data
            if (!cachedCatalystData || Date.now() - JSON.parse(cachedCatalystData).lastFetched >= CACHE_DURATION) {
                fetchPromises.push(fetchCatalystData());
            }
            if (!cachedDRepVotingData || Date.now() - JSON.parse(cachedDRepVotingData).lastFetched >= CACHE_DURATION) {
                fetchPromises.push(fetchDRepVotingData());
            }
            if (!cachedDiscordStats || Date.now() - JSON.parse(cachedDiscordStats).lastFetched >= CACHE_DURATION) {
                fetchPromises.push(fetchDiscordStats());
            }
            if (!cachedContributorStats || Date.now() - JSON.parse(cachedContributorStats).lastFetched >= CACHE_DURATION) {
                fetchPromises.push(fetchContributorStats());
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
            fetchMeshData(),
            fetchCatalystData(),
            fetchDRepVotingData(),
            fetchDiscordStats(),
            fetchContributorStats()
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