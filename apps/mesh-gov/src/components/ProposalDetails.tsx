import { useState } from 'react';
import { ProposalDetails as ProposalDetailsType, PROPOSAL_OBJECTIVES } from '../utils/proposals';
import styles from './ProposalDetails.module.css';
import { ProposalFullContentModal } from './ProposalFullContentModal';

interface Props {
    details: ProposalDetailsType;
    budget: number;
    distributed: number;
    yesVotes: number;
    uniqueVoters: number;
    milestonesCompleted: number;
    totalMilestones: number;
}

const formatAda = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
};

export function ProposalDetails({ 
    details,
    budget,
    distributed,
    yesVotes,
    uniqueVoters,
    milestonesCompleted,
    totalMilestones
}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const objective = PROPOSAL_OBJECTIVES[details.projectId];

    return (
        <div className={styles.proposalDetails}>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>About this Proposal</h2>
                    <div className={styles.projectId}>
                        Project ID: {details.projectId}
                    </div>
                </div>

                <div className={styles.statusAndCategory}>
                    <div className={`${styles.status} ${styles[details.status.toLowerCase().replace(' ', '')]}`}>
                        {details.status}
                    </div>
                    <div className={styles.categoryTag}>
                        {details.fundingCategory}
                    </div>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <h3>Budget</h3>
                        <div className={styles.statValue}>{formatAda(budget)} ₳</div>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Distributed</h3>
                        <div className={styles.statValue}>{formatAda(distributed)} ₳</div>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Yes Votes</h3>
                        <div className={styles.statValue}>{formatAda(yesVotes)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Unique Voters</h3>
                        <div className={styles.statValue}>{uniqueVoters}</div>
                    </div>
                </div>

                {details.finished && (
                    <div className={styles.finishedDate}>
                        <span className={styles.label}>Finished:</span>
                        <span className={styles.value}>{details.finished}</span>
                    </div>
                )}
            </div>

            {objective && (
                <div className={styles.section}>
                    <div className={styles.objectiveHeader}>
                        <h2 className={styles.sectionTitle}>Objective</h2>
                        <button 
                            className={styles.readFullProposalButton}
                            onClick={() => setIsModalOpen(true)}
                        >
                            Read Full Proposal
                        </button>
                    </div>
                    <div className={styles.objectiveContent}>
                        <p>{objective}</p>
                    </div>
                </div>
            )}

            {details.description && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Description</h2>
                    <div className={styles.description}>
                        {details.description}
                    </div>
                </div>
            )}

            <ProposalFullContentModal 
                projectId={details.projectId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
} 