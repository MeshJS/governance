import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from '@/styles/ProposalTimelineChart.module.css';
import { formatTypeLabel, buildMonochromeScale, getPrimaryBaseColor } from '@/utils/typeStyles';
import { GovernanceProposal } from '../../types/governance';

interface ProposalTimelineChartProps {
    proposals: GovernanceProposal[];
}

// Labels and colors will be derived dynamically from proposal_type

function getThemeColors() {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const body = getComputedStyle(document.body);
    const getVar = (name: string, fallback?: string) => style.getPropertyValue(name).trim() || fallback || '';
    return {
        textPrimary: getVar('--text-primary', body.color),
        textSecondary: getVar('--text-secondary', getVar('--text-primary', body.color)),
        textTertiary: getVar('--text-tertiary', getVar('--text-secondary', body.color)),
        bgPrimary: getVar('--bg-primary', body.backgroundColor),
        bgSecondary: getVar('--bg-secondary', getVar('--bg-primary', body.backgroundColor)),
        bgOverlay: getVar('--bg-overlay', getVar('--bg-secondary', body.backgroundColor)),
        borderColor: getVar('--border-color', getVar('--text-tertiary', body.color)),
        colorSuccess: getVar('--color-success', getPrimaryBaseColor()),
        colorDanger: getVar('--color-danger', getPrimaryBaseColor()),
        colorWarning: getVar('--color-warning', getPrimaryBaseColor()),
    } as const;
}

