import { useEffect, useRef } from 'react';
import styles from '../styles/ContributorModal.module.css';
import { ContributorRepository } from '../types';
import Image from 'next/image';
import RepoDonutChart from './RepoDonutChart';
import { IoClose } from 'react-icons/io5';
import { FaGithub } from 'react-icons/fa';

interface ContributorModalProps {
    username: string;
    avatar: string;
    totalContributions: number;
    repositories: ContributorRepository[];
    onClose: () => void;
}

export const ContributorModal: React.FC<ContributorModalProps> = ({
    username,
    avatar,
    totalContributions,
    repositories,
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
    const sortedRepos = [...repositories].sort((a, b) => b.contributions - a.contributions);

    return (
        <div className={styles.overlay}>
            <button className={styles.closeButton} onClick={handleClose}>
                <IoClose size={24} />
            </button>
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.contributorHeader}>
                    <Image
                        src={avatar}
                        alt={`${username}'s avatar`}
                        width={80}
                        height={80}
                        className={styles.avatar}
                    />
                    <h2 className={styles.contributorName}>
                        <a
                            href={`https://github.com/${username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {username}
                            <FaGithub />
                        </a>
                    </h2>
                </div>

                <div className={styles.metadata}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Total Contributions</span>
                        <span className={styles.metaValue}>{totalContributions}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Contributed Repositories</span>
                        <span className={styles.metaValue}>{repositories.length}</span>
                    </div>
                </div>

                <div className={styles.content}>
                    <h3 className={styles.sectionTitle}>Repository Contributions</h3>
                    <div className={styles.donutChartContainer}>
                        <RepoDonutChart repositories={sortedRepos} />
                    </div>
                </div>
            </div>
        </div>
    );
};