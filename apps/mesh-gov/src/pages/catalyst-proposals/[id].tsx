import { useRouter } from 'next/router';
import { useData } from '../../contexts/DataContext';
import styles from '../../styles/ProposalDetail.module.css';
import PageHeader from '../../components/PageHeader';
import { useEffect, useState } from 'react';
import { CatalystProject } from '../../types';
import Link from 'next/link';
import { MilestoneList } from '../../components/MilestoneList';
import { MilestoneData } from '../../utils/milestones';
import { ProposalDetails } from '../../components/ProposalDetails';
import { ExternalLinks } from '../../components/ExternalLinks';
import { MilestoneProgressBars } from '../../components/MilestoneProgressBars';

const getFundingRound = (category: string): string => {
    const match = category.match(/Fund \d+/i);
    return match ? match[0] : category;
};

export default function ProposalDetail() {
    const router = useRouter();
    const { id } = router.query;
    const { catalystData, isLoading, error } = useData();
    const [proposal, setProposal] = useState<CatalystProject | null>(null);
    const [milestones, setMilestones] = useState<MilestoneData[]>([]);
    const [milestonesLoading, setMilestonesLoading] = useState(false);
    const [milestonesError, setMilestonesError] = useState<string | null>(null);

    useEffect(() => {
        if (catalystData?.catalystData && id) {
            const foundProposal = catalystData.catalystData.projects.find(
                p => p.projectDetails.project_id.toString() === id
            );
            setProposal(foundProposal || null);

            if (foundProposal) {
                // Fetch milestones
                setMilestonesLoading(true);
                setMilestonesError(null);
                
                fetch(`/api/milestones/${id}`)
                    .then(async response => {
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Received milestone data:', data);
                        setMilestones(data);
                    })
                    .catch(err => {
                        console.error('Error fetching milestones:', err);
                        setMilestonesError(err.message);
                    })
                    .finally(() => {
                        setMilestonesLoading(false);
                    });
            }
        }
    }, [catalystData, id]);

    if (isLoading || milestonesLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading proposal data...</div>
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

    if (!proposal) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Proposal not found</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Link href="/catalyst-proposals" className={styles.backLink}>
                ← Back to Proposals
            </Link>

            <PageHeader
                title={<>{proposal.projectDetails.title}</>}
                subtitle={`${getFundingRound(proposal.projectDetails.category)} Proposal`}
            />

            <div className={styles.content}>
                <div className={styles.mainInfo}>
                    <div className={styles.statusBar}>
                        <span className={`${styles.status} ${styles[proposal.projectDetails.status.toLowerCase().replace(' ', '')]}`}>
                            {proposal.projectDetails.status}
                        </span>
                        <div className={styles.projectId}>
                            Project ID: {proposal.projectDetails.project_id}
                        </div>
                    </div>

                    {proposal && (
                        <ProposalDetails 
                            details={{
                                projectId: proposal.projectDetails.project_id.toString(),
                                name: proposal.projectDetails.title,
                                link: proposal.projectDetails.url,
                                milestonesLink: `https://milestones.projectcatalyst.io/projects/${proposal.projectDetails.project_id}`,
                                fundingCategory: proposal.projectDetails.category,
                                proposalBudget: `${proposal.projectDetails.budget} ₳`,
                                status: proposal.projectDetails.status,
                                milestonesCompleted: `${proposal.milestonesCompleted}/${proposal.projectDetails.milestones_qty}`,
                                fundsDistributed: `${proposal.projectDetails.funds_distributed} of ${proposal.projectDetails.budget}`,
                                fundingProgress: ''
                            }}
                            budget={proposal.projectDetails.budget}
                            distributed={proposal.projectDetails.funds_distributed}
                            yesVotes={proposal.projectDetails.voting.yes_votes_count}
                            uniqueVoters={proposal.projectDetails.voting.unique_wallets}
                            milestonesCompleted={proposal.milestonesCompleted}
                            totalMilestones={proposal.projectDetails.milestones_qty}
                        />
                    )}

                    {milestonesError ? (
                        <div className={styles.error}>
                            Error loading milestones: {milestonesError}
                            <button 
                                className={styles.retryButton}
                                onClick={() => {
                                    setMilestonesError(null);
                                    setMilestonesLoading(true);
                                    fetch(`/api/milestones/${id}`)
                                        .then(async response => {
                                            if (!response.ok) {
                                                const errorData = await response.json();
                                                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                                            }
                                            return response.json();
                                        })
                                        .then(data => {
                                            console.log('Received milestone data:', data);
                                            setMilestones(data);
                                        })
                                        .catch(err => {
                                            console.error('Error fetching milestones:', err);
                                            setMilestonesError(err.message);
                                        })
                                        .finally(() => {
                                            setMilestonesLoading(false);
                                        });
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : milestones.length > 0 ? (
                        <>
                            <MilestoneProgressBars 
                                milestones={milestones}
                                completedCount={proposal.milestonesCompleted}
                                projectTitle={proposal.projectDetails.title}
                                fundingRound={getFundingRound(proposal.projectDetails.category)}
                                totalMilestones={proposal.projectDetails.milestones_qty}
                            />
                            <MilestoneList 
                                milestones={milestones} 
                                completedCount={proposal.milestonesCompleted} 
                            />
                        </>
                    ) : (
                        <div className={styles.noMilestones}>
                            No milestone reports found
                        </div>
                    )}

                    <ExternalLinks 
                        projectLink={proposal.projectDetails.url}
                        milestonesLink={`https://milestones.projectcatalyst.io/projects/${proposal.projectDetails.project_id}`}
                    />
                </div>
            </div>
        </div>
    );
} 