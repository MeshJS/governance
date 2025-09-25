import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from '@/styles/ProposalTypeChart.module.css';
import { buildMonochromeScale, formatTypeLabel } from '@/utils/typeStyles';

interface ProposalOutcomeChartProps {
    proposals: Array<{
        ratified_epoch: number | null;
        expired_epoch: number | null;
        dropped_epoch: number | null;
    }>;
}

// Outcome labels will be derived dynamically for display

export default function ProposalOutcomeChart({ proposals }: ProposalOutcomeChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeSegment, setActiveSegment] = useState<string | null>(null);
    const [segments, setSegments] = useState<Array<{
        type: string;
        startAngle: number;
        endAngle: number;
    }>>([]);

    // Count proposal outcomes (memoized to avoid effect churn)
    const outcomeStats = useMemo(() => {
        return proposals.reduce((acc, proposal) => {
            if (proposal.ratified_epoch) {
                acc.ratified = (acc.ratified || 0) + 1;
            } else if (proposal.expired_epoch) {
                acc.expired = (acc.expired || 0) + 1;
            } else if (proposal.dropped_epoch) {
                acc.dropped = (acc.dropped || 0) + 1;
            } else {
                acc.pending = (acc.pending || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [proposals]);

    const data = useMemo(() => Object.entries(outcomeStats).map(([type, value]) => ({ type, value })), [outcomeStats]);
    const total = useMemo(() => (data.reduce((sum, d) => sum + d.value, 0) || 1), [data]);
    const colorScale = useMemo(() => buildMonochromeScale(data.map(d => d.type)), [data]);

    const drawChart = useCallback((isHovered: string | null) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / (2 * dpr);
        const centerY = canvas.height / (2 * dpr);
        const radius = Math.min(centerX, centerY) * 0.8;
        const innerRadius = radius * 0.6;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        let startAngle = -Math.PI / 2;
        const newSegments: typeof segments = [];
        data.forEach(({ type, value }) => {
            const segmentAngle = (value / total) * (Math.PI * 2);
            const endAngle = startAngle + segmentAngle;
            newSegments.push({ type, startAngle, endAngle });
            ctx.save();
            if (type === isHovered) {
                const scale = 1.03;
                ctx.translate(centerX, centerY);
                ctx.scale(scale, scale);
                ctx.translate(-centerX, -centerY);
                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowBlur = 25;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 5;
            }
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            // Gradient
            const grad = ctx.createLinearGradient(0, canvas.height, canvas.width, 0);
            const stops = colorScale[type]?.stops || colorScale['pending']?.stops || ['#ccc', '#bbb', '#999', '#777'];
            grad.addColorStop(0, stops[0]);
            grad.addColorStop(0.4, stops[1]);
            grad.addColorStop(0.8, stops[2]);
            grad.addColorStop(1, stops[3]);
            ctx.fillStyle = grad;
            ctx.globalAlpha = 1;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = type === isHovered ? 3 : 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = type === isHovered ? 2 : 1;
            ctx.stroke();
            ctx.restore();
            startAngle = endAngle;
        });
        setSegments(newSegments);
    }, [data, total, colorScale]);

    useEffect(() => {
        drawChart(activeSegment);
    }, [activeSegment, drawChart]);

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate distance from center
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const radius = Math.min(centerX, centerY) * 0.8;
        const innerRadius = radius * 0.6;

        // Only check segments if point is within the donut area
        if (distance >= innerRadius && distance <= radius) {
            // Calculate angle
            const angle = Math.atan2(y - centerY, x - centerX);
            const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);

            // Find segment
            const segment = segments.find(seg => {
                const start = (seg.startAngle + Math.PI * 2) % (Math.PI * 2);
                const end = (seg.endAngle + Math.PI * 2) % (Math.PI * 2);

                // For segments that cross the 0/2π boundary
                if (end < start) {
                    return normalizedAngle >= start || normalizedAngle <= end;
                }

                return normalizedAngle >= start && normalizedAngle <= end;
            });

            setActiveSegment(segment?.type || null);
        } else {
            setActiveSegment(null);
        }
    };

    const handleCanvasMouseLeave = () => {
        setActiveSegment(null);
    };

    return (
        <div className={styles.donutChartContainer}>
            <div className={styles.chartTitle}>Proposal Outcomes</div>
            <canvas
                ref={canvasRef}
                className={styles.donutChart}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
            ></canvas>
            <div className={styles.donutLegend}>
                {data.map(({ type, value }) => (
                    <div
                        key={type}
                        className={`${styles.legendItem} ${activeSegment === type ? styles.active : ''}`}
                        onMouseEnter={() => setActiveSegment(type)}
                        onMouseLeave={() => setActiveSegment(null)}
                    >
                        <span className={styles.legendColor} style={{ background: colorScale[type]?.gradient }}></span>
                        <span className={styles.legendLabel}>{formatTypeLabel(type)}</span>
                        <span className={styles.legendValue}>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
} 