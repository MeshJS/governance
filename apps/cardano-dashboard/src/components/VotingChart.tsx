import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from '@/styles/VotingChart.module.css';
import { GovernanceProposal } from '../../types/governance';
import { binProposals } from '@/utils/binProposals';

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
    const [chartWidth, setChartWidth] = useState<number>(0);

    // Observe container width to decide how many columns we can render
    useEffect(() => {
        if (!chartRef.current) return;
        const container = chartRef.current;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                setChartWidth(width);
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const { bins } = useMemo(() => {
        const maxColumns = Math.max(1, Math.floor(chartWidth));
        const result = binProposals({ proposals, type, maxColumns });
        if (process.env.NODE_ENV !== 'production') {
            const hasWeird = result.bins.some((bin) => {
                const values = [bin.yesVotes, bin.noVotes, bin.abstainVotes, bin.yesPct, bin.noPct];
                return values.some((v) => !Number.isFinite(v) || Number.isNaN(v));
            });
            if (hasWeird) {
                console.warn('[VotingChart] Detected non-finite values in bins', {
                    type,
                    bins: result.bins,
                });
            }
        }
        return result;
    }, [proposals, type, chartWidth]);

    const getProposalTitle = (proposal: GovernanceProposal) => {
        const body = proposal.meta_json?.body as unknown;
        if (body && typeof body === 'object' && 'title' in (body as Record<string, unknown>)) {
            return (body as { title: string }).title;
        }
        return proposal.proposal_id.length > 20
            ? `${proposal.proposal_id.slice(0, 10)}...${proposal.proposal_id.slice(-10)}`
            : proposal.proposal_id;
    };
    const handleBarHover = (e: React.MouseEvent, binIndex: number) => {
        const bin = bins[binIndex];
        if (!bin) return;

        const total = bin.yesVotes + bin.noVotes + bin.abstainVotes || 1;
        const yesPct = (bin.yesVotes / total) * 100;
        const noPct = (bin.noVotes / total) * 100;
        const abstainPct = (bin.abstainVotes / total) * 100;

        let title: string;
        if (bin.count === 1) {
            const p = proposals[bin.startIndex];
            title = getProposalTitle(p);
        } else {
            title = `Proposals ${bin.startIndex + 1}–${bin.endIndex + 1} (${bin.count})`;
        }

        const data: TooltipData = {
            proposalId: `${bin.startIndex}-${bin.endIndex}`,
            title,
            yesVotes: bin.yesVotes,
            noVotes: bin.noVotes,
            abstainVotes: bin.abstainVotes,
            yesPercentage: yesPct,
            noPercentage: noPct,
            abstainPercentage: abstainPct
        };

        setTooltipData(data);

        const rect = e.currentTarget.getBoundingClientRect();
        const containerRect = chartRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const tooltipWidth = 300;
        const tooltipHeight = 150;
        const padding = 20;

        let x = rect.left - containerRect.left + (rect.width / 2);
        let y = rect.top - containerRect.top;

        if (x + (tooltipWidth / 2) > containerRect.width - padding) {
            x = containerRect.width - (tooltipWidth / 2) - padding;
        } else if (x - (tooltipWidth / 2) < padding) {
            x = (tooltipWidth / 2) + padding;
        }

        if (y - tooltipHeight < padding) {
            y = rect.bottom - containerRect.top + padding;
        } else {
            y = y - tooltipHeight - padding;
        }

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
                {bins.map((bin, idx) => {
                    const total = bin.yesVotes + bin.noVotes + bin.abstainVotes || 1;
                    const yesPct = (bin.yesVotes / total) * 100;
                    const noPct = (bin.noVotes / total) * 100;
                    const abstainPct = (bin.abstainVotes / total) * 100;

                    return (
                        <div
                            key={`${bin.startIndex}-${bin.endIndex}-${idx}`}
                            className={styles.proposalBar}
                            onMouseEnter={(e) => handleBarHover(e, idx)}
                            onMouseLeave={handleBarLeave}
                        >
                            <div className={styles.barContainer}>
                                <div
                                    className={`${styles.barSegment} ${styles.yes}`}
                                    style={{
                                        height: `${yesPct}%`,
                                        minHeight: '4px'
                                    }}
                                />
                                <div
                                    className={`${styles.barSegment} ${styles.no}`}
                                    style={{
                                        height: `${noPct}%`,
                                        minHeight: '4px'
                                    }}
                                />
                                <div
                                    className={`${styles.barSegment} ${styles.abstain}`}
                                    style={{
                                        height: `${abstainPct}%`,
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