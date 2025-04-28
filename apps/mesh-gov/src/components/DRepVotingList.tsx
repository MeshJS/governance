import { useState } from 'react';
import styles from '../styles/Voting.module.css';
import { formatDate } from '../utils/dateUtils';
import ProposalModal from './ProposalModal';

interface VoteData {
    proposalId: string;
    proposalTxHash: string;
    proposalIndex: number;
    voteTxHash: string;
    blockTime: string;
    vote: 'Yes' | 'No' | 'Abstain';
    metaUrl: string | null;
    metaHash: string | null;
    proposalTitle: string;
    proposalType: string;
    proposedEpoch: number;
    expirationEpoch: number;
    rationale: string;
}

interface DRepVotingListProps {
    votes: VoteData[];
    onRowClick?: (proposalId: string) => void;
}

export default function DRepVotingList({ votes, onRowClick }: DRepVotingListProps) {
    const [selectedProposal, setSelectedProposal] = useState<VoteData | null>(null);

    const handleCardClick = (vote: VoteData, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedProposal(vote);
    };

    return (
        <>
            <div className={styles.listContainer}>
                <div className={styles.list}>
                    {votes.map((vote) => (
                        <div
                            key={vote.proposalId}
                            className={styles.item}
                            onClick={(e) => handleCardClick(vote, e)}
                        >
                            <div className={styles.header}>
                                <h3 className={styles.title}>{vote.proposalTitle}</h3>
                                <span className={`${styles.vote} ${styles[vote.vote.toLowerCase()]}`}>
                                    {vote.vote}
                                </span>
                            </div>
                            <span className={styles.type}>{vote.proposalType}</span>
                            <p className={styles.rationale}>{vote.rationale}</p>
                            <div className={styles.meta}>
                                <div>
                                    <span>Proposed</span>
                                    <strong>Epoch {vote.proposedEpoch}</strong>
                                </div>
                                <div>
                                    <span>Expires</span>
                                    <strong>Epoch {vote.expirationEpoch}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedProposal && (
                <ProposalModal
                    proposal={selectedProposal}
                    onClose={() => setSelectedProposal(null)}
                />
            )}

            {votes.length === 0 && (
                <div className={styles.empty}>No votes found</div>
            )}
        </>
    );
} 