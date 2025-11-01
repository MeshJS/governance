import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../styles/MeshStats.module.css';
import { PackageData } from '../types';

interface PackageDownloadsDonutProps {
  packageData: PackageData[];
}

const PackageDownloadsDonut = ({ packageData }: PackageDownloadsDonutProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [segments, setSegments] = useState<
    Array<{
      name: string;
      startAngle: number;
      endAngle: number;
    }>
  >([]);

  const drawChart = useCallback((hoveredPackage: string | null) => {
    const canvas = canvasRef.current;
    if (!canvas || !packageData || packageData.length === 0) return;

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

    // Calculate total downloads
    const totalDownloads = packageData.reduce((sum, pkg) => sum + pkg.downloads, 0);

    // Sort data by downloads (descending)
    const sortedData = [...packageData].sort((a, b) => b.downloads - a.downloads);

    // Create solid colors for each package
    const data = sortedData.map((pkg, index) => {
      // White color for all slices
      const fillColor = '#ffffff';
      // Black color for hover
      const hoverFillColor = '#000000';

      return {
        name: pkg.name,
        value: pkg.downloads,
        fillColor,
        hoverFillColor,
        packageName: pkg.packageName || pkg.name,
      };
    });

    // Draw donut chart
    const centerX = canvas.width / (2 * dpr);
    const centerY = canvas.height / (2 * dpr);
    const radius = Math.min(centerX, centerY) * 0.8;
    const innerRadius = radius * 0.6;

    // No shadow effects
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    let startAngle = -Math.PI / 2;
    const newSegments: typeof segments = [];

    // Draw segments
    data.forEach((segment, index) => {
      const segmentAngle = (segment.value / totalDownloads) * (Math.PI * 2);
      const endAngle = startAngle + segmentAngle;

      newSegments.push({
        name: segment.name,
        startAngle,
        endAngle,
      });

      ctx.save();

      if (segment.name === hoveredPackage) {
        const scale = 1.03;
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      // Use solid colors instead of gradients
      ctx.fillStyle = segment.name === hoveredPackage ? segment.hoverFillColor : segment.fillColor;
      ctx.globalAlpha = 1;
      ctx.fill();

      // Simple black borders - outer and inner arcs
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw radial borders between segments (at end angle for each segment)
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(endAngle) * innerRadius,
        centerY + Math.sin(endAngle) * innerRadius
      );
      ctx.lineTo(
        centerX + Math.cos(endAngle) * radius,
        centerY + Math.sin(endAngle) * radius
      );
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      startAngle = endAngle;
    });

    setSegments(newSegments);
  }, [packageData]);

  useEffect(() => {
    drawChart(activeSegment);
  }, [packageData, activeSegment, drawChart]);

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
      setActiveSegment(activeSegment ? activeSegment.name : null);
    } else {
      setActiveSegment(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setActiveSegment(null);
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Calculate percentage
  const calculatePercentage = (value: number): string => {
    const totalDownloads = packageData.reduce((sum, pkg) => sum + pkg.downloads, 0);
    return ((value / totalDownloads) * 100).toFixed(1) + '%';
  };

  // Sort data by downloads (descending)
  const sortedData = [...packageData].sort((a, b) => b.downloads - a.downloads);

  return (
    <div className={styles.donutChartContainer}>
      <canvas
        ref={canvasRef}
        className={styles.donutChart}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      ></canvas>
      <div className={styles.donutLegend}>
        {sortedData.map((pkg) => (
          <div
            key={pkg.name}
            className={`${styles.legendItem} ${activeSegment === pkg.name ? styles.active : ''}`}
            onMouseEnter={() => setActiveSegment(pkg.name)}
            onMouseLeave={() => setActiveSegment(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className={styles.legendColor} style={{ 
                background: activeSegment === pkg.name 
                  ? `rgba(0, 0, 0, 0.9)` 
                  : `rgba(255, 255, 255, 0.9)`,
                border: activeSegment === pkg.name
                  ? `1px solid rgba(0, 0, 0, 0.3)`
                  : `1px solid rgba(0, 0, 0, 0.2)`
              }} />
              <span className={styles.legendLabel}>{pkg.name}</span>
            </div>
            <span className={styles.legendValue}>{formatNumber(pkg.downloads)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageDownloadsDonut;
