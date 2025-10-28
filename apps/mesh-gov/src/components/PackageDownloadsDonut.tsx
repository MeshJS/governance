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

    // Create gradients for each package
    const data = sortedData.map((pkg, index) => {
      const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, 0);
      const hoverGradient = ctx.createLinearGradient(0, canvas.height, canvas.width, 0);

      // Use different teal shades based on index
      const intensity = 0.7 + (index * 0.05);
      const alpha = 0.9 - (index * 0.05);
      
      // Teal gradient with varying intensity
      gradient.addColorStop(0, `rgba(56, 232, 225, ${Math.min(0.95, alpha + 0.1)})`);
      gradient.addColorStop(0.4, `rgba(20, 184, 166, ${Math.min(0.85, alpha)})`);
      gradient.addColorStop(0.8, `rgba(8, 74, 67, ${Math.min(0.8, alpha - 0.05)})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');

      // Teal hover gradient (brighter)
      hoverGradient.addColorStop(0, 'rgba(96, 255, 248, 1)');
      hoverGradient.addColorStop(0.4, 'rgba(34, 211, 238, 0.95)');
      hoverGradient.addColorStop(0.8, 'rgba(12, 100, 90, 0.9)');
      hoverGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

      return {
        name: pkg.name,
        value: pkg.downloads,
        gradient,
        hoverGradient,
        packageName: pkg.packageName || pkg.name,
      };
    });

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

        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 5;
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = segment.name === hoveredPackage ? segment.hoverGradient : segment.gradient;
      ctx.globalAlpha = 1;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = segment.name === hoveredPackage ? 3 : 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = segment.name === hoveredPackage ? 2 : 1;
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
                background: `linear-gradient(135deg, rgba(56, 232, 225, 0.95), rgba(8, 74, 67, 0.8))`
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
