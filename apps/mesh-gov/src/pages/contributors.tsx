import { useData } from '../contexts/DataContext';
import styles from '../styles/Contributors.module.css';
import Image from 'next/image';
import PageHeader from '../components/PageHeader';
import ContributorModal from '../components/ContributorModal';
import { useState, useMemo } from 'react';
import { Contributor } from '../types';
import { FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { VscGitCommit, VscGitPullRequest, VscRepo } from 'react-icons/vsc';
import ContributionTimeline from '../components/ContributionTimeline';
import { getFilteredMetrics, getFilteredSummaryMetrics } from '../utils/contributorMetrics';

// Generate a consistent color for a repository
const getRepoColor = (repoName: string) => {
    return 'rgba(255, 255, 255, 0.3)';
};

// Time window presets
const TIME_WINDOW_PRESETS = [
    { label: 'All time', value: 'all' },
    { label: 'Last year', value: '1y' },
    { label: 'Last 6 months', value: '6m' },
    { label: 'Last 3 months', value: '3m' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Custom range', value: 'custom' }
];

interface TimeWindow {
    startDate: string | null;
    endDate: string | null;
    preset: string;
}

export default function Contributors() {
    const { contributorsData, isLoading, error } = useData();
    const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);

    // Default time window is set to "All time" when page loads
    const [timeWindow, setTimeWindow] = useState<TimeWindow>({
        startDate: null,
        endDate: null,
        preset: 'all' // This corresponds to "All time" option
    });
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

    // Calculate global earliest contribution date across all contributors
    const globalEarliestDate = useMemo(() => {
        if (!contributorsData) return null;

        let earliestDate: string | null = null;

        contributorsData.contributors.forEach(contributor => {
            contributor.repositories.forEach(repo => {
                const allTimestamps = [...repo.commit_timestamps, ...repo.pr_timestamps];
                allTimestamps.forEach(timestamp => {
                    if (!earliestDate || timestamp < earliestDate) {
                        earliestDate = timestamp;
                    }
                });
            });
        });

        return earliestDate;
    }, [contributorsData]);

    // Calculate time window boundaries based on preset or custom selection
    const timeWindowBoundaries = useMemo(() => {
        if (timeWindow.preset === 'custom') {
            return {
                startDate: timeWindow.startDate,
                endDate: timeWindow.endDate
            };
        }

        if (timeWindow.preset === 'all') {
            return {
                startDate: null,  // No filtering for "all time"
                endDate: null
            };
        }

        // Calculate preset boundaries
        const now = new Date();
        const startDate = new Date(now);

        switch (timeWindow.preset) {
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '3m':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6m':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                return {
                    startDate: globalEarliestDate,
                    endDate: null
                };
        }

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0]
        };
    }, [timeWindow, globalEarliestDate]);

    // Calculate filtered summary metrics
    const filteredSummaryMetrics = useMemo(() => {
        if (!contributorsData) return null;

        const { startDate, endDate } = timeWindowBoundaries;
        return getFilteredSummaryMetrics(contributorsData.contributors, startDate, endDate);
    }, [contributorsData, timeWindowBoundaries]);

    // Sort contributors by their activity in the selected time window
    const sortedContributors = useMemo(() => {
        if (!contributorsData) return [];

        const { startDate, endDate } = timeWindowBoundaries;

        // Create array of contributors with their filtered metrics
        const contributorsWithMetrics = contributorsData.contributors.map(contributor => {
            const filteredMetrics = getFilteredMetrics(contributor, startDate, endDate);
            return {
                contributor,
                filteredMetrics
            };
        });

        // Sort by total contributions in the time window (descending)
        return contributorsWithMetrics.sort((a, b) => {
            // Primary sort: total contributions
            const contributionsDiff = b.filteredMetrics.contributions - a.filteredMetrics.contributions;
            if (contributionsDiff !== 0) return contributionsDiff;

            // Secondary sort: commits (for tiebreaker)
            const commitsDiff = b.filteredMetrics.commits - a.filteredMetrics.commits;
            if (commitsDiff !== 0) return commitsDiff;

            // Tertiary sort: pull requests (for tiebreaker)
            return b.filteredMetrics.pullRequests - a.filteredMetrics.pullRequests;
        });
    }, [contributorsData, timeWindowBoundaries]);

    const handleTimeWindowPresetChange = (preset: string) => {
        setTimeWindow(prev => ({
            ...prev,
            preset
        }));
        setShowCustomDatePicker(preset === 'custom');
    };

    const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
        setTimeWindow(prev => {
            const newWindow = { ...prev, [field]: value };

            // Validate date range - ensure start is not after end
            if (newWindow.startDate && newWindow.endDate) {
                const start = new Date(newWindow.startDate);
                const end = new Date(newWindow.endDate);

                if (start > end) {
                    // If start is after end, adjust the other date
                    if (field === 'startDate') {
                        newWindow.endDate = value; // Set end to match start
                    } else {
                        newWindow.startDate = value; // Set start to match end
                    }
                }
            }

            return newWindow;
        });
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <PageHeader
                    title={<>Mesh <span>Contributors</span></>}
                    subtitle="Loading contributor data..."
                />
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <PageHeader
                    title={<>Mesh <span>Contributors</span></>}
                    subtitle="Error loading contributor data"
                />
                <div className={styles.errorContainer}>
                    <p>Error: {error}</p>
                </div>
            </div>
        );
    }

    if (!contributorsData) {
        return (
            <div className={styles.container}>
                <PageHeader
                    title={<>Mesh <span>Contributors</span></>}
                    subtitle="No contributor data available"
                />
                <div className={styles.errorContainer}>
                    <p>No contributor data is currently available.</p>
                </div>
            </div>
        );
    }

    const handleCardClick = (contributor: Contributor) => {
        setSelectedContributor(contributor);
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerSection}>
                <PageHeader
                    title={<>Mesh <span>Contributors</span></>}
                    subtitle="Mesh is build by many minds and hands, here our Contributors"
                />

                {/* Time Window Selector - Positioned alongside header */}
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
                                    className={`${styles.presetButton} ${timeWindow.preset === preset.value ? styles.active : ''
                                        }`}
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

            <div className={styles.summaryContainer}>
                <div className={styles.summaryCards}>
                    <div className={`${styles.summaryCard} ${styles.card}`}>
                        <div className={styles.summaryContent}>
                            <div className={styles.statColumn}>
                                <FaUsers className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Active Contributors</p>
                                <p className={styles.summaryNumber}>
                                    {filteredSummaryMetrics?.activeContributors || 0}
                                </p>
                            </div>
                            <div className={styles.statColumn}>
                                <VscRepo className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Active Repositories</p>
                                <p className={styles.summaryNumber}>
                                    {filteredSummaryMetrics?.activeRepositories || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.summaryCard} ${styles.card}`}>
                        <div className={styles.summaryContent}>
                            <div className={styles.statColumn}>
                                <VscGitCommit className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Commits</p>
                                <p className={styles.summaryNumber}>
                                    {filteredSummaryMetrics?.totalCommits || 0}
                                </p>
                            </div>
                            <div className={styles.statColumn}>
                                <VscGitPullRequest className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Pull Requests</p>
                                <p className={styles.summaryNumber}>
                                    {filteredSummaryMetrics?.totalPRs || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.contributorsGrid}>
                {sortedContributors.map((item, index) => {
                    const contributor = item.contributor;
                    const filteredMetrics = item.filteredMetrics;

                    // Only show contributors who have contributions in the selected time window
                    if (filteredMetrics.contributions === 0 && timeWindow.preset !== 'all') {
                        return null;
                    }

                    return (
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
                                <div className={styles.contributorNameSection}>
                                    <h3 className={styles.username}>{contributor.login}</h3>
                                    {timeWindow.preset !== 'all' && filteredMetrics.contributions > 0 && (
                                        <div className={styles.rankingBadge}>
                                            #{index + 1}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.contributorStats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Commits</span>
                                    <span className={styles.statValue}>{filteredMetrics.commits}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>PRs</span>
                                    <span className={styles.statValue}>{filteredMetrics.pullRequests}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Repos</span>
                                    <span className={styles.statValue}>{filteredMetrics.repositories}</span>
                                </div>
                            </div>

                            <div className={styles.timelineContainer}>
                                <ContributionTimeline
                                    commitTimestamps={contributor.repositories.flatMap(repo => repo.commit_timestamps)}
                                    prTimestamps={contributor.repositories.flatMap(repo => repo.pr_timestamps)}
                                    globalStartDate={timeWindowBoundaries.startDate || undefined}
                                    globalEndDate={timeWindowBoundaries.endDate || undefined}
                                />
                            </div>

                            <div className={styles.topRepos}>
                                {contributor.repositories
                                    .map(repo => {
                                        // Calculate filtered metrics for this repository in the time window
                                        const repoFilteredMetrics = getFilteredMetrics(
                                            { ...contributor, repositories: [repo] } as Contributor,
                                            timeWindowBoundaries.startDate,
                                            timeWindowBoundaries.endDate
                                        );
                                        return {
                                            repo,
                                            filteredContributions: repoFilteredMetrics.contributions
                                        };
                                    })
                                    .filter(item => item.filteredContributions > 0 || timeWindow.preset === 'all') // Only show repos with activity in time window (or all for "all time")
                                    .sort((a, b) => {
                                        // Sort by filtered contributions for the time window
                                        if (timeWindow.preset === 'all') {
                                            // For "all time", use original all-time contributions
                                            return b.repo.contributions - a.repo.contributions;
                                        } else {
                                            // For time windows, use filtered contributions
                                            return b.filteredContributions - a.filteredContributions;
                                        }
                                    })
                                    .slice(0, 3) // Show top 3 repositories
                                    .map((item) => (
                                        <div key={item.repo.name} className={styles.repoBreakdown}>
                                            <div
                                                className={styles.repoColor}
                                                style={{ backgroundColor: getRepoColor(item.repo.name) }}
                                            />
                                            <div className={styles.repoInfo}>
                                                <span className={styles.repoName}>{item.repo.name}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    );
                }).filter(Boolean)}

                {/* Show message if no contributors have activity in selected time window */}
                {timeWindow.preset !== 'all' &&
                    filteredSummaryMetrics?.activeContributors === 0 && (
                        <div className={styles.noContributorsMessage}>
                            <p>No contributors found with activity in the selected time window.</p>
                            <p>Try selecting a different time period or &quot;All time&quot; to see all contributors.</p>
                        </div>
                    )}
            </div>

            {selectedContributor && (
                <ContributorModal
                    contributor={selectedContributor}
                    globalStartDate={timeWindowBoundaries.startDate || undefined}
                    globalEndDate={timeWindowBoundaries.endDate || undefined}
                    onClose={() => setSelectedContributor(null)}
                />
            )}
        </div>
    );
} 