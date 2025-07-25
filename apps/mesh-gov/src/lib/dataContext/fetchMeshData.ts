/**
 * Fetches mesh data for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import fetchData from '../fetchData';
import { MeshData, YearlyStats, MeshPackagesApiResponse } from '../../types';
import config from '../../../config';

const npmPackages = config.npmPackages;

export async function fetchMeshDataForContext({
    getCurrentYear,
    safeSetItem,
    setMeshData,
    setError,
    MESH_STORAGE_KEY,
}: {
    getCurrentYear: () => number;
    safeSetItem: (key: string, value: string) => void;
    setMeshData: (data: MeshData | null) => void;
    setError: (err: string | null) => void;
    MESH_STORAGE_KEY: string;
}) {
    try {
        const currentYear = getCurrentYear();
        const startYear = 2024;
        const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);

        let currentStats;
        try {
            currentStats = await fetchData('https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/mesh-stats/mesh_stats.json');
        } catch (error) {
            console.error('Error fetching current stats:', error);
            currentStats = null;
        }

        const yearlyStatsPromises = years.map(year => fetchData(`https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/mesh-stats/mesh-yearly-stats-${year}.json`).catch(error => {
            console.warn(`Failed to fetch stats for year ${year}:`, error);
            return null;
        }));
        const yearlyStatsResults = await Promise.all(yearlyStatsPromises);

        const yearlyStats = years.reduce((acc, year, index) => {
            if (yearlyStatsResults[index] !== null) {
                acc[year] = yearlyStatsResults[index];
            }
            return acc;
        }, {} as Record<number, YearlyStats>);

        // Fetch from new /api/packages endpoint
        let meshPackagesData: MeshPackagesApiResponse | null = null;
        try {
            const packageNames = npmPackages.map(pkg => pkg.name).join(',');
            const res = await fetch(`/api/packages?names=${encodeURIComponent(packageNames)}`);
            if (res.ok) {
                meshPackagesData = await res.json();
            } else {
                console.error('Failed to fetch meshPackagesData:', res.statusText);
            }
        } catch (error) {
            console.error('Error fetching meshPackagesData:', error);
        }

        if (!currentStats && Object.keys(yearlyStats).length === 0 && !meshPackagesData) {
            throw new Error('No mesh data available');
        }

        const newData: MeshData = {
            lastFetched: Date.now(),
            meshPackagesData,
        };

        safeSetItem(MESH_STORAGE_KEY, JSON.stringify(newData));
        setMeshData(newData);
        setError(null);
    } catch (err) {
        console.error('Error fetching mesh data:', err);
        setError('Failed to fetch mesh data');
        setMeshData(null);
    }
} 