import { useData } from '../contexts/DataContext';
import styles from '../styles/Contributors.module.css';
import Card from '../components/ContributorCard';
import Image from 'next/image';

export default function Contributors() {
    const { meshData, isLoading, error } = useData();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!meshData) return <div>No data available</div>;

    const { contributors } = meshData.currentStats;
    const totalContributions = contributors.contributors.reduce(
        (sum, contributor) => sum + contributor.contributions,
        0
    );

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Contributors</h1>

            <div className={styles.summaryContainer}>
                <Card className={styles.summaryCard}>
                    <h2>Total Contributors</h2>
                    <p className={styles.summaryNumber}>{contributors.unique_count}</p>
                </Card>

                <Card className={styles.summaryCard}>
                    <h2>Total Contributions</h2>
                    <p className={styles.summaryNumber}>{totalContributions}</p>
                </Card>
            </div>

            <div className={styles.contributorsGrid}>
                {contributors.contributors.map((contributor) => (
                    <Card key={contributor.login} className={styles.contributorCard}>
                        <div className={styles.contributorHeader}>
                            <Image
                                src={contributor.avatar_url}
                                alt={contributor.login}
                                width={48}
                                height={48}
                                className={styles.avatar}
                            />
                            <h3>{contributor.login}</h3>
                        </div>
                        <div className={styles.contributorStats}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Contributions</span>
                                <span className={styles.statValue}>{contributor.contributions}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Repositories</span>
                                <span className={styles.statValue}>{contributor.repositories.length}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
} 