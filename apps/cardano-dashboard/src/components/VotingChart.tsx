import React, { useState, useRef } from 'react';
import styles from '@/styles/VotingChart.module.css';
import { GovernanceProposal } from '../../types/governance';

type VoteType = 'spo' | 'drep' | 'committee';

interface VotingChartProps {
    type: VoteType;
    proposals: Array<GovernanceProposal>;
}

interface TooltipData {
    proposalId: string;
    title: string;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    yesPower?: number;
    noPower?: number;
    abstainPower?: number;
    yesPercentage: number;
    noPercentage: number;
    abstainPercentage: number;
}

export default function VotingChart({ type, proposals }: VotingChartProps) {
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const chartRef = useRef<HTMLDivElement>(null);

    const getVoteProperties = (proposal: VotingChartProps['proposals'][0]) => {
        if (type === 'committee') {
            return {
                yesVotes: proposal.committee_yes_votes_cast,
                noVotes: proposal.committee_no_votes_cast,
                abstainVotes: proposal.committee_abstain_votes_cast,
                yesPercentage: proposal.committee_yes_pct || 0,
                noPercentage: proposal.committee_no_pct || 0
            } as const;
        }

        const prefix = type === 'spo' ? 'pool' : 'drep';
        return {
            yesVotes: proposal[`${prefix}_yes_votes_cast`] as number,
            noVotes: proposal[`${prefix}_no_votes_cast`] as number,
            abstainVotes: proposal[`${prefix}_abstain_votes_cast`] as number,
            yesPower: proposal[`${prefix}_yes_vote_power`] as string | number,
            noPower: proposal[`${prefix}_no_vote_power`] as string | number,
            abstainPower: proposal[`${prefix}_active_abstain_vote_power`] as string | number,
            yesPercentage: proposal[`${prefix}_yes_pct`] || 0,
            noPercentage: proposal[`${prefix}_no_pct`] || 0
        };
    };

    const handleBarHover = (e: React.MouseEvent, proposal: VotingChartProps['proposals'][0]) => {
        const voteProps = getVoteProperties(proposal);

        const parseVotePower = (power: string | number) => {
            if (typeof power === 'string') {
                return parseFloat(power) || 0;
            }
            return power || 0;
        };

        const calculatePercentages = () => {
            if (type === 'committee') {
                const committeeProps = voteProps as { yesPercentage: number; noPercentage: number };
                return {
                    yesPercentage: committeeProps.yesPercentage,
                    noPercentage: committeeProps.noPercentage,
                    abstainPercentage: 0
                };
            }
            const powerProps = voteProps as typeof voteProps & { yesPercentage: number; noPercentage: number };
            return {
                yesPercentage: powerProps.yesPercentage,
                noPercentage: powerProps.noPercentage,
                abstainPercentage: 0
            };
        };

        const percentages = calculatePercentages();

        const tooltipData: TooltipData = {
            proposalId: proposal.proposal_id,
            title: proposal.meta_json?.body && typeof proposal.meta_json.body === 'object' && 'title' in proposal.meta_json.body
                ? proposal.meta_json.body.title as string
                : proposal.proposal_id.length > 20
                    ? `${proposal.proposal_id.slice(0, 10)}...${proposal.proposal_id.slice(-10)}`
                    : proposal.proposal_id,
            yesVotes: voteProps.yesVotes,
            noVotes: voteProps.noVotes,
            abstainVotes: voteProps.abstainVotes,
            yesPercentage: percentages.yesPercentage,
            noPercentage: percentages.noPercentage,
            abstainPercentage: percentages.abstainPercentage
        };

        if (type !== 'committee' && 'yesPower' in voteProps) {
            const powerProps = voteProps as typeof voteProps & { yesPower: string | number; noPower: string | number; abstainPower: string | number };
            tooltipData.yesPower = parseVotePower(powerProps.yesPower);
            tooltipData.noPower = parseVotePower(powerProps.noPower);
            tooltipData.abstainPower = parseVotePower(powerProps.abstainPower);
        }

        setTooltipData(tooltipData);

        // Calculate tooltip position
        const rect = e.currentTarget.getBoundingClientRect();
        const containerRect = chartRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const tooltipWidth = 300; // Minimum width from CSS
        const tooltipHeight = 150; // Approximate height
        const padding = 20; // Padding from container edges

        // Calculate position relative to the container
        let x = rect.left - containerRect.left + (rect.width / 2);
        let y = rect.top - containerRect.top;

        // Adjust horizontal position if tooltip would go off container
        if (x + (tooltipWidth / 2) > containerRect.width - padding) {
            x = containerRect.width - (tooltipWidth / 2) - padding;
        } else if (x - (tooltipWidth / 2) < padding) {
            x = (tooltipWidth / 2) + padding;
        }

        // Adjust vertical position if tooltip would go off container
        if (y - tooltipHeight < padding) {
            // Position below the bar if not enough space above
            y = rect.bottom - containerRect.top + padding;
        } else {
            // Position above the bar
            y = y - tooltipHeight - padding;
        }

        // Ensure tooltip stays within container bounds
        y = Math.max(padding, Math.min(y, containerRect.height - tooltipHeight - padding));

        setTooltipPosition({ x, y });
    };

    const handleBarLeave = () => {
        setTooltipData(null);
    };

    const getChartTitle = () => {
        switch (type) {
            case 'spo':
                return 'SPO Voting Activity';
            case 'drep':
                return 'DRep Voting Activity';
            case 'committee':
                return 'CC Voting Activity';
        }
    };

    return (
        <div className={styles.chartContainer} ref={chartRef}>
            <h2>{getChartTitle()}</h2>
            <div className={styles.chart}>
                {proposals.map((proposal) => {
                    const voteProps = getVoteProperties(proposal);
                    const percentages = type === 'committee'
                        ? { yesPercentage: voteProps.yesPercentage, noPercentage: voteProps.noPercentage, abstainPercentage: 0 }
                        : { yesPercentage: (voteProps as { yesPercentage: number; noPercentage: number }).yesPercentage, noPercentage: (voteProps as { yesPercentage: number; noPercentage: number }).noPercentage, abstainPercentage: 0 };

                    return (
                        <div
                            key={proposal.proposal_id}
                            className={styles.proposalBar}
                            onMouseEnter={(e) => handleBarHover(e, proposal)}
                            onMouseLeave={handleBarLeave}
                        >
                            <div className={styles.barContainer}>
                                <div
                                    className={`${styles.barSegment} ${styles.yes}`}
                                    style={{
                                        height: `${percentages.yesPercentage}%`,
                                        minHeight: '4px'
                                    }}
                                />
                                <div
                                    className={`${styles.barSegment} ${styles.no}`}
                                    style={{
                                        height: `${percentages.noPercentage}%`,
                                        minHeight: '4px'
                                    }}
                                />
                                <div
                                    className={`${styles.barSegment} ${styles.abstain}`}
                                    style={{
                                        height: `${percentages.abstainPercentage}%`,
                                        minHeight: '4px'
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            {tooltipData && (
                <div
                    className={styles.tooltip}
                    style={{
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className={styles.tooltipTitle}>{tooltipData.title}</div>
                    <div className={styles.tooltipContent}>
                        <div className={styles.tooltipRow}>
                            <span className={styles.yes}>Yes</span>
                            <span>{tooltipData.yesVotes} votes ({tooltipData.yesPercentage.toFixed(1)}%)</span>
                            {type !== 'committee' && tooltipData.yesPower !== undefined && (
                                <span>₳ {(tooltipData.yesPower / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            )}
                        </div>
                        <div className={styles.tooltipRow}>
                            <span className={styles.no}>No</span>
                            <span>{tooltipData.noVotes} votes ({tooltipData.noPercentage.toFixed(1)}%)</span>
                            {type !== 'committee' && tooltipData.noPower !== undefined && (
                                <span>₳ {(tooltipData.noPower / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            )}
                        </div>
                        <div className={styles.tooltipRow}>
                            <span className={styles.abstain}>Abstain</span>
                            <span>{tooltipData.abstainVotes} votes</span>
                            {type !== 'committee' && tooltipData.abstainPower !== undefined && (
                                <span>₳ {(tooltipData.abstainPower / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 