import { useData } from '../contexts/DataContext';
import styles from '../styles/Dashboard.module.css';
import Image from 'next/image';
import { CountUpTimer } from '../components/CountUpTimer';

export default function Dashboard() {
  const {
    meshData,
    catalystData,
    drepVotingData,
    contributorStats,
    discordStats,
    isLoading,
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
    error,
  } = useData();

  // Show skeleton loading only if we have no data at all and everything is still loading
  const showGlobalLoading =
    isLoading &&
    !meshData &&
    !catalystData &&
    !drepVotingData &&
    !discordStats &&
    !contributorStats;

  // Show error only if we have no data at all and there's a global error
  const showGlobalError =
    error && !meshData && !catalystData && !drepVotingData && !discordStats && !contributorStats;

  if (showGlobalLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (showGlobalError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <header className={styles.mainHeader}>
        <div className={styles.headerContent}>
          <div className={styles.logoBox}>
            <Image
              src="/mesh-white-txt.png"
              alt="Mesh Logo"
              width={300}
              height={100}
              className={styles.meshLogo}
              priority
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <div className={styles.timerBox}>
            <CountUpTimer startDate={new Date('2021-01-01')} title="Building on Cardano Since" />
          </div>
        </div>
      </header>
    </>
  );
}
