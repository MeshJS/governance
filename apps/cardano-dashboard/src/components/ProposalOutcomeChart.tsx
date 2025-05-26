import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/ProposalTypeChart.module.css';

interface ProposalOutcomeChartProps {
    proposals: Array<{
        ratified_epoch: number | null;
        expired_epoch: number | null;
        dropped_epoch: number | null;
    }>;
}

const OUTCOME_GRADIENTS = {
    ratified: [
        'rgba(56, 232, 225, 0.95)', // Bright teal
        'rgba(20, 184, 166, 0.85)', // Deep teal
        'rgba(8, 74, 67, 0.8)',     // Very dark teal
        'rgba(0, 0, 0, 0.9)'        // Black
    ],
    expired: [
        'rgba(255, 120, 203, 0.95)', // Bright pink
        'rgba(219, 39, 119, 0.85)',  // Deep pink
        'rgba(88, 16, 48, 0.8)',     // Very dark pink
        'rgba(0, 0, 0, 0.9)'         // Black
    ],
    dropped: [
        'rgba(226, 232, 240, 0.85)', // Bright silver
        'rgba(148, 163, 184, 0.8)',  // Cool slate
        'rgba(71, 85, 105, 0.75)',   // Deep slate
        'rgba(30, 41, 59, 0.9)'      // Rich dark slate
    ],
    pending: [
        'rgba(255, 171, 0, 0.95)',   // Bright orange
        'rgba(234, 88, 12, 0.85)',   // Deep orange
        'rgba(154, 52, 18, 0.8)',    // Very dark orange
        'rgba(0, 0, 0, 0.9)'         // Black
    ]
};

const OUTCOME_LABELS = {
    ratified: 'Ratified',
    expired: 'Expired',
    dropped: 'Dropped',
    pending: 'Pending'
};

const OUTCOME_CLASS = {
    ratified: 'infoAction',
    expired: 'parameterChange',
    dropped: 'newConstitution',
    pending: 'hardFork'
};

export default function ProposalOutcomeChart({ proposals }: ProposalOutcomeChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeSegment, setActiveSegment] = useState<string | null>(null);
    const [segments, setSegments] = useState<Array<{
        type: string;
        startAngle: number;
        endAngle: number;
    }>>([]);

    // Count proposal outcomes
    const outcomeStats = proposals.reduce((acc, proposal) => {
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

    const data = Object.entries(outcomeStats).map(([type, value]) => ({ type, value }));
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

    const drawChart = (isHovered: string | null) => {
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
            const stops = OUTCOME_GRADIENTS[type as keyof typeof OUTCOME_GRADIENTS] || OUTCOME_GRADIENTS.pending;
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
    };

    useEffect(() => {
        drawChart(activeSegment);
    }, [proposals, activeSegment]);

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
                        <span className={`${styles.legendColor} ${styles[OUTCOME_CLASS[type as keyof typeof OUTCOME_CLASS]]}`}></span>
                        <span className={styles.legendLabel}>{OUTCOME_LABELS[type as keyof typeof OUTCOME_LABELS]}</span>
                        <span className={styles.legendValue}>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
} 