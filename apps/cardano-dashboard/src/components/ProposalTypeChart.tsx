// components/ProposalTypeChart.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from '@/styles/ProposalTypeChart.module.css';
import { formatTypeLabel, getTypeGradientStops, buildMonochromeScale } from '@/utils/typeStyles';

interface ProposalTypeChartProps {
    proposals: Array<{
        proposal_type: string;
    }>;
}

const getGradients = (type: string): string[] => getTypeGradientStops(type);

// Legend swatch will be styled inline with a deterministic gradient per type

export default function ProposalTypeChart({ proposals }: ProposalTypeChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeSegment, setActiveSegment] = useState<string | null>(null);
    const [segments, setSegments] = useState<Array<{
        type: string;
        startAngle: number;
        endAngle: number;
    }>>([]);

    // Count proposal types
    const typeStats = useMemo(() => {
        return proposals.reduce((acc, proposal) => {
            const type = proposal.proposal_type;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [proposals]);

    const data = useMemo(() => Object.entries(typeStats).map(([type, value]) => ({ type, value })), [typeStats]);
    const total = useMemo(() => (data.reduce((sum, d) => sum + d.value, 0) || 1), [data]);

    // Dev-only: log counted values for visibility during development
    /*useEffect(() => {
        if (process.env.NODE_ENV === 'production') return;
        console.info('[ProposalTypeChart] type counts', typeStats);
    }, [typeStats]);*/

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
        const newSegments: Array<{ type: string; startAngle: number; endAngle: number; }> = [];
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
            const stops = (colorScale[type]?.stops) || getGradients(type) || getGradients('InfoAction');
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
                    // Check if the angle is either in the first part (start to 2π) or second part (0 to end)
                    return normalizedAngle >= start || normalizedAngle <= end;
                }

                // For normal segments
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
            <div className={styles.chartTitle}>Proposal Types</div>
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
                        <span
                            className={styles.legendColor}
                            style={{ background: colorScale[type]?.gradient || `linear-gradient(135deg, ${getGradients(type)[0]} 0%, ${getGradients(type)[1]} 40%, ${getGradients(type)[2]} 80%, ${getGradients(type)[3]} 100%)` }}
                        ></span>
                        <span className={styles.legendLabel}>{formatTypeLabel(type)}</span>
                        <span className={styles.legendValue}>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
} 