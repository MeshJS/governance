import MeshStatsView, { FilteredStats } from '../components/MeshStatsView';
import { useData } from '../contexts/DataContext';
import styles from '../styles/MeshStats.module.css';
import SearchFilterBar, { SearchFilterConfig } from '../components/SearchFilterBar';
import { generateMeshStatsFilterConfig } from '../config/filterConfig';
import { useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader';

export default function MeshStatsPage() {
    const { meshData, isLoading, error } = useData();
    const [filteredStats, setFilteredStats] = useState<FilteredStats>({});
    const [isSearching, setIsSearching] = useState<boolean>(false);

    // Create package data array for the filter generator
    const packageData = useMemo(() => {
        if (!meshData?.currentStats?.npm) return [];
        return [
            { name: 'Core', downloads: meshData.currentStats.npm.downloads.last_month },
            { name: 'React', downloads: meshData.currentStats.npm.react_package_downloads },
            { name: 'Transaction', downloads: meshData.currentStats.npm.transaction_package_downloads },
            { name: 'Wallet', downloads: meshData.currentStats.npm.wallet_package_downloads },
            { name: 'Provider', downloads: meshData.currentStats.npm.provider_package_downloads },
            { name: 'Core CSL', downloads: meshData.currentStats.npm.core_csl_package_downloads },
            { name: 'Core CST', downloads: meshData.currentStats.npm.core_cst_package_downloads },
        ];
    }, [meshData]);

    // Generate dynamic filter config
    const dynamicFilterConfig = useMemo(() => {
        return generateMeshStatsFilterConfig(packageData);
    }, [packageData]);

    // Version subtitle for PageHeader
    const versionSubtitle = useMemo(() => {
        return meshData?.currentStats?.npm?.latest_version
            ? `Latest Version: ${meshData.currentStats.npm.latest_version}`
            : undefined;
    }, [meshData]);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.stat}>
                    <p>Loading mesh statistics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.stat}>
                    <p className={styles.error}>{error}</p>
                </div>
            </div>
        );
    }

    if (!meshData?.currentStats || !meshData?.yearlyStats || Object.keys(meshData.yearlyStats).length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.stat}>
                    <p>No mesh statistics available</p>
                </div>
            </div>
        );
    }

    // Handle search and filtering
    const handleSearch = (searchTerm: string, activeFilters: Record<string, string>) => {
        if (!searchTerm && Object.keys(activeFilters).length === 0) {
            setFilteredStats({});
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        // Filter package data based on search term and filter
        const filteredPackages = packageData.filter(pkg => {
            // Search term filter
            const searchMatch = !searchTerm ||
                pkg.name.toLowerCase().includes(searchTerm.toLowerCase());

            // Package filter
            const packageMatch = !activeFilters.package || pkg.name === activeFilters.package;

            return searchMatch && packageMatch;
        });

        // Get the years and monthly data
        const years = Object.keys(meshData.yearlyStats || {}).map(Number).sort((a, b) => b - a);
        const latestYear = years[0];

        // Filter monthly data if trend filter is active
        let filteredMonthly: any[] = [];
        if (latestYear && meshData.yearlyStats?.[latestYear]?.monthlyDownloads) {
            const monthlyData = meshData.yearlyStats[latestYear].monthlyDownloads;

            filteredMonthly = !activeFilters.trend ? monthlyData :
                monthlyData.filter((month: { trend: string }) => month.trend === activeFilters.trend);
        }

        setFilteredStats({
            packageData: filteredPackages,
            monthlyData: filteredMonthly.length > 0 ? filteredMonthly.map((month: { month: string; downloads: number; trend: string }) => ({
                name: month.month,
                downloads: month.downloads,
                trend: month.trend
            })) : undefined,
            currentStats: meshData.currentStats,
            yearlyStats: meshData.yearlyStats
        });
    };

    return (
        <div className={styles.container}>
            <PageHeader
                title={<>Mesh SDK <span>Statistics</span></>}
                subtitle={versionSubtitle}
            />

            <SearchFilterBar
                config={dynamicFilterConfig}
                onSearch={handleSearch}
            />

            {isSearching ? (
                <MeshStatsView
                    currentStats={meshData.currentStats}
                    yearlyStats={meshData.yearlyStats}
                    filteredStats={filteredStats}
                />
            ) : (
                <MeshStatsView
                    currentStats={meshData.currentStats}
                    yearlyStats={meshData.yearlyStats}
                />
            )}
        </div>
    );
} 