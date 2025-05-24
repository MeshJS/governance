// components/ProposalVotingCards.tsx
import styles from '@/styles/ProposalVotingCards.module.css';

interface MetaJson {
    body?: {
        title?: string;
    };
}

interface ProposalVotingCardsProps {
    proposals: Array<{
        proposal_id: string;
        proposal_type: string;
        meta_json: MetaJson | null;
        drep_yes_votes_cast: number;
        drep_no_votes_cast: number;
        drep_abstain_votes_cast: number;
        pool_yes_votes_cast: number;
        pool_no_votes_cast: number;
        pool_abstain_votes_cast: number;
        committee_yes_votes_cast: number;
        committee_no_votes_cast: number;
        committee_abstain_votes_cast: number;
    }>;
}

const TYPE_LABELS = {
    InfoAction: 'Info Action',
    ParameterChange: 'Parameter Change',
    NewConstitution: 'New Constitution',
    HardForkInitiation: 'Hard Fork'
};

const TYPE_CLASS = {
    InfoAction: 'infoAction',
    ParameterChange: 'parameterChange',
    NewConstitution: 'newConstitution',
    HardForkInitiation: 'hardFork'
};

export default function ProposalVotingCards({ proposals }: ProposalVotingCardsProps) {
    return (
        <div className={styles.cardsContainer}>
            {proposals.map((proposal) => {
                const title = proposal.meta_json?.body?.title || 'Untitled Proposal';
                const type = proposal.proposal_type;

                // Calculate totals for each group
                const drepTotal = proposal.drep_yes_votes_cast + proposal.drep_no_votes_cast + proposal.drep_abstain_votes_cast;
                const poolTotal = proposal.pool_yes_votes_cast + proposal.pool_no_votes_cast + proposal.pool_abstain_votes_cast;
                const committeeTotal = proposal.committee_yes_votes_cast + proposal.committee_no_votes_cast + proposal.committee_abstain_votes_cast;

                return (
                    <div key={proposal.proposal_id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={`${styles.typeBadge} ${styles[TYPE_CLASS[type as keyof typeof TYPE_CLASS]]}`}>
                                {TYPE_LABELS[type as keyof typeof TYPE_LABELS]}
                            </span>
                            <h3 className={styles.cardTitle}>{title}</h3>
                        </div>

                        <div className={styles.votingGroups}>
                            {/* DRep Votes */}
                            <div className={styles.votingGroup}>
                                <h4 className={styles.groupTitle}>DRep Votes</h4>
                                <div className={styles.voteBars}>
                                    <div className={styles.voteBar}>
                                        <div
                                            className={`${styles.barSegment} ${styles.yes}`}
                                            style={{ width: `${(proposal.drep_yes_votes_cast / drepTotal) * 100}%` }}
                                        />
                                        <div
                                            className={`${styles.barSegment} ${styles.no}`}
                                            style={{ width: `${(proposal.drep_no_votes_cast / drepTotal) * 100}%` }}
                                        />
                                        <div
                                            className={`${styles.barSegment} ${styles.abstain}`}
                                            style={{ width: `${(proposal.drep_abstain_votes_cast / drepTotal) * 100}%` }}
                                        />
                                    </div>
                                    <div className={styles.voteCounts}>
                                        <span className={styles.voteCount}>
                                            <span className={`${styles.voteDot} ${styles.yes}`}></span>
                                            Yes: {proposal.drep_yes_votes_cast}
                                        </span>
                                        <span className={styles.voteCount}>
                                            <span className={`${styles.voteDot} ${styles.no}`}></span>
                                            No: {proposal.drep_no_votes_cast}
                                        </span>
                                        <span className={styles.voteCount}>
                                            <span className={`${styles.voteDot} ${styles.abstain}`}></span>
                                            Abstain: {proposal.drep_abstain_votes_cast}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Pool Votes */}
                            <div className={styles.votingGroup}>
                                <h4 className={styles.groupTitle}>Pool Votes</h4>
                                <div className={styles.voteBars}>
                                    <div className={styles.voteBar}>
                                        <div
                                            className={`${styles.barSegment} ${styles.yes}`}
                                            style={{ width: `${(proposal.pool_yes_votes_cast / poolTotal) * 100}%` }}
                                        />
                                        <div
                                            className={`${styles.barSegment} ${styles.no}`}
                                            style={{ width: `${(proposal.pool_no_votes_cast / poolTotal) * 100}%` }}
                                        />
                                        <div
                                            className={`${styles.barSegment} ${styles.abstain}`}
                                            style={{ width: `${(proposal.pool_abstain_votes_cast / poolTotal) * 100}%` }}
                                        />
                                    </div>
                                    <div className={styles.voteCounts}>
                                        <span className={styles.voteCount}>
                                            <span className={`${styles.voteDot} ${styles.yes}`}></span>
                                            Yes: {proposal.pool_yes_votes_cast}
                                        </span>
                                        <span className={styles.voteCount}>
                                            <span className={`${styles.voteDot} ${styles.no}`}></span>
                                            No: {proposal.pool_no_votes_cast}
                                        </span>
                                        <span className={styles.voteCount}>
                                            <span className={`${styles.voteDot} ${styles.abstain}`}></span>
                                            Abstain: {proposal.pool_abstain_votes_cast}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Committee Votes */}
                            <div className={styles.votingGroup}>
                                <h4 className={styles.groupTitle}>Committee Votes</h4>
                                <div className={styles.voteBars}>
                                    <div className={styles.voteBar}>
                                        <div
                                            className={`${styles.barSegment} ${styles.yes}`}
                                            style={{ width: `${(proposal.committee_yes_votes_cast / committeeTotal) * 100}%` }}
                                        />
                                        <div
                                            className={`${styles.barSegment} ${styles.no}`}
                                            style={{ width: `${(proposal.committee_no_votes_cast / committeeTotal) * 100}%` }}
                                        />
                                        <div
                                            className={`${styles.barSegment} ${styles.abstain}`}
                                            style={{ width: `${(proposal.committee_abstain_votes_cast / committeeTotal) * 100}%` }}
                                        />
                                    </div>
                                    <div className={styles.voteCounts}>
                                        <span className={styles.voteCount}>
                                            <span className={`${styles.voteDot} ${styles.yes}`}></span>
                                            Yes: {proposal.committee_yes_votes_cast}
                                        </span>
                                        <span className={styles.voteCount}>
                                            <span className={`${styles.voteDot} ${styles.no}`}></span>
                                            No: {proposal.committee_no_votes_cast}
                                        </span>
                                        <span className={styles.voteCount}>
                                            <span className={`${styles.voteDot} ${styles.abstain}`}></span>
                                            Abstain: {proposal.committee_abstain_votes_cast}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
} 