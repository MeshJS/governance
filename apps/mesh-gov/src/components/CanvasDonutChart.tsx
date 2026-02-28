import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface GradientStop {
  offset: number;
  color: string;
}

export interface DonutSegment {
  key: string;
  value: number;
  label: string;
  gradientStops: string[] | GradientStop[];
  hoverGradientStops?: string[] | GradientStop[];
}

export interface DonutLegendItem {
  key: string;
  label: string;
  formattedValue: string;
  colorStyle?: React.CSSProperties;
  colorClassName?: string;
  href?: string;
}

interface CanvasDonutChartProps {
  segments: DonutSegment[];
  legend: DonutLegendItem[];
  styles: Record<string, string>;
  title?: string;
  showStrokes?: boolean;
  children?: React.ReactNode;
  onActiveSegmentChange?: (key: string | null) => void;
}

const CanvasDonutChart: React.FC<CanvasDonutChartProps> = ({
  segments,
  legend,
  styles,
  title,
  showStrokes = false,
  children,
  onActiveSegmentChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const total = useMemo(
    () => segments.reduce((sum, seg) => sum + seg.value, 0),
    [segments]
  );

  useEffect(() => {
    onActiveSegmentChange?.(activeSegment);
  }, [activeSegment, onActiveSegmentChange]);

  const computedSegments = useMemo(() => {
    if (total === 0) return [];
    let startAngle = -Math.PI / 2;
    return segments.map(seg => {
      const segmentAngle = (seg.value / total) * (Math.PI * 2);
      const endAngle = startAngle + segmentAngle;
      const result = { key: seg.key, startAngle, endAngle };
      startAngle = endAngle;
      return result;
    });
  }, [segments, total]);

  const drawChart = useCallback(
    (hoveredKey: string | null) => {
      const canvas = canvasRef.current;
      if (!canvas || total === 0) return;

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

      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      computedSegments.forEach((seg, index) => {
        const segData = segments[index];

        ctx.save();

        if (seg.key === hoveredKey) {
          const scale = 1.03;
          ctx.translate(centerX, centerY);
          ctx.scale(scale, scale);
          ctx.translate(-centerX, -centerY);
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 3;
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, seg.startAngle, seg.endAngle);
        ctx.arc(centerX, centerY, innerRadius, seg.endAngle, seg.startAngle, true);
        ctx.closePath();

        const stops =
          seg.key === hoveredKey && segData.hoverGradientStops
            ? segData.hoverGradientStops
            : segData.gradientStops;

        if (stops.length === 1) {
          const s = stops[0];
          ctx.fillStyle = typeof s === 'string' ? s : s.color;
        } else {
          const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, 0);
          stops.forEach((s, i) => {
            if (typeof s === 'string') {
              // Uniform spacing fallback for plain string arrays
              gradient.addColorStop(i / (stops.length - 1), s);
            } else {
              gradient.addColorStop(s.offset, s.color);
            }
          });
          ctx.fillStyle = gradient;
        }
        ctx.globalAlpha = 1;
        ctx.fill();

        if (showStrokes) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, seg.startAngle, seg.endAngle);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = seg.key === hoveredKey ? 3 : 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(centerX, centerY, innerRadius, seg.startAngle, seg.endAngle);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = seg.key === hoveredKey ? 2 : 1;
          ctx.stroke();
        }

        ctx.restore();
      });
    },
    [segments, computedSegments, total, showStrokes]
  );

  useEffect(() => {
    drawChart(activeSegment);
  }, [activeSegment, drawChart]);

  // Redraw on resize
  const activeSegmentRef = useRef(activeSegment);
  activeSegmentRef.current = activeSegment;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      drawChart(activeSegmentRef.current);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawChart]);

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
      const active = computedSegments.find(
        segment => adjustedAngle >= segment.startAngle && adjustedAngle <= segment.endAngle
      );
      setActiveSegment(active ? active.key : null);
    } else {
      setActiveSegment(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setActiveSegment(null);
  };

  return (
    <div className={styles.donutChartContainer}>
      {title && <div className={styles.chartTitle}>{title}</div>}
      <canvas
        ref={canvasRef}
        className={styles.donutChart}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      />
      {children}
      <div className={styles.donutLegend}>
        {legend.map(item => {
          const isActive = activeSegment === item.key;
          const className = `${styles.legendItem} ${isActive ? styles.active : ''}`;

          const content = (
            <>
              <div
                className={item.colorClassName || styles.legendColor}
                style={item.colorStyle}
              />
              <span className={styles.legendLabel}>{item.label}</span>
              <span className={styles.legendValue}>{item.formattedValue}</span>
            </>
          );

          if (item.href) {
            return (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                onMouseEnter={() => setActiveSegment(item.key)}
                onMouseLeave={() => setActiveSegment(null)}
              >
                {content}
              </a>
            );
          }

          return (
            <div
              key={item.key}
              className={className}
              onMouseEnter={() => setActiveSegment(item.key)}
              onMouseLeave={() => setActiveSegment(null)}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CanvasDonutChart;
