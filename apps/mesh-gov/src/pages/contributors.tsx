import { useData } from '../contexts/DataContext';
import styles from '../styles/Contributors.module.css';
import Image from 'next/image';
import PageHeader from '../components/PageHeader';
import ContributorModal from '../components/ContributorModal';
import { useState, useMemo, useEffect } from 'react';
import { Contributor, ContributorRepository } from '../types';
import { FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { VscGitCommit, VscGitPullRequest, VscRepo } from 'react-icons/vsc';
import ContributionTimeline from '../components/ContributionTimeline';
import { getFilteredMetrics, getFilteredSummaryMetrics } from '../utils/contributorMetrics';
import ContributorsEvolutionChart from '../components/ContributorsEvolutionChart';
import RepositoriesEvolutionChart from '../components/RepositoriesEvolutionChart';

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

// Helper type for contributor with metrics
interface ContributorWithMetrics {
    contributor: Contributor;
    filteredMetrics: ReturnType<typeof getFilteredMetrics>;
}

export default function Contributors() {
    const {
        contributorStats,
        contributorSummaryData,
        contributorRepoActivityData,
        contributorTimestampsData,
        isLoadingContributors,
        isLoadingContributorSummary,
        isLoadingContributorRepoActivity,
        isLoadingContributorTimestamps,
        contributorsError,
        contributorSummaryError,
        contributorRepoActivityError,
        contributorTimestampsError,
        loadContributorStats,
        loadContributorSummary,
        loadContributorRepoActivity,
        loadContributorTimestamps
    } = useData();

    // Trigger lazy loading when component mounts
    useEffect(() => {
        loadContributorStats();
    }, [loadContributorStats]);
    const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
    //console.log('contributorStats', contributorStats)
    // Default time window is set to "All time" when page loads
    const [timeWindow, setTimeWindow] = useState<TimeWindow>({
        startDate: null,
        endDate: null,
        preset: 'all' // This corresponds to "All time" option
    });
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

    // Defensive: treat as no data if contributorStats is a legacy yearly record (object with numeric keys, not .contributors array)
    const isOrgStats = contributorStats && typeof contributorStats === 'object' && 'contributors' in contributorStats && Array.isArray(contributorStats.contributors);
    // Calculate global earliest contribution date across all contributors
    const globalEarliestDate = useMemo(() => {
        if (!isOrgStats) return null;
        let earliestDate: string | null = null;
        (contributorStats.contributors as Contributor[]).forEach((contributor: Contributor) => {
            contributor.repositories.forEach((repo: ContributorRepository) => {
                const allTimestamps = [...repo.commit_timestamps, ...repo.pr_timestamps];
                allTimestamps.forEach(timestamp => {
                    if (!earliestDate || timestamp < earliestDate) {
                        earliestDate = timestamp;
                    }
                });
            });
        });
        return earliestDate;
    }, [contributorStats, isOrgStats]);

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

    // Calculate timeline display boundaries - always use global earliest date for consistent timeline display
    const timelineDisplayBoundaries = useMemo(() => {
        if (timeWindow.preset === 'custom') {
            return {
                startDate: timeWindow.startDate,
                endDate: timeWindow.endDate
            };
        }

        if (timeWindow.preset === 'all') {
            // Convert timestamp to date part for consistent timeline display
            const globalStartDate = globalEarliestDate ? new Date(globalEarliestDate).toISOString().split('T')[0] : null;
            return {
                startDate: globalStartDate,
                endDate: null
            };
        }

        // For other presets, use the same boundaries as data filtering
        return timeWindowBoundaries;
    }, [timeWindow, globalEarliestDate, timeWindowBoundaries]);

    // Calculate filtered summary metrics
    const filteredSummaryMetrics = useMemo(() => {
        if (!isOrgStats) return null;
        const { startDate, endDate } = timeWindowBoundaries;
        return getFilteredSummaryMetrics(contributorStats.contributors as Contributor[], startDate, endDate);
    }, [contributorStats, isOrgStats, timeWindowBoundaries]);

    // Sort contributors by their activity in the selected time window
    const sortedContributors = useMemo(() => {
        if (!isOrgStats) return [];
        const { startDate, endDate } = timeWindowBoundaries;
        // Create array of contributors with their filtered metrics
        const contributorsWithMetrics: ContributorWithMetrics[] = (contributorStats.contributors as Contributor[]).map((contributor: Contributor) => {
            const filteredMetrics = getFilteredMetrics(contributor, startDate, endDate);
            return {
                contributor,
                filteredMetrics
            };
        });
        // Sort by weighted contributions with repository diversity bonus
        return contributorsWithMetrics.sort((a, b) => {
            // Calculate base weighted scores - PRs are more complex so they count 3x
            const baseScoreA = a.filteredMetrics.commits + (a.filteredMetrics.pullRequests * 3);
            const baseScoreB = b.filteredMetrics.commits + (b.filteredMetrics.pullRequests * 3);
            // Apply repository diversity multiplier - multi-repo contributors get bonus
            // 1 repo: 1x, 2 repos: 1.2x, 3 repos: 1.4x, 4+ repos: 1.5x
            const getRepoMultiplier = (repoCount: number) => {
                if (repoCount === 1) return 1.0;
                if (repoCount === 2) return 1.2;
                if (repoCount === 3) return 1.4;
                return 1.5; // 4+ repositories
            };
            const finalScoreA = baseScoreA * getRepoMultiplier(a.filteredMetrics.repositories);
            const finalScoreB = baseScoreB * getRepoMultiplier(b.filteredMetrics.repositories);
            // Primary sort: final weighted score with repository diversity
            const scoreDiff = finalScoreB - finalScoreA;
            if (scoreDiff !== 0) return scoreDiff;
            // Secondary sort: repository count (cross-project engagement)
            const repoDiff = b.filteredMetrics.repositories - a.filteredMetrics.repositories;
            if (repoDiff !== 0) return repoDiff;
            // Tertiary sort: pull requests (for tiebreaker)
            const prDiff = b.filteredMetrics.pullRequests - a.filteredMetrics.pullRequests;
            if (prDiff !== 0) return prDiff;
            // Quaternary sort: commits (final tiebreaker)
            return b.filteredMetrics.commits - a.filteredMetrics.commits;
        });
    }, [contributorStats, isOrgStats, timeWindowBoundaries]);

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

    // Check if any contributor data is still loading
    const isAnyContributorDataLoading = isLoadingContributorSummary || isLoadingContributorRepoActivity || isLoadingContributorTimestamps || isLoadingContributors;

    // Check if there are any contributor data errors
    const hasContributorDataError = contributorSummaryError || contributorRepoActivityError || contributorTimestampsError || contributorsError;

    if (isAnyContributorDataLoading) {
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

    if (hasContributorDataError) {
        return (
            <div className={styles.container}>
                <PageHeader
                    title={<>Mesh <span>Contributors</span></>}
                    subtitle="Error loading contributor data"
                />
                <div className={styles.errorContainer}>
                    <p>Error: {contributorSummaryError || contributorRepoActivityError || contributorTimestampsError || contributorsError}</p>
                </div>
            </div>
        );
    }

    // Check if we have all the required contributor data
    const hasAllContributorData = contributorSummaryData && contributorRepoActivityData && contributorTimestampsData && contributorStats;

    if (!hasAllContributorData) {
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
            </div>

            <div className={styles.summaryContainer}>
                <div className={styles.summaryCards}>
                    <div className={`${styles.summaryCard} ${styles.card}`}>
                        <div className={styles.summaryContent}>
                            <div className={styles.statColumn}>
                                <FaUsers className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Total Contributors</p>
                                <p className={styles.summaryNumber}>
                                    {filteredSummaryMetrics?.activeContributors || 0}
                                </p>
                            </div>
                            <div className={styles.statColumn}>
                                <VscRepo className={styles.summaryIcon} />
                                <p className={styles.statLabel}>Total Repositories</p>
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

            {/* Evolution Charts */}
            <div className={styles.evolutionChartSection}>
                <div className={styles.chartsContainer}>
                    <div className={styles.chartWrapper}>
                        <h3 className={styles.chartTitle}>Top Contributors</h3>
                        <p className={styles.chartSubtitle}>
                            Monthly activity trends for top {isOrgStats ? Math.min(10, (contributorStats.contributors as Contributor[]).length) : 10} contributors
                        </p>
                        <div className={styles.chartContainer}>
                            <ContributorsEvolutionChart
                                contributors={isOrgStats ? (contributorStats.contributors as Contributor[]) : []}
                                height={400}
                                maxContributors={10}
                                globalStartDate={timelineDisplayBoundaries.startDate || undefined}
                                globalEndDate={timelineDisplayBoundaries.endDate || undefined}
                            />
                        </div>
                    </div>

                    <div className={styles.chartWrapper}>
                        <h3 className={styles.chartTitle}>Top Repositories</h3>
                        <p className={styles.chartSubtitle}>
                            Monthly contribution trends for the most active repositories
                        </p>
                        <div className={styles.chartContainer}>
                            <RepositoriesEvolutionChart
                                contributors={isOrgStats ? (contributorStats.contributors as Contributor[]) : []}
                                height={400}
                                maxRepositories={10}
                                globalStartDate={timelineDisplayBoundaries.startDate || undefined}
                                globalEndDate={timelineDisplayBoundaries.endDate || undefined}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Time Window Selector - Positioned above contributor cards */}
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

            <div className={styles.contributorsGrid}>
                {sortedContributors.map((item: ContributorWithMetrics, index: number) => {
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
                                    commitTimestamps={contributor.repositories.flatMap((repo: ContributorRepository) => repo.commit_timestamps)}
                                    prTimestamps={contributor.repositories.flatMap((repo: ContributorRepository) => repo.pr_timestamps)}
                                    globalStartDate={timelineDisplayBoundaries.startDate || undefined}
                                    globalEndDate={timelineDisplayBoundaries.endDate || undefined}
                                />
                            </div>

                            <div className={styles.topRepos}>
                                {contributor.repositories
                                    .map((repo: ContributorRepository) => {
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
                                    .filter((item) => item.filteredContributions > 0 || timeWindow.preset === 'all') // Only show repos with activity in time window (or all for "all time")
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
                    globalStartDate={timelineDisplayBoundaries.startDate || undefined}
                    globalEndDate={timelineDisplayBoundaries.endDate || undefined}
                    onClose={() => setSelectedContributor(null)}
                />
            )}
        </div>
    );
} 