import { useData } from '../contexts/DataContext';
import styles from '../styles/Contributors.module.css';
import Image from 'next/image';
import PageHeader from '../components/PageHeader';
import ContributorModal from '../components/ContributorModal';
import { useState } from 'react';
import { Contributor } from '../types';
import Link from 'next/link';
import { FaUsers } from 'react-icons/fa';
import { VscGitCommit, VscGitPullRequest, VscRepo } from 'react-icons/vsc';
import ContributionTimeline from '../components/ContributionTimeline';

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

    const { contributorsData } = meshData.currentStats;

    // Calculate total unique repositories
    const uniqueRepos = new Set();
    contributorsData.contributors.forEach(contributor => {
        contributor.repositories.forEach(repo => {
            uniqueRepos.add(repo.name);
        });
    });
    const totalUniqueRepos = uniqueRepos.size;

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
                    <div className={`${styles.summaryCard} ${styles.card}`}>
                        <div className={styles.summaryContent}>
                            <div className={styles.statColumn}>
                                <FaUsers className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Contributors</p>
                                <p className={styles.summaryNumber}>{contributorsData.unique_count}</p>
                            </div>
                            <div className={styles.statColumn}>
                                <VscRepo className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Repositories</p>
                                <p className={styles.summaryNumber}>{totalUniqueRepos}</p>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.summaryCard} ${styles.card}`}>
                        <div className={styles.summaryContent}>
                            <div className={styles.statColumn}>
                                <VscGitCommit className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Commits</p>
                                <p className={styles.summaryNumber}>{contributorsData.total_commits || 0}</p>
                            </div>
                            <div className={styles.statColumn}>
                                <VscGitPullRequest className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Pull Requests</p>
                                <p className={styles.summaryNumber}>{contributorsData.total_pull_requests}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.contributorsGrid}>
                {contributorsData.contributors.map((contributor) => (
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
                                alt={`${contributor.login}'s avatar`}
                                width={48}
                                height={48}
                                className={styles.avatar}
                            />
                            <h3 className={styles.username}>{contributor.login}</h3>
                        </div>
                        <div className={styles.contributorStats}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Commits</span>
                                <span className={styles.statValue}>{contributor.commits}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>PRs</span>
                                <span className={styles.statValue}>{contributor.pull_requests}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Repos</span>
                                <span className={styles.statValue}>{contributor.repositories.length}</span>
                            </div>
                        </div>

                        <div className={styles.timelineContainer}>
                            <ContributionTimeline
                                commitTimestamps={contributor.repositories.flatMap(repo => repo.commit_timestamps)}
                                prTimestamps={contributor.repositories.flatMap(repo => repo.pr_timestamps)}
                            />
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
                    contributor={selectedContributor}
                    onClose={() => setSelectedContributor(null)}
                />
            )}
        </div>
    );
} 