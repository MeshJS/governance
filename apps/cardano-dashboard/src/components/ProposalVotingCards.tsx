// components/ProposalVotingCards.tsx
import { useMemo } from 'react';
import styles from '@/styles/ProposalVotingCards.module.css';
import { GovernanceProposal, MetaJson } from 'types/governance';
import { formatTypeLabel, buildMonochromeScale } from '@/utils/typeStyles';

export interface ProposalVotingCardsProps {
    proposals: GovernanceProposal[];
}

// Use readable labels dynamically and fallback class name per CSS module for badge background

export default function ProposalVotingCards({ proposals }: ProposalVotingCardsProps) {
    const colorScale = useMemo(() => {
        const keys = proposals.map(p => p.proposal_type);
        return buildMonochromeScale(keys);
    }, [proposals]);
    return (
        <div className={styles.cardsContainer}>
            {proposals.map((proposal) => {
                const metaJson = proposal.meta_json as MetaJson & { body?: { title?: string } };
                const title = metaJson?.body?.title || 'Untitled Proposal';
                const type = proposal.proposal_type;

                // Calculate totals for each group
                const drepTotal = proposal.drep_yes_votes_cast + proposal.drep_no_votes_cast + proposal.drep_abstain_votes_cast;
                const poolTotal = proposal.pool_yes_votes_cast + proposal.pool_no_votes_cast + proposal.pool_abstain_votes_cast;
                const committeeTotal = proposal.committee_yes_votes_cast + proposal.committee_no_votes_cast + proposal.committee_abstain_votes_cast;

                return (
                    <div key={proposal.proposal_id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.typeBadge} style={{ background: colorScale[type]?.gradient }}>
                                {formatTypeLabel(type)}
                            </span>
                            <h3 className={styles.cardTitle}>{title}</h3>
                        </div>

                        <div className={styles.epochInfo}>
                            <span>Proposed: Epoch {proposal.proposed_epoch}</span>
                            <span>Expires: Epoch {proposal.expiration}</span>
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