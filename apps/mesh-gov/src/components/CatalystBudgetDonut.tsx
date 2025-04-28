import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Proposals.module.css';

interface CatalystBudgetDonutProps {
    totalBudget: number;
    distributedBudget: number;
}

const CatalystBudgetDonut: React.FC<CatalystBudgetDonutProps> = ({ totalBudget, distributedBudget }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeSegment, setActiveSegment] = useState<string | null>(null);
    const [segments, setSegments] = useState<Array<{
        type: string;
        startAngle: number;
        endAngle: number;
    }>>([]);

    const formatAda = (amount: number): string => {
        return `₳ ${new Intl.NumberFormat('en-US').format(amount)}`;
    };

    const drawChart = (isHovered: string | null) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size with device pixel ratio for sharper rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate data
        const remainingBudget = totalBudget - distributedBudget;
        const data = [
            { 
                type: 'distributed',
                value: distributedBudget,
                gradient: ctx.createLinearGradient(0, canvas.height, canvas.width, 0),
                hoverGradient: ctx.createLinearGradient(0, canvas.height, canvas.width, 0)
            },
            { 
                type: 'remaining',
                value: remainingBudget,
                gradient: ctx.createLinearGradient(0, canvas.height, canvas.width, 0),
                hoverGradient: ctx.createLinearGradient(0, canvas.height, canvas.width, 0)
            }
        ];

        // Set up gradients
        // Distributed budget - green gradient (matching milestones chart)
        data[0].gradient.addColorStop(0, 'rgba(56, 232, 225, 0.95)');
        data[0].gradient.addColorStop(0.4, 'rgba(20, 184, 166, 0.85)');
        data[0].gradient.addColorStop(0.8, 'rgba(8, 74, 67, 0.8)');
        data[0].gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        
        // Remaining budget - gray gradient
        data[1].gradient.addColorStop(0, 'rgba(226, 232, 240, 0.85)');
        data[1].gradient.addColorStop(0.4, 'rgba(148, 163, 184, 0.8)');
        data[1].gradient.addColorStop(0.8, 'rgba(71, 85, 105, 0.75)');
        data[1].gradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)');

        // Hover gradients - brighter versions
        data[0].hoverGradient.addColorStop(0, 'rgba(96, 255, 248, 1)');
        data[0].hoverGradient.addColorStop(0.4, 'rgba(34, 211, 238, 0.95)');
        data[0].hoverGradient.addColorStop(0.8, 'rgba(12, 100, 90, 0.9)');
        data[0].hoverGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        
        data[1].hoverGradient.addColorStop(0, 'rgba(241, 245, 249, 0.95)');
        data[1].hoverGradient.addColorStop(0.4, 'rgba(203, 213, 225, 0.9)');
        data[1].hoverGradient.addColorStop(0.8, 'rgba(100, 116, 139, 0.85)');
        data[1].hoverGradient.addColorStop(1, 'rgba(51, 65, 85, 0.95)');

        // Draw donut chart
        const centerX = canvas.width / (2 * dpr);
        const centerY = canvas.height / (2 * dpr);
        const radius = Math.min(centerX, centerY) * 0.8;
        const innerRadius = radius * 0.6;

        // Add overall shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        let startAngle = -Math.PI / 2;
        const newSegments: typeof segments = [];

        // Draw segments
        data.forEach(segment => {
            const segmentAngle = (segment.value / totalBudget) * (Math.PI * 2);
            const endAngle = startAngle + segmentAngle;
            
            newSegments.push({
                type: segment.type,
                startAngle,
                endAngle
            });

            ctx.save();

            if (segment.type === isHovered) {
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

            ctx.fillStyle = segment.type === isHovered ? segment.hoverGradient : segment.gradient;
            ctx.globalAlpha = 1;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = segment.type === isHovered ? 3 : 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = segment.type === isHovered ? 2 : 1;
            ctx.stroke();

            ctx.restore();

            startAngle = endAngle;
        });

        setSegments(newSegments);
    };

    useEffect(() => {
        drawChart(activeSegment);
    }, [totalBudget, distributedBudget, activeSegment]);

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
            const activeSegment = segments.find(segment => 
                adjustedAngle >= segment.startAngle && adjustedAngle <= segment.endAngle
            );
            setActiveSegment(activeSegment ? activeSegment.type : null);
        } else {
            setActiveSegment(null);
        }
    };

    const handleCanvasMouseLeave = () => {
        setActiveSegment(null);
    };

    const distributionPercentage = Math.round((distributedBudget / totalBudget) * 100);

    return (
        <div className={styles.donutChartContainer}>
            <canvas 
                ref={canvasRef} 
                className={styles.donutChart}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
            ></canvas>
            <div className={styles.donutLegend}>
                <div 
                    className={`${styles.legendItem} ${activeSegment === 'distributed' ? styles.active : ''}`}
                    onMouseEnter={() => setActiveSegment('distributed')}
                    onMouseLeave={() => setActiveSegment(null)}
                >
                    <div className={`${styles.legendColor} ${styles.distributed}`} />
                    <span className={styles.legendLabel}>Distributed Funds</span>
                    <span className={styles.legendValue}>{formatAda(distributedBudget)}</span>
                </div>
                <div 
                    className={`${styles.legendItem} ${activeSegment === 'remaining' ? styles.active : ''}`}
                    onMouseEnter={() => setActiveSegment('remaining')}
                    onMouseLeave={() => setActiveSegment(null)}
                >
                    <div className={`${styles.legendColor} ${styles.remaining}`} />
                    <span className={styles.legendLabel}>Remaining Funds</span>
                    <span className={styles.legendValue}>{formatAda(totalBudget - distributedBudget)}</span>
                </div>
            </div>
            <div className={styles.completionText}>
                {distributionPercentage}% Distributed
            </div>
        </div>
    );
};

export default CatalystBudgetDonut; 