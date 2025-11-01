import { useRouter } from 'next/router';
import { useData } from '../../contexts/DataContext';
import styles from '../../styles/ProposalDetail.module.css';
import SectionTitle from '../../components/SectionTitle';
import { useEffect, useState, useMemo } from 'react';
import { CatalystProject } from '../../types';
import Link from 'next/link';
import { ProposalDetails } from '../../components/ProposalDetails';
import { ExternalLinks } from '../../components/ExternalLinks';
import { MilestoneProgressBars } from '../../components/MilestoneProgressBars';

const getFundingRound = (category: string): string => {
  const match = category.match(/Fund \d+/i);
  return match ? match[0] : category;
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

export default function ProposalDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { catalystData, isLoading, error } = useData();
  const [proposal, setProposal] = useState<CatalystProject | null>(null);

  useEffect(() => {
    if (catalystData?.catalystData && id) {
      const foundProposal = catalystData.catalystData.projects.find(
        p => p.projectDetails.project_id.toString() === id
      );
      setProposal(foundProposal || null);
    }
  }, [catalystData, id]);

  // Extract milestones from the proposal's milestones_content
  const milestones = useMemo(() => {
    if (!proposal?.projectDetails.milestones_content) return [];
    return Object.values(proposal.projectDetails.milestones_content);
  }, [proposal?.projectDetails.milestones_content]);

  if (isLoading) {
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
    <>
      <SectionTitle
        title={<>{proposal.projectDetails.title}</>}
        subtitle={`${getFundingRound(proposal.projectDetails.category)} Proposal`}
      />
      <div className={styles.container}>
        <Link href="/catalyst-proposals" className={styles.backLink}>
          ← Back to Proposals
        </Link>

        <div className={styles.content}>
        <div className={styles.mainInfo}>
          {proposal && (
            <ProposalDetails
              details={{
                projectId: proposal.projectDetails.project_id.toString(),
                name: proposal.projectDetails.title,
                link: proposal.projectDetails.url,
                milestonesLink: `https://milestones.projectcatalyst.io/projects/${proposal.projectDetails.project_id}`,
                fundingCategory: proposal.projectDetails.category,
                proposalBudget: `${proposal.projectDetails.budget} ₳`,
                status: getProjectStatus(
                  proposal.milestonesCompleted,
                  proposal.projectDetails.milestones_qty
                ),
                milestonesCompleted: `${proposal.milestonesCompleted}/${proposal.projectDetails.milestones_qty}`,
                fundsDistributed: `${proposal.projectDetails.funds_distributed} of ${proposal.projectDetails.budget}`,
                fundingProgress: '',
              }}
              budget={proposal.projectDetails.budget}
              distributed={proposal.projectDetails.funds_distributed}
              yesVotes={proposal.projectDetails.voting.yes_votes_count}
              uniqueVoters={proposal.projectDetails.voting.unique_wallets}
              milestonesCompleted={proposal.milestonesCompleted}
              totalMilestones={proposal.projectDetails.milestones_qty}
            />
          )}

          {milestones.length > 0 ? (
            <>
              <MilestoneProgressBars
                milestones={milestones}
                completedCount={proposal.milestonesCompleted}
                projectTitle={proposal.projectDetails.title}
                fundingRound={getFundingRound(proposal.projectDetails.category)}
                totalMilestones={proposal.projectDetails.milestones_qty}
              />
            </>
          ) : (
            <div className={styles.noMilestones}>No milestone reports found</div>
          )}

          <ExternalLinks
            projectLink={proposal.projectDetails.url}
            milestonesLink={`https://milestones.projectcatalyst.io/projects/${proposal.projectDetails.project_id}`}
          />
        </div>
      </div>
      </div>
    </>
  );
}
