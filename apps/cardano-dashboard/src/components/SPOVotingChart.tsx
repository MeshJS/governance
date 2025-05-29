import React, { useState, useRef } from 'react';
import styles from '@/styles/SPOVotingChart.module.css';

interface SPOVotingChartProps {
    proposals: Array<{
        proposal_id: string;
        meta_json: {
            body?: {
                title?: string;
            };
        } | null;
        pool_yes_votes_cast: number;
        pool_no_votes_cast: number;
        pool_abstain_votes_cast: number;
        pool_yes_vote_power: string | number;
        pool_no_vote_power: string | number;
        pool_active_abstain_vote_power: string | number;
    }>;
}

interface TooltipData {
    proposalId: string;
    title: string;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    yesPower: number;
    noPower: number;
    abstainPower: number;
    yesPercentage: number;
    noPercentage: number;
    abstainPercentage: number;
}

export default function SPOVotingChart({ proposals }: SPOVotingChartProps) {
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const chartRef = useRef<HTMLDivElement>(null);

    const handleBarHover = (e: React.MouseEvent, proposal: SPOVotingChartProps['proposals'][0]) => {
        const totalVotes = proposal.pool_yes_votes_cast + proposal.pool_no_votes_cast + proposal.pool_abstain_votes_cast;

        const parseVotePower = (power: string | number) => {
            if (typeof power === 'string') {
                return parseFloat(power) || 0;
            }
            return power || 0;
        };

        setTooltipData({
            proposalId: proposal.proposal_id,
            title: proposal.meta_json?.body?.title || proposal.proposal_id,
            yesVotes: proposal.pool_yes_votes_cast,
            noVotes: proposal.pool_no_votes_cast,
            abstainVotes: proposal.pool_abstain_votes_cast,
            yesPower: parseVotePower(proposal.pool_yes_vote_power),
            noPower: parseVotePower(proposal.pool_no_vote_power),
            abstainPower: parseVotePower(proposal.pool_active_abstain_vote_power),
            yesPercentage: (proposal.pool_yes_votes_cast / totalVotes) * 100,
            noPercentage: (proposal.pool_no_votes_cast / totalVotes) * 100,
            abstainPercentage: (proposal.pool_abstain_votes_cast / totalVotes) * 100
        });

        // Calculate tooltip position
        const rect = e.currentTarget.getBoundingClientRect();
        const containerRect = chartRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const tooltipWidth = 300; // Minimum width from CSS
        const tooltipHeight = 150; // Approximate height

        // Calculate position relative to the container
        let x = rect.left - containerRect.left + (rect.width / 2);
        let y = rect.top - containerRect.top;

        // Adjust horizontal position if tooltip would go off container
        if (x + (tooltipWidth / 2) > containerRect.width) {
            x = containerRect.width - (tooltipWidth / 2);
        } else if (x - (tooltipWidth / 2) < 0) {
            x = tooltipWidth / 2;
        }

        // Adjust vertical position if tooltip would go off container
        if (y - tooltipHeight < 0) {
            y = rect.bottom - containerRect.top;
        }

        setTooltipPosition({ x, y });
    };

    const handleBarLeave = () => {
        setTooltipData(null);
    };

    return (
        <div className={styles.chartContainer} ref={chartRef}>
            <h2>SPO Voting Activity</h2>
            <div className={styles.chart}>
                {proposals.map((proposal) => {
                    const totalVotes = proposal.pool_yes_votes_cast + proposal.pool_no_votes_cast + proposal.pool_abstain_votes_cast;
                    const yesPercentage = (proposal.pool_yes_votes_cast / totalVotes) * 100;
                    const noPercentage = (proposal.pool_no_votes_cast / totalVotes) * 100;
                    const abstainPercentage = (proposal.pool_abstain_votes_cast / totalVotes) * 100;

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
                                        height: `${yesPercentage}%`,
                                        minHeight: '4px'
                                    }}
                                />
                                <div
                                    className={`${styles.barSegment} ${styles.no}`}
                                    style={{
                                        height: `${noPercentage}%`,
                                        minHeight: '4px'
                                    }}
                                />
                                <div
                                    className={`${styles.barSegment} ${styles.abstain}`}
                                    style={{
                                        height: `${abstainPercentage}%`,
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
                            <span>₳ {(tooltipData.yesPower / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className={styles.tooltipRow}>
                            <span className={styles.no}>No</span>
                            <span>{tooltipData.noVotes} votes ({tooltipData.noPercentage.toFixed(1)}%)</span>
                            <span>₳ {(tooltipData.noPower / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className={styles.tooltipRow}>
                            <span className={styles.abstain}>Abstain</span>
                            <span>{tooltipData.abstainVotes} votes ({tooltipData.abstainPercentage.toFixed(1)}%)</span>
                            <span>₳ {(tooltipData.abstainPower / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 