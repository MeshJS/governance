import { useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '../styles/ContributorModal.module.css';
import { Contributor } from '../types';
import RepoDonutChart from './RepoDonutChart';
import { IoClose } from 'react-icons/io5';
import { FaGithub, FaCode, FaCodeBranch, FaCodePullRequest } from 'react-icons/fa6';
import ContributionTimeline from './ContributionTimeline';

interface ContributorModalProps {
    contributor: Contributor;
    onClose: () => void;
}

export const ContributorModal: React.FC<ContributorModalProps> = ({
    contributor,
    onClose,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }

        function handleClickOutside(e: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        }

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);

        // Lock body scroll
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    };

    // Sort repositories by contributions in descending order
    const sortedRepos = [...contributor.repositories].sort((a, b) => b.contributions - a.contributions);

    return (
        <div className={styles.overlay}>
            <button className={styles.closeButton} onClick={handleClose}>
                <IoClose size={24} />
            </button>
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.contributorHeader}>
                    <Image
                        src={contributor.avatar_url}
                        alt={`${contributor.login}'s avatar`}
                        width={80}
                        height={80}
                        className={styles.avatar}
                    />
                    <h2 className={styles.contributorName}>
                        <a
                            href={`https://github.com/${contributor.login}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {contributor.login}
                            <FaGithub />
                        </a>
                    </h2>
                </div>

                <div className={styles.metadata}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                            <FaCodeBranch /> Total Contributions
                        </span>
                        <span className={styles.metaValue}>{contributor.contributions}</span>
                        <span className={styles.metaLabel}>Repositories</span>
                        <span className={styles.metaValue}>{contributor.repositories.length}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                            <FaCode /> Commits
                        </span>
                        <span className={styles.metaValue}>{contributor.commits}</span>
                        <span className={styles.metaLabel}>
                            <FaCodePullRequest /> Pull Requests
                        </span>
                        <span className={styles.metaValue}>{contributor.pull_requests}</span>
                    </div>
                </div>

                <div className={styles.content}>
                    <div className={styles.timelineContainer}>
                        <ContributionTimeline
                            commitTimestamps={contributor.repositories.flatMap(repo => repo.commit_timestamps)}
                            prTimestamps={contributor.repositories.flatMap(repo => repo.pr_timestamps)}
                            height={200}
                            showAxis={false}
                        />
                    </div>

                    <h3 className={styles.sectionTitle}>Repository Contributions</h3>
                    <div className={styles.donutChartContainer}>
                        <RepoDonutChart repositories={sortedRepos} />
                    </div>

                    <div className={styles.repoDetailList}>
                        <h3 className={styles.sectionTitle}>Repository Details</h3>
                        <table className={styles.repoTable}>
                            <thead>
                                <tr>
                                    <th>Repository</th>
                                    <th>Commits</th>
                                    <th>PRs</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRepos.map(repo => (
                                    <tr key={repo.name}>
                                        <td>
                                            <a
                                                href={`https://github.com/MeshJS/${repo.name}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {repo.name}
                                            </a>
                                        </td>
                                        <td>{repo.commits}</td>
                                        <td>{repo.pull_requests}</td>
                                        <td>{repo.contributions}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContributorModal;