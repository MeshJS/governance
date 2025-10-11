import MeshStatsView from '../components/MeshStatsView';
import { useData } from '../contexts/DataContext';
import styles from '../styles/MeshStats.module.css';
import { useMemo, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';

export default function MeshStatsPage() {
  const { meshData, discordStats, contributorStats, isLoading, error, loadContributorStats } =
    useData();
  const [packageLegendData, setPackageLegendData] = useState<Array<{ name: string; color: string; packageName: string; downloads: number }>>([]);
  const [isChartHovered, setIsChartHovered] = useState(false);

  // Load contributor stats when component mounts
  useEffect(() => {
    loadContributorStats();
  }, [loadContributorStats]);

  // Version subtitle for PageHeader
  const versionSubtitle = useMemo(() => {
    if (
      !meshData ||
      !meshData.meshPackagesData ||
      !Array.isArray(meshData.meshPackagesData.packages)
    ) {
      return undefined;
    }
    const corePackage = meshData.meshPackagesData.packages.find(
      pkg => pkg.name === '@meshsdk/core'
    );
    return corePackage?.latest_version
      ? `@meshsdk/core Version: ${corePackage.latest_version}`
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

  if (
    !meshData ||
    !meshData.meshPackagesData ||
    !Array.isArray(meshData.meshPackagesData.packages) ||
    meshData.meshPackagesData.packages.length === 0
  ) {
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
        title={
          <>
            Mesh Usage <span>Statistics</span>
          </>
        }
        subtitle="Tracking downloads of Mesh npm packages via npmjs.com"
      />

      <MeshStatsView
        discordStats={discordStats || undefined}
        contributorStats={
          contributorStats?.unique_count || contributorStats?.total_contributions
            ? contributorStats
            : undefined
        }
        meshPackagesData={meshData.meshPackagesData}
        onPackageLegendUpdate={setPackageLegendData}
        onChartHover={setIsChartHovered}
      />

      {/* Pass legend data and hover state to layout */}
      {packageLegendData.length > 0 && (
        <div 
          style={{ display: 'none' }} 
          data-package-legend={JSON.stringify(packageLegendData)}
          data-chart-hovered={isChartHovered}
        />
      )}
    </div>
  );
}
