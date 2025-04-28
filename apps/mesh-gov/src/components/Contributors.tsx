import { useState, useMemo } from 'react';
import styles from '../styles/Contributors.module.css';
import { Contributor } from '../types';
import { ContributorModal } from './ContributorModal';
import { FaCrown, FaCodeBranch } from 'react-icons/fa';

interface ContributorsProps {
    contributors: Contributor[];
}

export default function Contributors({ contributors }: ContributorsProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);

    const totalContributions = useMemo(() => 
        contributors.reduce((sum, c) => sum + c.contributions, 0),
        [contributors]
    );

    const getContributorStats = (contributor: Contributor) => {
        // Calculate percentage of total contributions
        const contributionPercentage = (contributor.contributions / totalContributions) * 100;
        
        // Sort repositories by contributions
        const sortedRepos = [...contributor.repositories]
            .sort((a, b) => b.contributions - a.contributions);
        
        // Calculate repository percentages
        const repoPercentages = sortedRepos.map(repo => ({
            ...repo,
            percentage: (repo.contributions / contributor.contributions) * 100
        }));

        // Get top 3 repositories
        const topRepos = repoPercentages.slice(0, 3);

        // Determine if they're a top contributor (top 10%)
        const isTopContributor = contributionPercentage >= 90;

        // Check if they contribute to multiple repositories
        const isMultiRepoContributor = contributor.repositories.length > 1;

        return {
            topRepos,
            isTopContributor,
            isMultiRepoContributor,
            contributionPercentage
        };
    };

    // Generate a consistent color for a repository
    const getRepoColor = (repoName: string) => {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', 
            '#96CEB4', '#FFEEAD', '#D4A5A5',
            '#9B59B6', '#3498DB', '#F1C40F'
        ];
        
        const hash = repoName.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        
        return colors[Math.abs(hash) % colors.length];
    };

    const handleContributorClick = (contributor: Contributor) => {
        setSelectedContributor(contributor);
        setShowModal(true);
    };

    return (
        <div className={styles.contributorsGrid}>
            {contributors.map((contributor) => {
                const stats = getContributorStats(contributor);
                
                return (
                    <div
                        key={contributor.login}
                        className={styles.contributorCard}
                        onClick={() => handleContributorClick(contributor)}
                    >
                        <div className={styles.contributorHeader}>
                            <img
                                src={contributor.avatar_url}
                                alt={`${contributor.login}'s avatar`}
                                className={styles.avatar}
                            />
                            <h3 className={styles.username}>{contributor.login}</h3>
                        </div>
                        <div className={styles.contributorStats}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{contributor.contributions}</span>
                                <span className={styles.statLabel}>
                                    Contributions
                                </span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{contributor.repositories.length}</span>
                                <span className={styles.statLabel}>
                                    Repositories
                                </span>
                            </div>
                        </div>

                        <div className={styles.badges}>
                            {stats.isTopContributor && (
                                <span className={`${styles.badge} ${styles.topContributor}`}>
                                    <FaCrown size={10} />
                                    Top Contributor
                                </span>
                            )}
                            {stats.isMultiRepoContributor && (
                                <span className={`${styles.badge} ${styles.multiRepo}`}>
                                    <FaCodeBranch size={10} />
                                    Multi-Repo
                                </span>
                            )}
                        </div>

                        <div className={styles.topRepos}>
                            {stats.topRepos.map((repo) => (
                                <div key={repo.name} className={styles.repoBreakdown}>
                                    <div 
                                        className={styles.repoColor}
                                        style={{ backgroundColor: getRepoColor(repo.name) }}
                                    />
                                    <div className={styles.repoInfo}>
                                        <span className={styles.repoName}>{repo.name}</span>
                                        <span className={styles.repoPercentage}>
                                            {Math.round(repo.percentage)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {showModal && selectedContributor && (
                <ContributorModal
                    username={selectedContributor.login}
                    avatar={selectedContributor.avatar_url}
                    totalContributions={selectedContributor.contributions}
                    repositories={selectedContributor.repositories}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedContributor(null);
                    }}
                />
            )}
        </div>
    );
} 