export default function ProposalTimelineChart({ proposals }: ProposalTimelineChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; proposal: GovernanceProposal } | null>(null);

    // Sort proposals by proposed_epoch
    const sortedProposals = [...proposals].sort((a, b) => a.proposed_epoch - b.proposed_epoch);

    // Build a unified monochrome color scale for proposal types
    const colorScale = useMemo(() => {
        const keys = sortedProposals.map(p => p.proposal_type);
        return buildMonochromeScale(keys);
    }, [sortedProposals]);

    // Get min and max epochs for scaling
    const minEpoch = Math.min(...sortedProposals.map(p => p.proposed_epoch));
    const maxEpoch = Math.max(...sortedProposals.map(p => p.proposed_epoch));

    const drawChart = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const theme = getThemeColors();

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set up chart area
        const padding = 70;
        const chartWidth = rect.width - (padding * 2);
        const chartHeight = rect.height - (padding * 2);

        // Draw axes
        ctx.beginPath();
        ctx.strokeStyle = theme.textSecondary;
        ctx.lineWidth = 1;
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, rect.height - padding);
        ctx.lineTo(rect.width - padding, rect.height - padding);
        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = theme.borderColor;
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
            ctx.fillStyle = theme.textTertiary;
            ctx.font = '12px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(`Epoch ${epoch}`, padding - 15, y + 4);
        }

        // Draw proposal points and lines
        const defaultSeriesColor = Object.values(colorScale)[0]?.solid || theme.textPrimary;
        sortedProposals.forEach((proposal, index) => {
            const x = padding + (chartWidth * (proposal.proposed_epoch - minEpoch) / (maxEpoch - minEpoch));
            const y = padding + (chartHeight * (1 - index / (sortedProposals.length - 1)));

            // Draw line to next point
            if (index < sortedProposals.length - 1) {
                const nextProposal = sortedProposals[index + 1];
                const nextX = padding + (chartWidth * (nextProposal.proposed_epoch - minEpoch) / (maxEpoch - minEpoch));
                const nextY = padding + (chartHeight * (1 - (index + 1) / (sortedProposals.length - 1)));

                ctx.beginPath();
                ctx.strokeStyle = colorScale[proposal.proposal_type]?.solid || defaultSeriesColor;
                ctx.lineWidth = 2;
                ctx.moveTo(x, y);
                ctx.lineTo(nextX, nextY);
                ctx.stroke();
            }

            // Draw point
            ctx.beginPath();
            ctx.fillStyle = colorScale[proposal.proposal_type]?.solid || defaultSeriesColor;
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw point border
            ctx.beginPath();
            ctx.strokeStyle = theme.bgPrimary;
            ctx.lineWidth = 1;
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Draw hovered point info
        if (hoveredPoint) {
            const { x, proposal } = hoveredPoint;
            const tooltipWidth = 400;
            const tooltipHeight = 207;

            // Tooltip Y is fixed
            let tooltipY = 40;
            // Tooltip X is dynamic, based on hovered point
            let tooltipX = x + 10;

            // Adjust horizontal position if tooltip would go off the right edge
            if (tooltipX + tooltipWidth > rect.width - 10) {
                tooltipX = x - tooltipWidth - 10;
            }

            // Adjust vertical position if tooltip would go off the top or bottom
            // (not needed for fixed Y, but keep for safety)
            if (tooltipY < 10) {
                // Shouldn't happen, but clamp
                tooltipY = 10;
            } else if (tooltipY + tooltipHeight > rect.height - 10) {
                tooltipY = rect.height - tooltipHeight - 10;
            }

            // Draw tooltip background
            ctx.fillStyle = theme.bgSecondary;
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
            ctx.fill();

            // Draw tooltip border
            ctx.strokeStyle = theme.borderColor;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw proposal type badge
            const typeLabel = formatTypeLabel(proposal.proposal_type);
            ctx.fillStyle = colorScale[proposal.proposal_type]?.solid || defaultSeriesColor;
            ctx.beginPath();
            ctx.roundRect(tooltipX + 15, tooltipY + 15, 120, 24, 4);
            ctx.fill();
            ctx.fillStyle = theme.bgPrimary;
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(typeLabel, tooltipX + 75, tooltipY + 31);

            // Draw status badge
            let statusText = '';
            let statusColor = '';
            if (proposal.enacted_epoch) {
                statusText = 'Enacted';
                statusColor = theme.colorSuccess;
            } else if (proposal.dropped_epoch) {
                statusText = 'Dropped';
                statusColor = theme.colorDanger;
            } else {
                statusText = 'Pending';
                statusColor = theme.colorWarning;
            }
            ctx.fillStyle = theme.bgOverlay;
            ctx.beginPath();
            ctx.roundRect(tooltipX + tooltipWidth - 135, tooltipY + 15, 120, 24, 4);
            ctx.fill();

            // Draw status indicator dot
            ctx.fillStyle = statusColor;
            ctx.beginPath();
            ctx.arc(tooltipX + tooltipWidth - 125, tooltipY + 27, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = theme.textSecondary;
            ctx.textAlign = 'left';
            ctx.fillText(statusText, tooltipX + tooltipWidth - 115, tooltipY + 31);

            // Draw proposal title
            const metaJson = proposal.meta_json as { body?: { title?: string } };
            const title = metaJson?.body?.title || 'Untitled Proposal';
            ctx.fillStyle = theme.textPrimary;
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
            ctx.fillStyle = theme.textSecondary;
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
            ctx.fillStyle = theme.textSecondary;
            ctx.font = '12px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('Group', labelX, tooltipY + 135);
            ctx.fillText('Yes', yesX, tooltipY + 135);
            ctx.fillText('No', noX, tooltipY + 135);
            ctx.fillText('Abstain', abstainX, tooltipY + 135);

            // DRep votes
            ctx.fillStyle = theme.colorSuccess;
            ctx.fillText('DRep', labelX, tooltipY + 155);
            ctx.fillStyle = theme.textPrimary;
            ctx.fillText(`${proposal.drep_yes_votes_cast} (${proposal.drep_yes_pct.toFixed(1)}%)`, yesX, tooltipY + 155);
            ctx.fillText(`${proposal.drep_no_votes_cast} (${proposal.drep_no_pct.toFixed(1)}%)`, noX, tooltipY + 155);
            ctx.fillText(`${proposal.drep_abstain_votes_cast}`, abstainX, tooltipY + 155);

            // Pool votes
            ctx.fillStyle = theme.colorWarning;
            ctx.fillText('Pool', labelX, tooltipY + 175);
            ctx.fillStyle = theme.textPrimary;
            ctx.fillText(`${proposal.pool_yes_votes_cast} (${proposal.pool_yes_pct.toFixed(1)}%)`, yesX, tooltipY + 175);
            ctx.fillText(`${proposal.pool_no_votes_cast} (${proposal.pool_no_pct.toFixed(1)}%)`, noX, tooltipY + 175);
            ctx.fillText(`${proposal.pool_abstain_votes_cast}`, abstainX, tooltipY + 175);

            // Committee votes
            ctx.fillStyle = theme.colorDanger;
            ctx.fillText('Committee', labelX, tooltipY + 195);
            ctx.fillStyle = theme.textPrimary;
            ctx.fillText(`${proposal.committee_yes_votes_cast} (${proposal.committee_yes_pct.toFixed(1)}%)`, yesX, tooltipY + 195);
            ctx.fillText(`${proposal.committee_no_votes_cast} (${proposal.committee_no_pct.toFixed(1)}%)`, noX, tooltipY + 195);
            ctx.fillText(`${proposal.committee_abstain_votes_cast}`, abstainX, tooltipY + 195);
        }
    }, [sortedProposals, minEpoch, maxEpoch, hoveredPoint, colorScale]);

    useEffect(() => {
        drawChart();
    }, [drawChart]);

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const padding = 70;
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