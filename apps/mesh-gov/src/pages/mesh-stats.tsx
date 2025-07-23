import MeshStatsView from '../components/MeshStatsView';
import { useData } from '../contexts/DataContext';
import styles from '../styles/MeshStats.module.css';
import { useMemo } from 'react';
import PageHeader from '../components/PageHeader';

export default function MeshStatsPage() {
    const { meshData, discordStats, contributorsData, contributorStats, isLoading, error, contributorsApiData, commitsApiData, pullRequestsApiData, issuesApiData, contributorOrgStats } = useData();
    //console.log('meshData', contributorsApiData, commitsApiData, pullRequestsApiData, issuesApiData, 'contributorOrgStats', contributorOrgStats)

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
                contributorStats={contributorStats || undefined}
                meshPackagesData={meshData.meshPackagesData}
            />
        </div>
    );
} 