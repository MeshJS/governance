import { useEffect, useRef, useState } from 'react';
import styles from '../styles/ContributorModal.module.css';

interface ContributorRepository {
  name: string;
  commits: number;
  contributions: number;
  pull_requests: number;
}

interface RepoDonutChartProps {
  repositories: ContributorRepository[];
}

// Repository colors
const colors = [
  '#38E8E1', // cyan
  '#FF78CB', // pink
  '#94A3B8', // gray
  '#22C55E', // green
  '#EAB308', // yellow
  '#EC4899', // magenta
  '#8B5CF6', // purple
  '#F97316', // orange
  '#06B6D4', // light blue
  '#10B981', // emerald
];

// Consistent color mapping for repositories
const REPO_COLORS: { [key: string]: number } = {
  mesh: 140, // Green
  multisig: 200, // Blue
  examples: 280, // Purple
  'mesh-pbl': 320, // Pink
  'mesh.ai': 20, // Orange
  funding: 60, // Yellow
  'mesh-saas': 180, // Cyan
  governance: 240, // Indigo
  Others: 0, // Red
};

// Default hue for unknown repositories
const DEFAULT_HUE = 100;

// Use white gradient for the donut charts
const GRADIENT_STOPS = [
  { stop: 0, color: '#FFFFFF' }, // White
  { stop: 0.4, color: '#E6E6E6' }, // Light gray
  { stop: 0.8, color: '#CCCCCC' }, // Medium gray
  { stop: 1, color: '#000' }, // Black
];

// Generate a canvas gradient for the chart and a CSS gradient for the legend
function getCanvasGradient(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const grad = ctx.createLinearGradient(0, height, width, 0);
  GRADIENT_STOPS.forEach(({ stop, color }) => grad.addColorStop(stop, color));
  return grad;
}
const LEGEND_GRADIENT = `linear-gradient(135deg, #FFFFFF 0%, #E6E6E6 40%, #CCCCCC 80%, #000 100%)`;

const RepoDonutChart: React.FC<RepoDonutChartProps> = ({ repositories }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [segments, setSegments] = useState<
    Array<{
      name: string;
      startAngle: number;
      endAngle: number;
    }>
  >([]);

  // Sort repositories by contribution count and take top 12
  const topRepos = [...repositories].sort((a, b) => b.contributions - a.contributions).slice(0, 12);

  // Combine remaining repositories into "Others"
  const otherRepos = repositories.slice(12);
  const otherContributions = otherRepos.reduce((sum, repo) => sum + repo.contributions, 0);
  const otherCommits = otherRepos.reduce((sum, repo) => sum + repo.commits, 0);
  const otherPRs = otherRepos.reduce((sum, repo) => sum + repo.pull_requests, 0);

  // Final data for visualization
  const chartData =
    otherContributions > 0
      ? [
          ...topRepos,
          {
            name: 'Others',
            contributions: otherContributions,
            commits: otherCommits,
            pull_requests: otherPRs,
          },
        ]
      : topRepos;

  // Generate color for each repository (all use the same gradient)
  const data = chartData.map(repo => {
    return {
      name: repo.name,
      value: repo.contributions,
      commits: repo.commits,
      pull_requests: repo.pull_requests,
      color: LEGEND_GRADIENT,
    };
  });

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

    // Calculate total contributions
    const total = chartData.reduce((sum, repo) => sum + repo.contributions, 0);

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
        name: segment.name,
        startAngle,
        endAngle,
      });

      // Save context for transformation
      ctx.save();

      // Apply hover effect if this is the active segment
      if (segment.name === isHovered) {
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
      ctx.fillStyle = getCanvasGradient(ctx, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.fill();

      // Restore context
      ctx.restore();

      startAngle = endAngle;
    });

    setSegments(newSegments);
  };

  useEffect(() => {
    drawChart(activeSegment);
  }, [repositories, activeSegment]);

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
      const activeSegment = segments.find(
        segment => adjustedAngle >= segment.startAngle && adjustedAngle <= segment.endAngle
      );
      setActiveSegment(activeSegment ? activeSegment.name : null);
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
        data-active-slice={activeSegment || undefined}
      ></canvas>
      <div className={styles.donutLegend}>
        {data.map(repo => (
          <a
            key={repo.name}
            href={
              repo.name === 'Others'
                ? 'https://github.com/MeshJS'
                : `https://github.com/MeshJS/${repo.name}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className={styles.legendItem}
            data-active={activeSegment === repo.name || undefined}
            onMouseEnter={() => setActiveSegment(repo.name)}
            onMouseLeave={() => setActiveSegment(null)}
            style={{}}
          >
            <span className={styles.legendColor} style={{ background: LEGEND_GRADIENT }}></span>
            <span className={styles.legendLabel}>{repo.name}</span>
            <div className={styles.legendValueGroup}>
              <span className={styles.legendValue}>{repo.value}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default RepoDonutChart;
