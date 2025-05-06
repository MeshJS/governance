import { useData } from '../contexts/DataContext';
import styles from '../styles/Contributors.module.css';
import BaseCard from '../components/ContributorCard';
import Image from 'next/image';
import PageHeader from '../components/PageHeader';
import ContributorModal from '../components/ContributorModal';
import { useState } from 'react';
import { Contributor } from '../types';
import Link from 'next/link';
import { FaUsers } from 'react-icons/fa';
import { VscGitCommit, VscGitPullRequest } from 'react-icons/vsc';

// Generate a consistent color for a repository
const getRepoColor = (repoName: string) => {
    return 'rgba(255, 255, 255, 0.3)';
};

export default function Contributors() {
    const { meshData, isLoading, error } = useData();
    const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!meshData) return <div>No data available</div>;

    const { contributors } = meshData.currentStats;
    const totalContributions = contributors.contributors.reduce(
        (sum, contributor) => sum + contributor.contributions,
        0
    );

    const handleCardClick = (contributor: Contributor) => {
        setSelectedContributor(contributor);
    };

    return (
        <div className={styles.container}>
            <PageHeader
                title={<>Mesh <span>Contributors</span></>}
                subtitle="Mesh is build by many minds and hands, here our Contributors"
            />

            <div className={styles.summaryContainer}>
                <div className={styles.summaryCards}>
                    <BaseCard className={styles.summaryCard}>
                        <h2>Contributors & Contributions</h2>
                        <div className={styles.summaryContent}>
                            <div className={styles.statColumn}>
                                <FaUsers className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Contributors</p>
                                <p className={styles.summaryNumber}>{contributors.unique_count}</p>
                            </div>
                            <div className={styles.statColumn}>
                                <VscGitCommit className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Contributions</p>
                                <p className={styles.summaryNumber}>{contributors.total_contributions}</p>
                            </div>
                        </div>
                    </BaseCard>

                    <BaseCard className={styles.summaryCard}>
                        <h2>Activity</h2>
                        <div className={styles.summaryContent}>
                            <div className={styles.statColumn}>
                                <VscGitCommit className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Commits</p>
                                <p className={styles.summaryNumber}>{meshData.currentStats.contributors.total_commits || 0}</p>
                            </div>
                            <div className={styles.statColumn}>
                                <VscGitPullRequest className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Pull Requests</p>
                                <p className={styles.summaryNumber}>{contributors.total_pull_requests}</p>
                            </div>
                        </div>
                    </BaseCard>
                </div>
            </div>

            <div className={styles.contributorsGrid}>
                {contributors.contributors.map((contributor) => (
                    <div
                        key={contributor.login}
                        className={styles.contributorCard}
                        onClick={() => handleCardClick(contributor)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                handleCardClick(contributor);
                            }
                        }}
                    >
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
                                <span className={styles.statLabel}>Pull Requests</span>
                                <span className={styles.statValue}>{contributor.pull_requests}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Repositories</span>
                                <span className={styles.statValue}>{contributor.repositories.length}</span>
                            </div>
                        </div>

                        <div className={styles.topRepos}>
                            {contributor.repositories
                                .sort((a, b) => b.contributions - a.contributions)
                                .slice(0, 3)
                                .map((repo) => (
                                    <div key={repo.name} className={styles.repoBreakdown}>
                                        <div
                                            className={styles.repoColor}
                                            style={{ backgroundColor: getRepoColor(repo.name) }}
                                        />
                                        <div className={styles.repoInfo}>
                                            <span className={styles.repoName}>{repo.name}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            {selectedContributor && (
                <ContributorModal
                    username={selectedContributor.login}
                    avatar={selectedContributor.avatar_url}
                    totalContributions={selectedContributor.contributions}
                    totalCommits={selectedContributor.commits}
                    totalPullRequests={selectedContributor.pull_requests}
                    repositories={selectedContributor.repositories}
                    onClose={() => setSelectedContributor(null)}
                />
            )}
        </div>
    );
} 