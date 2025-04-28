import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Voting.module.css';

interface VotingDonutChartProps {
    voteStats: {
        total: number;
        yes: number;
        no: number;
        abstain: number;
    };
}

const VotingDonutChart: React.FC<VotingDonutChartProps> = ({ voteStats }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeSegment, setActiveSegment] = useState<string | null>(null);
    const [segments, setSegments] = useState<Array<{
        type: string;
        startAngle: number;
        endAngle: number;
    }>>([]);

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

        // Calculate percentages
        const total = voteStats.total || 1; // Prevent division by zero
        const data = [
            { 
                type: 'yes',
                value: voteStats.yes, 
                gradient: ctx.createLinearGradient(0, canvas.height, canvas.width, 0),
                hoverGradient: ctx.createLinearGradient(0, canvas.height, canvas.width, 0)
            },
            { 
                type: 'no',
                value: voteStats.no, 
                gradient: ctx.createLinearGradient(0, canvas.height, canvas.width, 0),
                hoverGradient: ctx.createLinearGradient(0, canvas.height, canvas.width, 0)
            },
            { 
                type: 'abstain',
                value: voteStats.abstain, 
                gradient: ctx.createLinearGradient(0, canvas.height, canvas.width, 0),
                hoverGradient: ctx.createLinearGradient(0, canvas.height, canvas.width, 0)
            }
        ];

        // Set up base gradients
        data[0].gradient.addColorStop(0, 'rgba(56, 232, 225, 0.95)'); // Bright teal
        data[0].gradient.addColorStop(0.4, 'rgba(20, 184, 166, 0.85)'); // Deep teal
        data[0].gradient.addColorStop(0.8, 'rgba(8, 74, 67, 0.8)'); // Very dark teal
        data[0].gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)'); // Black
        
        data[1].gradient.addColorStop(0, 'rgba(255, 120, 203, 0.95)'); // Bright pink
        data[1].gradient.addColorStop(0.4, 'rgba(219, 39, 119, 0.85)'); // Deep pink
        data[1].gradient.addColorStop(0.8, 'rgba(88, 16, 48, 0.8)'); // Very dark pink
        data[1].gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)'); // Black
        
        data[2].gradient.addColorStop(0, 'rgba(226, 232, 240, 0.85)'); // Bright silver
        data[2].gradient.addColorStop(0.4, 'rgba(148, 163, 184, 0.8)'); // Cool slate
        data[2].gradient.addColorStop(0.8, 'rgba(71, 85, 105, 0.75)'); // Deep slate
        data[2].gradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)'); // Rich dark slate

        // Set up hover gradients with enhanced brightness
        data[0].hoverGradient.addColorStop(0, 'rgba(96, 255, 248, 1)'); // Brighter teal
        data[0].hoverGradient.addColorStop(0.4, 'rgba(34, 211, 238, 0.95)'); // Bright deep teal
        data[0].hoverGradient.addColorStop(0.8, 'rgba(12, 100, 90, 0.9)'); // Enhanced dark teal
        data[0].hoverGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)'); // Darker black
        
        data[1].hoverGradient.addColorStop(0, 'rgba(255, 140, 223, 1)'); // Brighter pink
        data[1].hoverGradient.addColorStop(0.4, 'rgba(236, 72, 153, 0.95)'); // Bright deep pink
        data[1].hoverGradient.addColorStop(0.8, 'rgba(112, 26, 62, 0.9)'); // Enhanced dark pink
        data[1].hoverGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)'); // Darker black
        
        data[2].hoverGradient.addColorStop(0, 'rgba(241, 245, 249, 0.95)'); // Bright silver
        data[2].hoverGradient.addColorStop(0.4, 'rgba(203, 213, 225, 0.9)'); // Light cool slate
        data[2].hoverGradient.addColorStop(0.8, 'rgba(100, 116, 139, 0.85)'); // Medium slate
        data[2].hoverGradient.addColorStop(1, 'rgba(51, 65, 85, 0.95)'); // Deep slate blue

        // Draw donut chart
        const centerX = canvas.width / (2 * dpr);
        const centerY = canvas.height / (2 * dpr);
        const radius = Math.min(centerX, centerY) * 0.8;
        const innerRadius = radius * 0.6;

        // Add overall shadow to the chart
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        let startAngle = -Math.PI / 2;
        const newSegments: typeof segments = [];

        // Draw all segments
        data.forEach(segment => {
            const segmentAngle = (segment.value / total) * (Math.PI * 2);
            const endAngle = startAngle + segmentAngle;
            
            newSegments.push({
                type: segment.type,
                startAngle,
                endAngle
            });

            // Save context for transformation
            ctx.save();

            // Apply hover effect if this is the active segment
            if (segment.type === isHovered) {
                const scale = 1.03;
                ctx.translate(centerX, centerY);
                ctx.scale(scale, scale);
                ctx.translate(-centerX, -centerY);

                // Enhanced shadow for hovered segment
                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowBlur = 25;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 5;
            }

            // Draw the segment
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();

            // Fill with gradient
            ctx.fillStyle = segment.type === isHovered ? segment.hoverGradient : segment.gradient;
            ctx.globalAlpha = 1;
            ctx.fill();

            // Add highlight effects
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = segment.type === isHovered ? 3 : 2;
            ctx.stroke();

            // Add inner highlight
            ctx.beginPath();
            ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = segment.type === isHovered ? 2 : 1;
            ctx.stroke();

            // Restore context
            ctx.restore();

            startAngle = endAngle;
        });

        setSegments(newSegments);
    };

    useEffect(() => {
        drawChart(activeSegment);
    }, [voteStats, activeSegment]);

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

        // Calculate angle from center to mouse position
        const angle = Math.atan2(y - centerY, x - centerX);
        // Adjust angle to match our chart's starting position (-90 degrees)
        const adjustedAngle = angle < -Math.PI / 2 ? angle + Math.PI * 2 : angle;

        // Calculate distance from center to mouse position
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

        // Check if mouse is within donut area
        if (distance > innerRadius && distance < radius) {
            // Find which segment the angle corresponds to
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
                    className={`${styles.legendItem} ${activeSegment === 'yes' ? styles.active : ''}`}
                    onMouseEnter={() => setActiveSegment('yes')}
                    onMouseLeave={() => setActiveSegment(null)}
                >
                    <span className={`${styles.legendColor} ${styles.yes}`}></span>
                    <span className={styles.legendLabel}>Yes</span>
                    <span className={styles.legendValue}>{voteStats.yes}</span>
                </div>
                <div 
                    className={`${styles.legendItem} ${activeSegment === 'no' ? styles.active : ''}`}
                    onMouseEnter={() => setActiveSegment('no')}
                    onMouseLeave={() => setActiveSegment(null)}
                >
                    <span className={`${styles.legendColor} ${styles.no}`}></span>
                    <span className={styles.legendLabel}>No</span>
                    <span className={styles.legendValue}>{voteStats.no}</span>
                </div>
                <div 
                    className={`${styles.legendItem} ${activeSegment === 'abstain' ? styles.active : ''}`}
                    onMouseEnter={() => setActiveSegment('abstain')}
                    onMouseLeave={() => setActiveSegment(null)}
                >
                    <span className={`${styles.legendColor} ${styles.abstain}`}></span>
                    <span className={styles.legendLabel}>Abstain</span>
                    <span className={styles.legendValue}>{voteStats.abstain}</span>
                </div>
            </div>
        </div>
    );
};

export default VotingDonutChart; 