import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Proposals.module.css';
import { CatalystProject } from '../types';

interface VotesDonutChartProps {
  proposals: CatalystProject[];
}

const VotesDonutChart = ({ proposals }: VotesDonutChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [segments, setSegments] = useState<
    Array<{
      id: string;
      title: string;
      fund: string;
      startAngle: number;
      endAngle: number;
      votes: number;
    }>
  >([]);

  // Helper function to get funding round from category
  const getFundingRound = (category: string): string => {
    return category.trim().substring(0, 3);
  };

  // Helper function to format numbers with suffixes
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
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

    // Get proposals with votes, sorted by vote count
    const proposalsWithVotes = proposals
      .map(proposal => ({
        id: proposal.projectDetails.id.toString(),
        title: proposal.projectDetails.title,
        fund: getFundingRound(proposal.projectDetails.category),
        votes: proposal.projectDetails.voting?.yes_votes_count || 0,
      }))
      .filter(p => p.votes > 0)
      .sort((a, b) => b.votes - a.votes);

    const totalVotes = proposalsWithVotes.reduce((sum, p) => sum + p.votes, 0);

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

    // Draw segments for each proposal
    proposalsWithVotes.forEach((proposal, index) => {
      const segmentAngle = (proposal.votes / totalVotes) * (Math.PI * 2);
      const endAngle = startAngle + segmentAngle;

      newSegments.push({
        id: proposal.id,
        title: proposal.title,
        fund: proposal.fund,
        startAngle,
        endAngle,
        votes: proposal.votes,
      });

      ctx.save();

      if (proposal.id === isHovered) {
        const scale = 1.03;
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 5;
      }

      // Create gradients
      const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, 0);
      const hoverGradient = ctx.createLinearGradient(0, canvas.height, canvas.width, 0);

      // Base gradient
      gradient.addColorStop(0, 'rgba(56, 232, 225, 0.95)');
      gradient.addColorStop(0.4, 'rgba(20, 184, 166, 0.85)');
      gradient.addColorStop(0.8, 'rgba(8, 74, 67, 0.8)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');

      // Hover gradient
      hoverGradient.addColorStop(0, 'rgba(96, 255, 248, 1)');
      hoverGradient.addColorStop(0.4, 'rgba(34, 211, 238, 0.95)');
      hoverGradient.addColorStop(0.8, 'rgba(12, 100, 90, 0.9)');
      hoverGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = proposal.id === isHovered ? hoverGradient : gradient;
      ctx.globalAlpha = 1;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = proposal.id === isHovered ? 3 : 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = proposal.id === isHovered ? 2 : 1;
      ctx.stroke();

      ctx.restore();

      startAngle = endAngle;
    });

    setSegments(newSegments);
  };

  useEffect(() => {
    drawChart(activeSegment);
  }, [proposals, activeSegment]);

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
      const activeSegment = segments.find(
        segment => adjustedAngle >= segment.startAngle && adjustedAngle <= segment.endAngle
      );
      setActiveSegment(activeSegment ? activeSegment.id : null);
    } else {
      setActiveSegment(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setActiveSegment(null);
  };

  // Get active segment data
  const activeSegmentData = segments.find(s => s.id === activeSegment);

  return (
    <div className={styles.donutChartContainer}>
      <canvas
        ref={canvasRef}
        className={styles.donutChart}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      />
      {activeSegmentData && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>{activeSegmentData.title}</div>
          <div className={styles.tooltipContent}>
            <div>Fund: {activeSegmentData.fund}</div>
            <div>Votes: {formatNumber(activeSegmentData.votes)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotesDonutChart;
