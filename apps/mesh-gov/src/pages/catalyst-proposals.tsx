import CatalystProposalsList from '../components/CatalystProposalsList';
import { useData } from '../contexts/DataContext';
import styles from '../styles/Proposals.module.css';
import PageHeader from '../components/PageHeader';
import SearchFilterBar, { SearchFilterConfig } from '../components/SearchFilterBar';
import { filterProposals, generateCatalystProposalsFilterConfig } from '../config/filterConfig';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CatalystProject } from '../types';
import { useRouter } from 'next/router';
import CatalystMilestonesDonut from '../components/CatalystMilestonesDonut';
import CatalystBudgetDonut from '../components/CatalystBudgetDonut';
import VotesDonutChart from '../components/VotesDonutChart';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import MilestoneDeliveryChart from '../components/MilestoneDeliveryChart';
import { extractAllMilestonesFromProjects } from '../utils/catalystDataTransform';

// Simple number formatting function that doesn't rely on locale settings
const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
};

// Format ADA amount with symbol
const formatAda = (amount: number): string => {
    return `₳ ${formatNumber(amount)}`;
};

// Store scroll position in sessionStorage to persist across page navigations
const SCROLL_POSITION_KEY = 'catalyst-proposals-scroll';

// Helper functions
const calculateProgress = (completed: number, total: number): number => {
    if (!total) return 0;
    return Math.round((completed / total) * 100);
};

// Determine project status based on milestone completion
const getProjectStatus = (milestonesCompleted: number, totalMilestones: number): 'Completed' | 'In Progress' => {
    if (milestonesCompleted >= totalMilestones && totalMilestones > 0) {
        return 'Completed';
    }
    return 'In Progress';
};

const getFundingRound = (category: string): string => {
    const match = category.match(/Fund \d+/i);
    return match ? match[0] : category;
};

const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function CatalystProposals() {
    const router = useRouter();
    const { catalystData, isLoading, error } = useData();
    const [filteredProjects, setFilteredProjects] = useState<CatalystProject[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
    const [filterConfig, setFilterConfig] = useState<SearchFilterConfig>({
        placeholder: "Search proposals...",
        filters: []
    });
    const shouldRestoreScroll = useRef(false);

    // Enable scroll restoration
    useScrollRestoration();

    useEffect(() => {
        // Check if we're returning from a proposal page
        if (router.asPath === '/catalyst-proposals' && shouldRestoreScroll.current) {
            const scrollY = sessionStorage.getItem('scrollPosition');
            if (scrollY) {
                // Delay the scroll restoration slightly to ensure the page is fully rendered
                setTimeout(() => {
                    window.scrollTo(0, parseInt(scrollY));
                    sessionStorage.removeItem('scrollPosition');
                }, 100);
            }
            shouldRestoreScroll.current = false;
        }
    }, [router.asPath]);

    useEffect(() => {
        if (catalystData?.catalystData) {
            setFilterConfig(generateCatalystProposalsFilterConfig(catalystData.catalystData.projects));
        }
    }, [catalystData]);

    const handleCardClick = (projectId: number) => {
        // Save the current scroll position
        sessionStorage.setItem('scrollPosition', window.scrollY.toString());
        shouldRestoreScroll.current = true;
        router.push(`/catalyst-proposals/${projectId}`);
    };

    // Get data early to avoid conditional access
    const data = catalystData?.catalystData;
    const allProjects = data?.projects || [];

    // Extract milestones from catalyst data
    const milestones = data?.projects ? extractAllMilestonesFromProjects(data.projects) : [];

    // Calculate stats based on all projects
    const stats = useMemo(() => ({
        totalBudget: allProjects.reduce((sum: number, p: CatalystProject) => sum + p.projectDetails.budget, 0),
        completedProjects: allProjects.filter((p: CatalystProject) => getProjectStatus(p.milestonesCompleted, p.projectDetails.milestones_qty) === 'Completed').length,
        totalProjects: allProjects.length,
        totalVotes: allProjects.reduce((sum: number, p: CatalystProject) => sum + (p.projectDetails.voting.yes_votes_count || 0), 0)
    }), [allProjects]);

    // Calculate milestone stats
    const milestoneStats = useMemo(() => {
        let totalMilestones = 0;
        let completedMilestones = 0;

        allProjects.forEach(project => {
            totalMilestones += project.projectDetails.milestones_qty;
            completedMilestones += project.milestonesCompleted;
        });

        return { totalMilestones, completedMilestones };
    }, [allProjects]);

    // Calculate budget stats
    const budgetStats = useMemo(() => {
        let totalBudget = 0;
        let distributedBudget = 0;

        allProjects.forEach(project => {
            totalBudget += project.projectDetails.budget;
            distributedBudget += project.projectDetails.funds_distributed;
        });

        return { totalBudget, distributedBudget };
    }, [allProjects]);

    // Handle search and filtering
    const handleSearch = useCallback((searchTerm: string, activeFilters: Record<string, string>) => {
        if (!searchTerm && Object.keys(activeFilters).length === 0) {
            setFilteredProjects([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const filtered = filterProposals(allProjects, searchTerm, activeFilters);
        setFilteredProjects(filtered);
    }, [allProjects]);

    // Handle URL search parameter
    useEffect(() => {
        if (router.isReady && router.query.search && data) {
            const searchTerm = router.query.search as string;
            const filtered = filterProposals(data.projects, searchTerm, {});
            setFilteredProjects(filtered);
            setIsSearching(true);
        }
    }, [router.isReady, router.query.search, data]);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading catalyst data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>No catalyst data available</div>
            </div>
        );
    }

    // Determine which data to display
    const displayData = {
        ...data,
        projects: isSearching ? filteredProjects : data.projects
    };

    return (
        <div className={styles.container}>
            <PageHeader
                title={<>Catalyst Proposal <span>Dashboard</span></>}
                subtitle="Mesh received strong support from Ada voters at Cardano's Project Catalyst. We are greatful for every support and want to make sure that our supporters have easy overview and insights on the progress of our funded proposals"
            />

            <SearchFilterBar
                config={filterConfig}
                onSearch={handleSearch}
                initialSearchTerm={router.query.search as string}
            />

            <div className={styles.chartsGrid}>
                <div className={styles.chartSection}>
                    <CatalystMilestonesDonut
                        totalMilestones={milestoneStats.totalMilestones}
                        completedMilestones={milestoneStats.completedMilestones}
                    />
                </div>
                <div className={styles.chartSection}>
                    <CatalystBudgetDonut
                        totalBudget={budgetStats.totalBudget}
                        distributedBudget={budgetStats.distributedBudget}
                    />
                </div>
                <div className={styles.chartSection}>
                    <VotesDonutChart proposals={allProjects} />
                </div>
            </div>

            {/* Milestone Delivery Timeline Chart */}
            <MilestoneDeliveryChart milestones={milestones} />

            {isSearching && (
                <div className={styles.searchResults}>
                    <h2>Search Results ({filteredProjects.length} projects found)</h2>
                </div>
            )}

            <CatalystProposalsList data={displayData} />

            <div className={styles.milestoneOverview}>
                <h3 className={styles.milestoneOverviewTitle}>Project Milestones Progress</h3>
                <div className={styles.milestoneGrid}>
                    {filteredProjects.map((project) => (
                        <a
                            key={project.projectDetails.id}
                            className={styles.milestoneRow}
                            onClick={(e) => {
                                e.preventDefault();
                                handleCardClick(parseInt(project.projectDetails.project_id));
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.milestoneInfo}>
                                <div className={styles.milestoneTitle}>
                                    <span className={styles.fundTag}>{getFundingRound(project.projectDetails.category)}</span>
                                    <span className={styles.projectTitle}>{project.projectDetails.title}</span>
                                </div>
                                <div className={styles.milestoneCount}>
                                    {project.milestonesCompleted ?? 0}/{project.projectDetails.milestones_qty}
                                </div>
                            </div>
                            <div className={styles.milestoneProgressBar}>
                                <div
                                    className={styles.milestoneProgressFill}
                                    style={{
                                        width: `${calculateProgress(project.milestonesCompleted, project.projectDetails.milestones_qty)}%`,
                                        background: calculateProgress(project.milestonesCompleted, project.projectDetails.milestones_qty) === 100
                                            ? 'linear-gradient(90deg, rgba(56, 232, 225, 0.25), rgba(56, 232, 225, 0.35))'
                                            : calculateProgress(project.milestonesCompleted, project.projectDetails.milestones_qty) > 50
                                                ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.25))'
                                                : 'linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.15))'
                                    }}
                                />
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            <ul className={styles.list}>
                {filteredProjects.map((project) => (
                    <li
                        key={project.projectDetails.id}
                        className={`${styles.card} ${styles.clickable}`}
                        data-testid="proposal-item"
                        onClick={() => handleCardClick(parseInt(project.projectDetails.project_id))}
                    >
                        {/* ... existing card content ... */}
                    </li>
                ))}
            </ul>
            <div className={styles.timestamp}>
                Last updated: {formatDate(data.timestamp)}
            </div>
        </div>
    );
} 