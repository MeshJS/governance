import { useData } from '../contexts/DataContext';
import styles from '../styles/Dashboard.module.css';
import StatusCard from '../components/StatusCard';
import { useState, useEffect } from 'react';
import { CatalystProject, GovernanceVote } from '../types';
import Image from 'next/image';

// Simple number formatting function
const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    }).format(num);
};

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
                                    style={{ width: `${project.progress}%` }}
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
const VotingTableCard = ({ votes, delegationData }: { votes: GovernanceVote[], delegationData: any }) => {
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
                    Mesh DRep votes at Cardano&rsquo;s onchain Governance
                </div>
                <div className={styles.delegationInfo}>
                    <div className={styles.delegationRow}>
                        <span className={styles.delegationLabel}>Total Delegators:</span>
                        <span className={styles.delegationValue}>{delegationData?.timeline?.total_delegators || 0}</span>
                    </div>
                    <div className={styles.delegationRow}>
                        <span className={styles.delegationLabel}>Total ADA Delegated:</span>
                        <span className={styles.delegationValue}>{formatNumber(delegationData?.timeline?.total_amount_ada || 0)} ₳</span>
                    </div>
                </div>
                <div className={styles.progressBars}>
                    <div className={styles.progressRow}>
                        <span className={styles.progressLabel}>Yes</span>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progressFill} ${styles.yes}`}
                                style={{ width: `${(voteStats.yes / voteStats.total) * 100}%` }}
                            ></div>
                        </div>
                        <span className={styles.progressValue}>{voteStats.yes}</span>
                    </div>
                    <div className={styles.progressRow}>
                        <span className={styles.progressLabel}>No</span>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progressFill} ${styles.no}`}
                                style={{ width: `${(voteStats.no / voteStats.total) * 100}%` }}
                            ></div>
                        </div>
                        <span className={styles.progressValue}>{voteStats.no}</span>
                    </div>
                    <div className={styles.progressRow}>
                        <span className={styles.progressLabel}>Abstain</span>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progressFill} ${styles.abstain}`}
                                style={{ width: `${(voteStats.abstain / voteStats.total) * 100}%` }}
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
    const { meshData, catalystData, drepVotingData, isLoading, error } = useData();
    const [filteredVotes, setFilteredVotes] = useState<GovernanceVote[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<CatalystProject[]>([]);

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
    console.log('meshData', meshData, drepVotingData, catalystData);
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
                        <VotingTableCard votes={filteredVotes} delegationData={drepVotingData?.delegationData} />
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