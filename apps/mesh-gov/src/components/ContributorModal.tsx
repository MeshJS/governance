import { useEffect, useRef, useMemo, useState } from 'react';
import Image from 'next/image';
import styles from '../styles/ContributorModal.module.css';
import { Contributor } from '../types';
import RepoDonutChart from './RepoDonutChart';
import { IoClose } from 'react-icons/io5';
import { FaGithub, FaCode, FaCodeBranch, FaCodePullRequest } from 'react-icons/fa6';
import { FaCalendarAlt } from 'react-icons/fa';
import ContributionTimeline from './ContributionTimeline';
import { getFilteredMetrics } from '../utils/contributorMetrics';

interface ContributorModalProps {
    contributor: Contributor;
    globalStartDate?: string;
    globalEndDate?: string;
    onClose: () => void;
}

interface TimeWindow {
    startDate: string | null;
    endDate: string | null;
    preset: string;
}

const TIME_WINDOW_PRESETS = [
    { label: 'All time', value: 'all' },
    { label: 'Last year', value: '1y' },
    { label: 'Last 6 months', value: '6m' },
    { label: 'Last 3 months', value: '3m' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Custom range', value: 'custom' }
];

export const ContributorModal: React.FC<ContributorModalProps> = ({
    contributor,
    globalStartDate,
    globalEndDate,
    onClose,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Establish initial window (inherit from page if provided)
    const [timeWindow, setTimeWindow] = useState<TimeWindow>({
        startDate: globalStartDate || null,
        endDate: globalEndDate || null,
        preset: globalStartDate || globalEndDate ? 'custom' : 'all',
    });
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(timeWindow.preset === 'custom');

    // Earliest contribution date for this contributor
    const earliestDate = useMemo(() => {
        let earliest: string | null = null;
        contributor.repositories.forEach(repo => {
            const allTimestamps = [...repo.commit_timestamps, ...repo.pr_timestamps];
            allTimestamps.forEach(ts => {
                if (!earliest || ts < earliest) earliest = ts;
            });
        });
        return earliest;
    }, [contributor]);

    // Compute local time window boundaries
    const { localStartDate, localEndDate } = useMemo(() => {
        if (timeWindow.preset === 'custom') {
            return { localStartDate: timeWindow.startDate, localEndDate: timeWindow.endDate };
        }
        if (timeWindow.preset === 'all') {
            return { localStartDate: null, localEndDate: null };
        }
        const now = new Date();
        const start = new Date(now);
        switch (timeWindow.preset) {
            case '30d':
                start.setDate(now.getDate() - 30);
                break;
            case '3m':
                start.setMonth(now.getMonth() - 3);
                break;
            case '6m':
                start.setMonth(now.getMonth() - 6);
                break;
            case '1y':
                start.setFullYear(now.getFullYear() - 1);
                break;
            default:
                return { localStartDate: earliestDate, localEndDate: null };
        }
        return {
            localStartDate: start.toISOString().split('T')[0],
            localEndDate: now.toISOString().split('T')[0],
        };
    }, [timeWindow, earliestDate]);

    const handleTimeWindowPresetChange = (preset: string) => {
        setTimeWindow(prev => ({ ...prev, preset }));
        setShowCustomDatePicker(preset === 'custom');
    };

    const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
        setTimeWindow(prev => {
            const updated = { ...prev, [field]: value, preset: 'custom' } as TimeWindow;
            if (updated.startDate && updated.endDate) {
                const start = new Date(updated.startDate);
                const end = new Date(updated.endDate);
                if (start > end) {
                    if (field === 'startDate') updated.endDate = value; else updated.startDate = value;
                }
            }
            return updated;
        });
        setShowCustomDatePicker(true);
    };

    // Calculate filtered metrics for the selected time window
    const filteredMetrics = useMemo(() => {
        return getFilteredMetrics(contributor, localStartDate || null, localEndDate || null);
    }, [contributor, localStartDate, localEndDate]);

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
                        <span className={styles.metaValue}>{filteredMetrics.contributions}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Active Repositories</span>
                        <span className={styles.metaValue}>{filteredMetrics.repositories}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                            <FaCode /> Commits
                        </span>
                        <span className={styles.metaValue}>{filteredMetrics.commits}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                            <FaCodePullRequest /> Pull Requests
                        </span>
                        <span className={styles.metaValue}>{filteredMetrics.pullRequests}</span>
                    </div>
                </div>

                <div className={styles.content}>
                    <div className={styles.timelineContainer}>
                        <ContributionTimeline
                            commitTimestamps={contributor.repositories.flatMap(repo => repo.commit_timestamps)}
                            prTimestamps={contributor.repositories.flatMap(repo => repo.pr_timestamps)}
                            height={220}
                            showAxis={true}
                            globalStartDate={localStartDate || undefined}
                            globalEndDate={localEndDate || undefined}
                        />
                    </div>

                    {/* Moved time window selector under the line chart */}
                    <div className={styles.timeWindowSection}>
                        <div className={styles.timeWindowSelector}>
                            <div className={styles.timeWindowHeader}>
                                <FaCalendarAlt className={styles.timeWindowIcon} />
                                <h3>Time Window</h3>
                            </div>
                            <div className={styles.timeWindowControls}>
                                <div className={styles.presetButtons}>
                                    {TIME_WINDOW_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            className={`${styles.presetButton} ${timeWindow.preset === preset.value ? styles.active : ''}`}
                                            onClick={() => handleTimeWindowPresetChange(preset.value)}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                {showCustomDatePicker && (
                                    <div className={styles.customDatePicker}>
                                        <div className={styles.dateField}>
                                            <label>Start Date:</label>
                                            <input
                                                type="date"
                                                value={timeWindow.startDate || ''}
                                                onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                                                className={styles.dateInput}
                                            />
                                        </div>
                                        <div className={styles.dateField}>
                                            <label>End Date:</label>
                                            <input
                                                type="date"
                                                value={timeWindow.endDate || ''}
                                                onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                                                className={styles.dateInput}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
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
                                {sortedRepos.map(repo => {
                                    // Calculate filtered metrics for this specific repository
                                    const repoFilteredMetrics = getFilteredMetrics(
                                        { ...contributor, repositories: [repo] } as Contributor,
                                        localStartDate || null,
                                        localEndDate || null
                                    );

                                    // Only show repositories that have contributions in the selected time window
                                    if (repoFilteredMetrics.contributions === 0 && (localStartDate || localEndDate)) {
                                        return null;
                                    }

                                    return (
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
                                            <td>{repoFilteredMetrics.commits}</td>
                                            <td>{repoFilteredMetrics.pullRequests}</td>
                                            <td>{repoFilteredMetrics.contributions}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContributorModal;