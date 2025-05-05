import CatalystProposalsList from '../components/CatalystProposalsList';
import { useData } from '../contexts/DataContext';
import styles from '../styles/Proposals.module.css';
import PageHeader from '../components/PageHeader';
import SearchFilterBar, { SearchFilterConfig } from '../components/SearchFilterBar';
import { filterProposals, generateCatalystProposalsFilterConfig } from '../config/filterConfig';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { CatalystProject } from '../types';
import { useRouter } from 'next/router';
import CatalystMilestonesDonut from '../components/CatalystMilestonesDonut';
import CatalystBudgetDonut from '../components/CatalystBudgetDonut';
import VotesDonutChart from '../components/VotesDonutChart';

// Simple number formatting function that doesn't rely on locale settings
const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
};

// Format ADA amount with symbol
const formatAda = (amount: number): string => {
    return `₳ ${formatNumber(amount)}`;
};

export default function CatalystProposals() {
    const { catalystData, isLoading, error } = useData();
    const [filteredProjects, setFilteredProjects] = useState<CatalystProject[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const router = useRouter();
    const [lastNavigationTime, setLastNavigationTime] = useState(0);

    // Get data early to avoid conditional access
    const data = catalystData?.catalystData;
    const allProjects = data?.projects || [];

    // Generate dynamic filter config based on available data
    const dynamicFilterConfig = useMemo(() => {
        if (!data) return {
            placeholder: "Search proposals...",
            filters: [],
        } as SearchFilterConfig;
        return generateCatalystProposalsFilterConfig(data.projects);
    }, [data]);

    // Calculate stats based on all projects
    const stats = useMemo(() => ({
        totalBudget: allProjects.reduce((sum: number, p: CatalystProject) => sum + p.projectDetails.budget, 0),
        completedProjects: allProjects.filter((p: CatalystProject) => p.projectDetails.status === 'Completed').length,
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

    // Handle row click
    const handleRowClick = useCallback((projectId: number) => {
        const now = Date.now();
        if (now - lastNavigationTime < 1000) return; // Prevent clicks within 1 second

        router.push(`/catalyst-proposals?search=${projectId}`);
        setLastNavigationTime(now);
    }, [router, lastNavigationTime]);

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
                config={dynamicFilterConfig}
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

            {isSearching && (
                <div className={styles.searchResults}>
                    <h2>Search Results ({filteredProjects.length} projects found)</h2>
                </div>
            )}

            <CatalystProposalsList data={displayData} onRowClick={handleRowClick} />
        </div>
    );
} 