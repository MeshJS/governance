import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Voting.module.css';

interface VotingParticipationDonutProps {
    totalProposals: number;
    votedProposals: number;
}

const PARTICIPATION_GRADIENTS = {
    voted: [
        'rgba(56, 232, 225, 0.95)', // Bright teal
        'rgba(20, 184, 166, 0.85)', // Deep teal
        'rgba(8, 74, 67, 0.8)',     // Very dark teal
        'rgba(0, 0, 0, 0.9)'        // Black
    ],
    notVoted: [
        'rgba(56, 232, 225, 0.55)', // Lightest teal
        'rgba(20, 184, 166, 0.45)', // Lightest deep teal
        'rgba(8, 74, 67, 0.4)',     // Lightest dark teal
        'rgba(0, 0, 0, 0.9)'        // Black
    ]
};

const PARTICIPATION_LABELS = {
    voted: 'Voted',
    notVoted: 'Not Voted'
};

export default function VotingParticipationDonut({ totalProposals, votedProposals }: VotingParticipationDonutProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeSegment, setActiveSegment] = useState<string | null>(null);
    const [segments, setSegments] = useState<Array<{
        type: string;
        startAngle: number;
        endAngle: number;
    }>>([]);

    const data = [
        { type: 'voted', value: votedProposals },
        { type: 'notVoted', value: totalProposals - votedProposals }
    ];
    const total = totalProposals || 1;

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
            const stops = PARTICIPATION_GRADIENTS[type as keyof typeof PARTICIPATION_GRADIENTS];
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
    }, [totalProposals, votedProposals, activeSegment]);

    const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        const innerRadius = radius * 0.6;
        const angle = Math.atan2(y - centerY, x - centerX);
        const adjustedAngle = angle < -Math.PI / 2 ? angle + Math.PI * 2 : angle;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distance > innerRadius && distance < radius) {
            const active = segments.find(segment => 
                adjustedAngle >= segment.startAngle && adjustedAngle <= segment.endAngle
            );
            setActiveSegment(active ? active.type : null);
        } else {
            setActiveSegment(null);
        }
    };

    const handleCanvasMouseLeave = () => {
        setActiveSegment(null);
    };

    const participationRate = ((votedProposals / totalProposals) * 100).toFixed(0);

    return (
        <div className={styles.donutChartContainer}>
            <div className={styles.chartHeader}>
                <div className={styles.chartTitle}>Voting Participation</div>
            </div>
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
                        <span className={`${styles.legendColor} ${styles[type]}`}></span>
                        <span className={styles.legendLabel}>{PARTICIPATION_LABELS[type as keyof typeof PARTICIPATION_LABELS]}</span>
                        <span className={styles.legendValue}>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
} 