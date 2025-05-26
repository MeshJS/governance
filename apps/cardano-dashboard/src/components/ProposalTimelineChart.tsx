import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/ProposalTimelineChart.module.css';
import { GovernanceProposal } from '../../types/governance';

interface ProposalTimelineChartProps {
    proposals: GovernanceProposal[];
}

const TYPE_COLORS = {
    InfoAction: '#38E8E1',
    ParameterChange: '#FF78CB',
    NewConstitution: '#E2E8F0',
    HardForkInitiation: '#FFAB00',
    TreasuryWithdrawals: '#FF8B8B',
    NoConfidence: '#B388FF',
    NewCommittee: '#4DB6AC'
};

const TYPE_LABELS = {
    InfoAction: 'Info Action',
    ParameterChange: 'Parameter Change',
    NewConstitution: 'New Constitution',
    HardForkInitiation: 'Hard Fork',
    TreasuryWithdrawals: 'Treasury Withdrawals',
    NoConfidence: 'No Confidence',
    NewCommittee: 'New Committee'
};

export default function ProposalTimelineChart({ proposals }: ProposalTimelineChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; proposal: GovernanceProposal } | null>(null);

    // Sort proposals by proposed_epoch
    const sortedProposals = [...proposals].sort((a, b) => a.proposed_epoch - b.proposed_epoch);

    // Get min and max epochs for scaling
    const minEpoch = Math.min(...sortedProposals.map(p => p.proposed_epoch));
    const maxEpoch = Math.max(...sortedProposals.map(p => p.proposed_epoch));

    const drawChart = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set up chart area
        const padding = 40;
        const chartWidth = rect.width - (padding * 2);
        const chartHeight = rect.height - (padding * 2);

        // Draw axes
        ctx.beginPath();
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = 1;
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, rect.height - padding);
        ctx.lineTo(rect.width - padding, rect.height - padding);
        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = '#2D3748';
        ctx.lineWidth = 0.5;
        const numGridLines = 5;
        for (let i = 0; i <= numGridLines; i++) {
            const y = padding + (chartHeight * (1 - i / numGridLines));
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(rect.width - padding, y);
            ctx.stroke();

            // Draw epoch labels
            const epoch = Math.round(minEpoch + (maxEpoch - minEpoch) * (i / numGridLines));
            ctx.fillStyle = '#A0AEC0';
            ctx.font = '12px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(`Epoch ${epoch}`, padding - 10, y + 4);
        }

        // Draw proposal points and lines
        sortedProposals.forEach((proposal, index) => {
            const x = padding + (chartWidth * (proposal.proposed_epoch - minEpoch) / (maxEpoch - minEpoch));
            const y = padding + (chartHeight * (1 - index / (sortedProposals.length - 1)));

            // Draw line to next point
            if (index < sortedProposals.length - 1) {
                const nextProposal = sortedProposals[index + 1];
                const nextX = padding + (chartWidth * (nextProposal.proposed_epoch - minEpoch) / (maxEpoch - minEpoch));
                const nextY = padding + (chartHeight * (1 - (index + 1) / (sortedProposals.length - 1)));

                ctx.beginPath();
                ctx.strokeStyle = TYPE_COLORS[proposal.proposal_type] || '#38E8E1';
                ctx.lineWidth = 2;
                ctx.moveTo(x, y);
                ctx.lineTo(nextX, nextY);
                ctx.stroke();
            }

            // Draw point
            ctx.beginPath();
            ctx.fillStyle = TYPE_COLORS[proposal.proposal_type] || '#38E8E1';
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw point border
            ctx.beginPath();
            ctx.strokeStyle = '#1A202C';
            ctx.lineWidth = 1;
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Draw hovered point info
        if (hoveredPoint) {
            const { x, y, proposal } = hoveredPoint;
            const tooltipWidth = 400;
            const tooltipHeight = 200;

            // Calculate tooltip position to keep it centered vertically
            let tooltipX = x + 10;
            let tooltipY = y - (tooltipHeight / 2);

            // Adjust horizontal position if tooltip would go off the right edge
            if (tooltipX + tooltipWidth > rect.width - 10) {
                tooltipX = x - tooltipWidth - 10;
            }

            // Adjust vertical position if tooltip would go off the top or bottom
            if (tooltipY < 10) {
                tooltipY = 10;
            } else if (tooltipY + tooltipHeight > rect.height - 10) {
                tooltipY = rect.height - tooltipHeight - 10;
            }

            // Draw tooltip background
            ctx.fillStyle = 'rgba(26, 32, 44, 0.95)';
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
            ctx.fill();

            // Draw tooltip border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw proposal type badge
            const typeLabel = TYPE_LABELS[proposal.proposal_type] || proposal.proposal_type;
            ctx.fillStyle = TYPE_COLORS[proposal.proposal_type] || '#38E8E1';
            ctx.beginPath();
            ctx.roundRect(tooltipX + 15, tooltipY + 15, 120, 24, 4);
            ctx.fill();
            ctx.fillStyle = '#1A202C';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(typeLabel, tooltipX + 75, tooltipY + 31);

            // Draw status badge
            let statusText = '';
            let statusColor = '';
            if (proposal.enacted_epoch) {
                statusText = 'Enacted';
                statusColor = '#48BB78'; // Green
            } else if (proposal.dropped_epoch) {
                statusText = 'Dropped';
                statusColor = '#F56565'; // Red
            } else {
                statusText = 'Pending';
                statusColor = '#ED8936'; // Orange
            }
            ctx.fillStyle = '#2D3748';
            ctx.beginPath();
            ctx.roundRect(tooltipX + tooltipWidth - 135, tooltipY + 15, 120, 24, 4);
            ctx.fill();

            // Draw status indicator dot
            ctx.fillStyle = statusColor;
            ctx.beginPath();
            ctx.arc(tooltipX + tooltipWidth - 125, tooltipY + 27, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#A0AEC0';
            ctx.textAlign = 'left';
            ctx.fillText(statusText, tooltipX + tooltipWidth - 115, tooltipY + 31);

            // Draw proposal title
            const metaJson = proposal.meta_json as { body?: { title?: string } };
            const title = metaJson?.body?.title || 'Untitled Proposal';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '14px Inter';
            ctx.textAlign = 'left';

            // Truncate title if it's too long
            const maxTitleWidth = tooltipWidth - 30; // 30px padding (15px on each side)
            const titleMetrics = ctx.measureText(title);
            let displayTitle = title;

            if (titleMetrics.width > maxTitleWidth) {
                // Start with the full title and remove characters until it fits
                while (ctx.measureText(displayTitle + '...').width > maxTitleWidth && displayTitle.length > 0) {
                    displayTitle = displayTitle.slice(0, -1);
                }
                displayTitle += '...';
            }

            ctx.fillText(displayTitle, tooltipX + 15, tooltipY + 60);

            // Draw epoch info
            ctx.fillStyle = '#A0AEC0';
            ctx.font = '12px Inter';

            // Always show proposed epoch at the top
            ctx.fillText(`Proposed: Epoch ${proposal.proposed_epoch}`, tooltipX + 15, tooltipY + 85);

            // Show expired or expiration in the middle
            if (proposal.expired_epoch) {
                ctx.fillText(`Expired: Epoch ${proposal.expired_epoch}`, tooltipX + 15, tooltipY + 105);
            } else if (proposal.expiration) {
                ctx.fillText(`Expires: Epoch ${proposal.expiration}`, tooltipX + 15, tooltipY + 105);
            }

            // Column positions for better alignment
            const labelX = tooltipX + 15;
            const yesX = tooltipX + 120;
            const noX = tooltipX + 240;
            const abstainX = tooltipX + 360;

            // Draw column headers
            ctx.fillStyle = '#A0AEC0';
            ctx.font = '12px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('Group', labelX, tooltipY + 145);
            ctx.fillText('Yes', yesX, tooltipY + 145);
            ctx.fillText('No', noX, tooltipY + 145);
            ctx.fillText('Abstain', abstainX, tooltipY + 145);

            // DRep votes
            ctx.fillStyle = '#38E8E1';
            ctx.fillText('DRep', labelX, tooltipY + 165);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`${proposal.drep_yes_votes_cast} (${proposal.drep_yes_pct.toFixed(1)}%)`, yesX, tooltipY + 165);
            ctx.fillText(`${proposal.drep_no_votes_cast} (${proposal.drep_no_pct.toFixed(1)}%)`, noX, tooltipY + 165);
            ctx.fillText(`${proposal.drep_abstain_votes_cast}`, abstainX, tooltipY + 165);

            // Pool votes
            ctx.fillStyle = '#FF78CB';
            ctx.fillText('Pool', labelX, tooltipY + 185);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`${proposal.pool_yes_votes_cast} (${proposal.pool_yes_pct.toFixed(1)}%)`, yesX, tooltipY + 185);
            ctx.fillText(`${proposal.pool_no_votes_cast} (${proposal.pool_no_pct.toFixed(1)}%)`, noX, tooltipY + 185);
            ctx.fillText(`${proposal.pool_abstain_votes_cast}`, abstainX, tooltipY + 185);

            // Committee votes
            ctx.fillStyle = '#FFAB00';
            ctx.fillText('Committee', labelX, tooltipY + 205);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`${proposal.committee_yes_votes_cast} (${proposal.committee_yes_pct.toFixed(1)}%)`, yesX, tooltipY + 205);
            ctx.fillText(`${proposal.committee_no_votes_cast} (${proposal.committee_no_pct.toFixed(1)}%)`, noX, tooltipY + 205);
            ctx.fillText(`${proposal.committee_abstain_votes_cast}`, abstainX, tooltipY + 205);
        }
    };

    useEffect(() => {
        drawChart();
    }, [proposals, hoveredPoint]);

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const padding = 40;
        const chartWidth = rect.width - (padding * 2);
        const chartHeight = rect.height - (padding * 2);

        // Find closest point
        let closestPoint: { x: number; y: number; proposal: GovernanceProposal } | null = null;
        let minDistance = Infinity;

        sortedProposals.forEach((proposal, index) => {
            const pointX = padding + (chartWidth * (proposal.proposed_epoch - minEpoch) / (maxEpoch - minEpoch));
            const pointY = padding + (chartHeight * (1 - index / (sortedProposals.length - 1)));
            const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));

            if (distance < minDistance && distance < 10) {
                minDistance = distance;
                closestPoint = { x: pointX, y: pointY, proposal };
            }
        });

        setHoveredPoint(closestPoint);
    };

    const handleCanvasMouseLeave = () => {
        setHoveredPoint(null);
    };

    return (
        <div className={styles.timelineChartContainer}>
            <div className={styles.chartTitle}>Proposal Timeline</div>
            <canvas
                ref={canvasRef}
                className={styles.timelineChart}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
            />
        </div>
    );
} 