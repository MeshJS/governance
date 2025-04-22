import { Vote } from '../types/vote';
import styles from '../styles/Dashboard.module.css';

interface VotingTableCardProps {
    votes: Vote[];
}

export default function VotingTableCard({ votes }: VotingTableCardProps) {
    // Calculate totals
    const totalVotes = votes.length;
    const yesVotes = votes.filter(vote => vote.vote === 'yes').length;
    const noVotes = votes.filter(vote => vote.vote === 'no').length;
    const abstainVotes = votes.filter(vote => vote.vote === 'abstain').length;

    const getPercentage = (count: number) => {
        if (totalVotes === 0) return 33.33; // Equal distribution when no votes
        return (count / totalVotes) * 100;
    };

    return (
        <div className={styles.progressBars}>
            <div className={styles.progressBar}>
                <div 
                    className={`${styles.progressFill} ${styles.yes}`}
                    style={{ width: `${getPercentage(yesVotes)}%` }}
                />
            </div>
            <div className={styles.progressBar}>
                <div 
                    className={`${styles.progressFill} ${styles.no}`}
                    style={{ width: `${getPercentage(noVotes)}%` }}
                />
            </div>
            <div className={styles.progressBar}>
                <div 
                    className={`${styles.progressFill} ${styles.abstain}`}
                    style={{ width: `${getPercentage(abstainVotes)}%` }}
                />
            </div>
        </div>
    );
} 