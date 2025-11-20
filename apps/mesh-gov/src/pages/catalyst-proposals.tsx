import CatalystProposalsList from '../components/CatalystProposalsList';
import { useData } from '../contexts/DataContext';
import styles from '../styles/Proposals.module.css';
import PageHeader from '../components/PageHeader';
import SearchFilterBar, { SearchFilterConfig } from '../components/SearchFilterBar';
import { filterProposals, generateCatalystProposalsFilterConfig } from '../config/filterConfig';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CatalystProject } from '../types';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CatalystMilestonesDonut from '../components/CatalystMilestonesDonut';
import CatalystBudgetDonut from '../components/CatalystBudgetDonut';
import CatalystProposalsDonut from '../components/CatalystProposalsDonut';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import MilestoneDeliveryChart from '../components/MilestoneDeliveryChart';
import { extractAllMilestonesFromProjects } from '../utils/catalystDataTransform';
import { CountUpTimer } from '../components/CountUpTimer';

// Helper functions
const calculateProgress = (completed: number, total: number): number => {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
};

// Determine project status based on milestone completion
const getProjectStatus = (
  milestonesCompleted: number,
  totalMilestones: number
): 'Completed' | 'In Progress' => {
  if (milestonesCompleted >= totalMilestones && totalMilestones > 0) {
    return 'Completed';
  }
  return 'In Progress';
};

const getFundingRound = (category: string): string => {
  const match = category.match(/Fund \d+/i);
  return match ? match[0] : category;
};

// Extract numeric fund number from category string
const getFundNumber = (category: string): number => {
  if (!category) return Number.POSITIVE_INFINITY;
  const startF = category.match(/^\s*F\s*(\d+)/i);
  if (startF && startF[1]) return parseInt(startF[1], 10);
  const startFund = category.match(/^\s*Fund\s+(\d+)/i);
  if (startFund && startFund[1]) return parseInt(startFund[1], 10);
  const anyF = category.match(/F\s*(\d+)/i);
  if (anyF && anyF[1]) return parseInt(anyF[1], 10);
  const anyFund = category.match(/Fund\s+(\d+)/i);
  if (anyFund && anyFund[1]) return parseInt(anyFund[1], 10);
  return Number.POSITIVE_INFINITY;
};

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function CatalystProposals() {
  const router = useRouter();
  const { catalystData, isLoading, error } = useData();
  const [filteredProjects, setFilteredProjects] = useState<CatalystProject[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [filterConfig, setFilterConfig] = useState<SearchFilterConfig>({
    placeholder: 'Search proposals...',
    filters: [],
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
  const data = useMemo(() => catalystData?.catalystData, [catalystData]);
  const allProjects = useMemo(() => data?.projects || [], [data]);

  // Extract milestones from catalyst data
  const milestones = useMemo(() => 
    data?.projects ? extractAllMilestonesFromProjects(data.projects) : []
  , [data]);

  // Calculate stats based on all projects
  const stats = useMemo(
    () => ({
      totalBudget: allProjects.reduce(
        (sum: number, p: CatalystProject) => sum + p.projectDetails.budget,
        0
      ),
      completedProjects: allProjects.filter(
        (p: CatalystProject) =>
          getProjectStatus(p.milestonesCompleted, p.projectDetails.milestones_qty) === 'Completed'
      ).length,
      totalProjects: allProjects.length,
      totalVotes: allProjects.reduce(
        (sum: number, p: CatalystProject) => sum + (p.projectDetails.voting.yes_votes_count || 0),
        0
      ),
    }),
    [allProjects]
  );

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
  const handleSearch = useCallback(
    (searchTerm: string, activeFilters: Record<string, string>) => {
      if (!searchTerm && Object.keys(activeFilters).length === 0) {
        setFilteredProjects([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const filtered = filterProposals(allProjects, searchTerm, activeFilters);
      setFilteredProjects(filtered);
    },
    [allProjects]
  );

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
    projects: isSearching ? filteredProjects : data.projects,
  };

  // Sort projects for milestone progress by fund group order (F10 -> F13), then others
  const sourceForProgress = displayData.projects;
  const order = [10, 11, 12, 13];
  const buckets: Record<number, CatalystProject[]> = { 10: [], 11: [], 12: [], 13: [] } as any;
  const others: CatalystProject[] = [];
  sourceForProgress.forEach(p => {
    const num = getFundNumber(p.projectDetails.category);
    if (Number.isFinite(num) && order.includes(num)) {
      buckets[num as 10 | 11 | 12 | 13].push(p);
    } else {
      others.push(p);
    }
  });
  order.forEach(n =>
    buckets[n].sort((a, b) => a.projectDetails.title.localeCompare(b.projectDetails.title))
  );
  others.sort((a, b) => a.projectDetails.title.localeCompare(b.projectDetails.title));
  const sortedProgressProjects = [...order.flatMap(n => buckets[n]), ...others];

  return (
    <>
      <div className={styles.container}>

      <div className={styles.chartsContainer}>
        <div className={styles.timerWrapper}>
          <div className={styles.chartSection}>
            <CountUpTimer startDate={new Date('2024-03-19')} title="Catalyst Funded Proposer Since" />
          </div>
        </div>
        <div className={styles.chartsGrid}>
          <div className={styles.chartSection}>
            <CatalystProposalsDonut
              totalProposals={stats.totalProjects}
              completedProposals={stats.completedProjects}
            />
          </div>
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
      <div className={styles.timestamp}>Last updated: {formatDate(data.timestamp)}</div>
      </div>
    </>
  );
}
