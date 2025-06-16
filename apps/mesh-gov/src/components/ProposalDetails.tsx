import { ProposalDetails as ProposalDetailsType } from '../utils/proposals';
import styles from './ProposalDetails.module.css';

interface Props {
    details: ProposalDetailsType;
    budget: number;
    distributed: number;
    yesVotes: number;
    uniqueVoters: number;
    milestonesCompleted: number;
    totalMilestones: number;
}

const formatAda = (amount: number): string => {
    return new Intl.NumberFormat('en-US').format(amount);
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
    return (
        <div className={styles.proposalDetails}>
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>About this Proposal</h2>
                <div className={styles.fundingCategory}>
                    <span className={styles.label}>Category:</span>
                    <span className={styles.value}>{details.fundingCategory}</span>
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

            {details.description && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Description</h2>
                    <div className={styles.description}>
                        {details.description}
                    </div>
                </div>
            )}
        </div>
    );
} 