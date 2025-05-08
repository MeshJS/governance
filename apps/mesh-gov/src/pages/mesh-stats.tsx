import MeshStatsView from '../components/MeshStatsView';
import { useData } from '../contexts/DataContext';
import styles from '../styles/MeshStats.module.css';
import { useMemo } from 'react';
import PageHeader from '../components/PageHeader';

export default function MeshStatsPage() {
    const { meshData, discordStats, contributorsData, isLoading, error } = useData();

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

    return (
        <div className={styles.container}>
            <PageHeader
                title={<>Mesh SDK <span>Statistics</span></>}
                subtitle={versionSubtitle}
            />

            <MeshStatsView
                currentStats={meshData.currentStats}
                yearlyStats={meshData.yearlyStats}
                discordStats={discordStats || undefined}
                contributorsData={contributorsData?.unique_count ? contributorsData : undefined}
            />
        </div>
    );
} 