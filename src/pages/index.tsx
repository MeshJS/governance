import { useData } from '../contexts/DataContext';
import styles from '../styles/Dashboard.module.css';
import { useRouter } from 'next/router';
import PageHeader from '../components/PageHeader';
import StatusCard, { StatusIconType } from '../components/StatusCard';
import SearchFilterBar from '../components/SearchFilterBar';
import { dashboardFilterConfig } from '../config/filterConfig';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CatalystProject, GovernanceVote } from '../types';
import Image from 'next/image';

// Simple number formatting function
const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
};

// Format date to a readable format
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
};

// Extended project interface with completion percentage
interface ProjectWithCompletion extends CatalystProject {
    completionPercentage: number;
}

// Component to display compact catalyst proposals overview
const CatalystProposalsCard = ({ projects }: { projects: CatalystProject[] }) => {
    // Calculate milestones progress for each project
    const projectProgress = projects.map(project => ({
        title: project.projectDetails.title,
        progress: project.projectDetails.milestones_qty > 0
            ? Math.round((project.milestonesCompleted / project.projectDetails.milestones_qty) * 100)
            : 0
    }));

    return (
        <div className={`${styles.statusItem} ${styles.catalystProposalsCard}`}>
            <div className={styles.statusItemContent}>
                <div className={styles.description}>
                    Project Milestones Progress
                </div>
                <div className={styles.progressBars}>
                    {projectProgress.map((project, index) => (
                        <div key={index} className={styles.progressRow}>
                            <span className={styles.progressLabel}>{project.title}</span>
                            <div className={styles.progressBar}>
                                <div 
                                    className={styles.progressFill}
                                    style={{width: `${project.progress}%`}}
                                />
                            </div>
                            <span className={styles.progressValue}>{project.progress}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Component to display voting table
const VotingTableCard = ({ votes }: { votes: GovernanceVote[] }) => {
    // Calculate vote stats
    const voteStats = {
        total: votes.length,
        yes: votes.filter(v => v.vote === 'Yes').length,
        no: votes.filter(v => v.vote === 'No').length,
        abstain: votes.filter(v => v.vote === 'Abstain').length,
    };

    return (
        <div className={`${styles.statusItem} ${styles.catalystProposalsCard}`}>
            <div className={styles.statusItemContent}>
                <div className={styles.description}>
                    Mesh DRep votes at Cardano's onchain Governance
                </div>
                <div className={styles.progressBars}>
                    <div className={styles.progressRow}>
                        <span className={styles.progressLabel}>Yes</span>
                        <div className={styles.progressBar}>
                            <div 
                                className={`${styles.progressFill} ${styles.yes}`} 
                                style={{width: `${(voteStats.yes / voteStats.total) * 100}%`}}
                            ></div>
                        </div>
                        <span className={styles.progressValue}>{voteStats.yes}</span>
                    </div>
                    <div className={styles.progressRow}>
                        <span className={styles.progressLabel}>No</span>
                        <div className={styles.progressBar}>
                            <div 
                                className={`${styles.progressFill} ${styles.no}`} 
                                style={{width: `${(voteStats.no / voteStats.total) * 100}%`}}
                            ></div>
                        </div>
                        <span className={styles.progressValue}>{voteStats.no}</span>
                    </div>
                    <div className={styles.progressRow}>
                        <span className={styles.progressLabel}>Abstain</span>
                        <div className={styles.progressBar}>
                            <div 
                                className={`${styles.progressFill} ${styles.abstain}`} 
                                style={{width: `${(voteStats.abstain / voteStats.total) * 100}%`}}
                            ></div>
                        </div>
                        <span className={styles.progressValue}>{voteStats.abstain}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { meshData, catalystData, drepVotingData, isLoading, error, refetchData } = useData();
    const router = useRouter();
    const [filteredVotes, setFilteredVotes] = useState<GovernanceVote[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<CatalystProject[]>([]);
    const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
    
    // Update filtered data when source data changes
    useEffect(() => {
        if (drepVotingData?.votes) {
            setFilteredVotes(drepVotingData.votes);
        }
    }, [drepVotingData]);

    useEffect(() => {
        if (catalystData?.catalystData?.projects) {
            setFilteredProjects(catalystData.catalystData.projects);
        }
    }, [catalystData]);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Error: {error}</div>
            </div>
        );
    }

    // Calculate totals
    const totalProposals = catalystData?.catalystData?.projects?.length || 0;
    const completedProposals = catalystData?.catalystData?.projects?.filter(
        (p: CatalystProject) => p.projectDetails.status === 'Completed'
    ).length || 0;
    const totalVotes = drepVotingData?.votes?.length || 0;
    const allVotes = drepVotingData?.votes || [];

    // SDK download stats - get last month's downloads
    const monthlyDownloads = meshData?.currentStats?.npm?.downloads?.last_month || 0;
    const githubUsage = meshData?.currentStats?.github?.core_in_package_json || 0;
    const activeContributors = meshData?.currentStats?.contributors?.unique_count || 0;

    // Calculate project categories
    const categories: Record<string, number> = {};
    catalystData?.catalystData?.projects?.forEach((project: CatalystProject) => {
        const category = project.projectDetails.category;
        categories[category] = (categories[category] || 0) + 1;
    });

    // Get projects closest to completion (but not completed)
    const projectsNearCompletion = catalystData?.catalystData?.projects
        ?.filter((project: CatalystProject) =>
            project.projectDetails.status !== 'Completed' &&
            project.projectDetails.milestones_qty > 0 &&
            project.milestonesCompleted > 0
        )
        .map((project: CatalystProject): ProjectWithCompletion => ({
            ...project,
            completionPercentage: Math.round((project.milestonesCompleted / project.projectDetails.milestones_qty) * 100)
        }))
        .sort((a: ProjectWithCompletion, b: ProjectWithCompletion) => b.completionPercentage - a.completionPercentage)
        .slice(0, 3) || [];

    // All catalyst projects for the overview card
    const allProjects = catalystData?.catalystData?.projects || [];

    // Search functionality
    const handleSearch = (searchTerm: string, filters: Record<string, string>) => {
        // Clear filters if empty search
        if (!searchTerm && Object.keys(filters).length === 0) {
            setFilteredVotes(drepVotingData?.votes || []);
            setFilteredProjects(catalystData?.catalystData?.projects || []);
            setIsSearchActive(false);
            return;
        }

        setIsSearchActive(true);
        const searchType = filters.type || '';

        // Filter votes
        if (!searchType || searchType === 'vote') {
            const matchingVotes = drepVotingData?.votes?.filter((vote: GovernanceVote) => {
                return vote.proposalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    vote.proposalType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    vote.rationale.toLowerCase().includes(searchTerm.toLowerCase());
            }) || [];
            setFilteredVotes(matchingVotes);
        } else {
            setFilteredVotes([]);
        }

        // Filter catalyst proposals
        if (!searchType || searchType === 'proposal') {
            const matchingProjects = catalystData?.catalystData?.projects?.filter((project: CatalystProject) => {
                return project.projectDetails.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    project.projectDetails.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    project.projectDetails.status.toLowerCase().includes(searchTerm.toLowerCase());
            }) || [];
            setFilteredProjects(matchingProjects);
        } else {
            setFilteredProjects([]);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.mainHeader}>
                <Image
                    src="/mesh-white-txt.png"
                    alt="Mesh Logo"
                    width={300}
                    height={100}
                    className={styles.meshLogo}
                    priority
                />
            </header>

            <div className={styles.grid}>
                {/* Voting Activity Section */}
                <section className={`${styles.section} ${styles.votingActivity}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Voting Activity</h2>
                        <Image
                            src="/Cardano-RGB_Logo-Icon-White.png"
                            alt="Cardano Icon"
                            width={32}
                            height={32}
                            className={`${styles.cardIcon} ${styles.iconGreen}`}
                            priority
                        />
                    </div>
                    <div className={styles.sectionContent}>
                        <VotingTableCard votes={filteredVotes} />
                    </div>
                </section>

                {/* Catalyst Proposals Overview */}
                <section className={`${styles.section} ${styles.proposalsOverview}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Catalyst Proposals</h2>
                        <Image
                            src="/catalyst.png"
                            alt="Catalyst Icon"
                            width={32}
                            height={32}
                            className={`${styles.cardIcon} ${styles.iconBlue}`}
                            priority
                        />
                    </div>
                    <div className={styles.sectionContent}>
                        <CatalystProposalsCard projects={filteredProjects} />
                    </div>
                </section>

                {/* Downloads Section */}
                <section className={`${styles.section} ${styles.downloads}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Downloads</h2>
                        <Image
                            src="/download.png"
                            alt="Downloads Icon"
                            width={32}
                            height={32}
                            className={`${styles.cardIcon} ${styles.iconBlue}`}
                            priority
                        />
                    </div>
                    <div className={styles.sectionContent}>
                        <StatusCard
                            title="NPM Downloads"
                            value={formatNumber(monthlyDownloads)}
                            iconType="blue"
                            subtitle="Monthly package downloads"
                        />
                    </div>
                </section>

                {/* Projects Section */}
                <section className={`${styles.section} ${styles.useCases}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Projects</h2>
                        <Image
                            src="/projects.png"
                            alt="Projects Icon"
                            width={32}
                            height={32}
                            className={`${styles.cardIcon} ${styles.iconGreen}`}
                            priority
                        />
                    </div>
                    <div className={styles.sectionContent}>
                        <StatusCard
                            title="GitHub Usage"
                            value={formatNumber(githubUsage)}
                            iconType="green"
                            subtitle="Projects using Mesh"
                        />
                    </div>
                </section>

                {/* Contributors Section */}
                <section className={`${styles.section} ${styles.contributors}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Contributors</h2>
                        <Image
                            src="/ppl.png"
                            alt="Contributors Icon"
                            width={32}
                            height={32}
                            className={`${styles.cardIcon} ${styles.iconYellow}`}
                            priority
                        />
                    </div>
                    <div className={styles.sectionContent}>
                        <StatusCard
                            title="Active Contributors"
                            value={formatNumber(activeContributors)}
                            iconType="yellow"
                            subtitle="GitHub contributors"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
} 