import React, { FC, useMemo } from 'react';
import styles from '../styles/MeshStats.module.css';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
  LineChart,
  Line,
  Area,
  ComposedChart,
} from 'recharts';
import PackageDownloadsDonut from './PackageDownloadsDonut';
import SectionTitle from './SectionTitle';
import {
  PackageData,
  MeshStatsViewProps as OriginalMeshStatsViewProps,
  DiscordStats,
  ContributorStats,
  MeshPackagesApiResponse,
} from '../types';

const formatNumber = (num: number | undefined): string => {
  if (num === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

const CustomTooltip = ({
  active,
  payload,
  label,
  chartId,
  isWhiteBackground = false,
}: TooltipProps<number, string> & { chartId?: string; isWhiteBackground?: boolean }) => {
  if (active && payload && payload.length && payload[0].value !== undefined) {
    const unit =
      chartId === 'repositories'
        ? 'repositories'
        : chartId === 'contributions'
          ? 'contributions'
          : chartId === 'contributors'
            ? 'contributors'
            : 'downloads';
    
    const backgroundColor = isWhiteBackground ? 'rgba(255, 255, 255, 0.98)' : 'rgba(0, 0, 0, 0.95)';
    const borderColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';
    const textColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    const labelColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)';
    const valueColor = isWhiteBackground ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)';
    const dividerColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    const indicatorColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 1)';
    const boxShadow = isWhiteBackground 
      ? '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1) inset'
      : '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';
    
    return (
      <div
        style={{
          backgroundColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow,
          backdropFilter: isWhiteBackground ? 'none' : 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: isWhiteBackground ? 'none' : 'blur(20px) saturate(180%)',
          minWidth: '200px',
          maxWidth: '320px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: labelColor,
            marginBottom: '6px',
            fontWeight: '600',
            borderBottom: `1px solid ${dividerColor}`,
            paddingBottom: '3px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '16px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '1px',
                backgroundColor: indicatorColor,
                boxShadow: isWhiteBackground ? 'none' : '0 0 3px rgba(255, 255, 255, 1)',
              }}
            />
            <span style={{ color: textColor, fontWeight: '500' }}>{unit}</span>
          </div>
          <span
            style={{
              color: valueColor,
              fontWeight: '600',
              textShadow: isWhiteBackground ? 'none' : '0 0 4px rgba(255, 255, 255, 0.4)',
            }}
          >
            {formatNumber(payload[0].value)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Add a new custom tooltip for Discord stats
const CustomDiscordTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className={styles.tooltipValue}>
            {entry.name}: <span style={{ color: entry.stroke }}>{formatNumber(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface CustomBarChartProps {
  data: PackageData[];
  chartId: string;
  isWhiteBackground?: boolean;
}

const CustomTick = (props: any) => {
  const { x, y, payload, isWhiteBackground = false, index, hoveredIndex } = props;
  const isHovered = hoveredIndex !== null && hoveredIndex === index;
  const fontSize = isHovered ? 10 : 9;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#000000"
        fontSize={fontSize}
        opacity={1}
        transform="rotate(-60)"
        style={{ 
          fill: '#000000',
          opacity: 1,
          transformOrigin: '0 0',
          transition: 'font-size 0.3s ease'
        }}
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomBarChart = ({ data, chartId, isWhiteBackground = false }: CustomBarChartProps) => {
  const gradientId = `whiteGradient-${chartId}`;
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const handleBarClick = (data: any) => {
    if (data && data.packageName) {
      const npmUrl = `https://www.npmjs.com/package/${data.packageName}`;
      window.open(npmUrl, '_blank');
    }
  };

  const gridColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)';
  const axisColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
  const tickColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.6)';
  const cursorColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)';
  const barColor = isWhiteBackground ? '#ffffff' : `url(#${gradientId})`;
  const barStroke = undefined;
  const barStrokeWidth = 0;
  const barShadowFilter = isWhiteBackground ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' : undefined;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        barGap={8}
        margin={{ top: 10, right: 10, left: -15, bottom: 75 }}
        key={`bar-chart-${chartId}`} // Stable key to prevent unnecessary re-renders
      >
        {!isWhiteBackground && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={{ stroke: axisColor }}
          tick={(props: any) => {
            const allProps = { ...props, isWhiteBackground, hoveredIndex };
            return <CustomTick {...allProps} />;
          }}
          tickLine={{ stroke: axisColor }}
          height={80}
          interval={0}
          tickMargin={8}
        />
        <YAxis
          axisLine={{ stroke: axisColor }}
          tick={{ fill: tickColor, fontSize: 11 }}
          tickLine={{ stroke: axisColor }}
          tickFormatter={value => (value >= 1000 ? `${value / 1000}k` : value)}
        />
        <Tooltip
          content={<CustomTooltip chartId={chartId} isWhiteBackground={isWhiteBackground} />}
          cursor={{ fill: cursorColor }}
        />
        <Bar
          dataKey="downloads"
          fill={barColor}
          stroke={barStroke}
          strokeWidth={barStrokeWidth}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
          onClick={handleBarClick}
          onMouseEnter={(entry: any, index: number) => {
            setHoveredIndex(index);
          }}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{ cursor: 'pointer', filter: barShadowFilter }}
          animationBegin={150}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

interface CustomLineChartProps {
  data: Array<{
    month: string;
    repositories: number;
  }>;
  chartId: string;
  isWhiteBackground?: boolean;
}

// Custom tick component for LineChart
const CustomLineTick = (props: any) => {
  const { x, y, payload, isWhiteBackground = false } = props;
  const textColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)';
  const textShadow = isWhiteBackground ? 'none' : '0px 1px 2px rgba(0, 0, 0, 0.5)';
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill={textColor}
        fontSize="11"
        fontWeight="500"
        transform="rotate(-45)"
        style={{ textShadow }}
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomLineChart = ({ data, chartId, isWhiteBackground = false }: CustomLineChartProps) => {
  const gridColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)';
  const axisColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)';
  const tickColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.6)';
  
  // Use black for white background, white for dark background
  const stroke = isWhiteBackground ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)';
  const r = isWhiteBackground ? 0 : 255;
  const g = isWhiteBackground ? 0 : 255;
  const b = isWhiteBackground ? 0 : 255;

  const bright = `rgb(${Math.min(255, Math.round(r * 1.2))}, ${Math.min(255, Math.round(g * 1.2))}, ${Math.min(255, Math.round(b * 1.2))})`;
  const dim = `rgb(${Math.round(r * 0.4)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.4)})`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 15, right: 20, left: 15, bottom: 65 }}>
        <defs>
          <linearGradient id={`lineGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bright} />
            <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} />
            <stop offset="100%" stopColor={dim} />
          </linearGradient>
          <linearGradient id={`areaGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity={isWhiteBackground ? "0.15" : "0.3"} />
            <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity={isWhiteBackground ? "0.05" : "0.1"} />
            <stop offset="100%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="2 2"
          stroke={gridColor}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          stroke={axisColor}
          height={80}
          tick={<CustomLineTick isWhiteBackground={isWhiteBackground} />}
          tickLine={{ stroke: axisColor }}
          interval={0}
        />
        <YAxis
          stroke={axisColor}
          fontSize={10}
          fontWeight={500}
          tick={{ fill: tickColor }}
        />
        <Tooltip content={<CustomTooltip chartId={chartId} isWhiteBackground={isWhiteBackground} />} cursor={false} />
        <Area
          type="monotone"
          dataKey="repositories"
          fill={`url(#areaGradient-${chartId})`}
          stroke="none"
        />
        <Line
          type="monotone"
          dataKey="repositories"
          stroke={`url(#lineGradient-${chartId})`}
          strokeWidth={1.5}
          strokeOpacity={0.85}
          dot={false}
          activeDot={{
            r: 4,
            fill: stroke,
            stroke: isWhiteBackground ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
            strokeWidth: 1.5,
            filter: isWhiteBackground ? 'none' : `drop-shadow(0 0 6px ${stroke.replace('1)', '0.4)')})`,
          }}
          connectNulls={false}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

interface CustomMultiLineChartProps {
  data: Array<{
    month: string;
    [key: string]: any;
  }>;
  chartId: string;
  lines: Array<{
    dataKey: string;
    name: string;
    stroke: string;
  }>;
  highlightedKey?: string | null;
  isWhiteBackground?: boolean;
}

// Enhanced Repository Dependencies tooltip matching contributors page style
const CustomRepositoryTooltip = ({ active, payload, label, isWhiteBackground = false }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  // Filter to only show Line components (not Area components) to avoid duplicates
  const filteredPayload = payload.filter(
    (entry: any) => entry.name && entry.name !== entry.dataKey
  );

  const backgroundColor = isWhiteBackground ? 'rgba(255, 255, 255, 0.98)' : 'rgba(0, 0, 0, 0.95)';
  const borderColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';
  const textColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const labelColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)';
  const dividerColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
  const boxShadow = isWhiteBackground 
    ? '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1) inset'
    : '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';

  return (
    <div
      style={{
        backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow,
        backdropFilter: isWhiteBackground ? 'none' : 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: isWhiteBackground ? 'none' : 'blur(20px) saturate(180%)',
        maxWidth: '280px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: labelColor,
          marginBottom: '6px',
          fontWeight: '600',
          borderBottom: `1px solid ${dividerColor}`,
          paddingBottom: '3px',
        }}
      >
        {label}
      </div>
      {filteredPayload
        .filter((entry: any) => entry.value != null && entry.value !== undefined)
        .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
        .map((entry: any, index: number, array: any[]) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: index === array.length - 1 ? '0' : '4px',
            fontSize: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '16px', flex: '1', minWidth: 0 }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '1px',
                backgroundColor: entry.color,
                boxShadow: isWhiteBackground ? 'none' : `0 0 3px ${entry.color}`,
                flexShrink: 0,
              }}
            />
            <span style={{ color: textColor, fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.name}
            </span>
          </div>
          <span
            style={{
              color: isWhiteBackground ? '#000000' : entry.color,
              fontWeight: '600',
              textShadow: isWhiteBackground ? 'none' : `0 0 4px ${entry.color}40`,
              marginLeft: '8px',
              flexShrink: 0,
            }}
          >
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomMultiLineChart = ({
  data,
  chartId,
  lines,
  highlightedKey = null,
  isWhiteBackground = false,
}: CustomMultiLineChartProps) => {
  const gridColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)';
  const axisColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)';
  const tickColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.6)';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 15, right: 20, left: 15, bottom: 15 }}>
        <defs>
          {lines.map((line, index) => {
            let r, g, b;
            
            if (isWhiteBackground) {
              // Use pure black for all lines on white background
              r = 0;
              g = 0;
              b = 0;
            } else {
              // Enhanced gradients matching contributors page
              const baseColor = line.stroke;
              const match = baseColor.match(/rgba?\(([^)]+)\)/);
              r = 56;
              g = 232;
              b = 225; // Default teal

              if (match) {
                const values = match[1].split(',').map(v => parseFloat(v.trim()));
                r = values[0];
                g = values[1];
                b = values[2];
              }
            }

            const bright = `rgb(${Math.min(255, Math.round(r * 1.2))}, ${Math.min(255, Math.round(g * 1.2))}, ${Math.min(255, Math.round(b * 1.2))})`;
            const dim = `rgb(${Math.round(r * 0.4)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.4)})`;

            return [
              <linearGradient
                key={`line-${index}`}
                id={`lineGradient-${chartId}-${line.dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={bright} />
                <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} />
                <stop offset="100%" stopColor={dim} />
              </linearGradient>,
              <linearGradient
                key={`area-${index}`}
                id={`areaGradient-${chartId}-${line.dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity={isWhiteBackground ? "0.15" : "0.3"} />
                <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity={isWhiteBackground ? "0.05" : "0.1"} />
                <stop offset="100%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0" />
              </linearGradient>,
            ];
          })}
        </defs>
        <CartesianGrid
          strokeDasharray="2 2"
          stroke={gridColor}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          stroke={axisColor}
          fontSize={9}
          fontWeight={500}
          angle={-60}
          textAnchor="end"
          height={70}
          tick={{ fill: tickColor }}
          tickMargin={8}
          interval={0}
        />
        <YAxis
          stroke={axisColor}
          fontSize={10}
          fontWeight={500}
          tick={{ fill: tickColor }}
        />
        <Tooltip content={<CustomRepositoryTooltip isWhiteBackground={isWhiteBackground} />} cursor={false} />
       {lines.map((line, index) => {
         const isHighlighted = highlightedKey && line.dataKey === highlightedKey;
         return (
           <Area
             key={`area-${index}`}
             type="monotone"
             dataKey={line.dataKey}
             fill={isHighlighted ? (isWhiteBackground ? "#000000" : "#ffffff") : `url(#areaGradient-${chartId}-${line.dataKey})`}
             stroke="none"
             fillOpacity={isHighlighted ? (isWhiteBackground ? 1 : 1) : (highlightedKey ? (isWhiteBackground ? 0.03 : 0.06) : undefined)}
           />
         );
       })}
      {lines.map((line, index) => (
        <Line
          key={`line-${index}`}
          type="monotone"
          name={line.name}
          dataKey={line.dataKey}
          stroke={`url(#lineGradient-${chartId}-${line.dataKey})`}
          strokeWidth={highlightedKey ? (line.dataKey === highlightedKey ? 2.5 : 1) : 1.5}
          strokeOpacity={highlightedKey ? (line.dataKey === highlightedKey ? 1 : 0.25) : 0.85}
          dot={false}
          activeDot={{
            r: 4,
            fill: isWhiteBackground ? '#000000' : line.stroke,
            stroke: isWhiteBackground ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
            strokeWidth: 1.5,
            filter: isWhiteBackground ? 'none' : `drop-shadow(0 0 6px ${line.stroke.replace('1)', '0.4)')})`,
          }}
          connectNulls={false}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

interface CustomSingleLineChartProps {
  data: Array<{
    month: string;
    [key: string]: any;
  }>;
  chartId: string;
  dataKey: string;
  name: string;
  stroke: string;
  yAxisDomain?: [number | string, number | string];
  isWhiteBackground?: boolean;
}

// Enhanced Discord tooltip matching the glassmorphism style
const CustomDiscordSingleTooltip = ({ active, payload, label, isWhiteBackground = false }: TooltipProps<number, string> & { isWhiteBackground?: boolean }) => {
  if (!active || !payload || payload.length === 0) return null;

  // Filter to only show Line components (not Area components) to avoid duplicates
  // Area components don't have a name property, Line components do
  const filteredPayload = payload.filter(
    (entry: any) => entry.name && entry.name !== entry.dataKey
  );
  
  const linePayload = filteredPayload.length > 0 ? filteredPayload[0] : payload[0];
  
  if (!linePayload || (linePayload.value === undefined && linePayload.payload === undefined)) return null;
  
  // Get the value - it might be directly on linePayload or in linePayload.payload
  const value = linePayload.value !== undefined 
    ? linePayload.value 
    : (linePayload.payload && linePayload.dataKey ? linePayload.payload[linePayload.dataKey] : null);
  
  if (value === null || value === undefined) return null;

  const backgroundColor = isWhiteBackground ? 'rgba(255, 255, 255, 0.98)' : 'rgba(0, 0, 0, 0.95)';
  const borderColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';
  const textColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const labelColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)';
  const dividerColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
  const boxShadow = isWhiteBackground 
    ? '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1) inset'
    : '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';
  
  return (
    <div
      style={{
        backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow,
        backdropFilter: isWhiteBackground ? 'none' : 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: isWhiteBackground ? 'none' : 'blur(20px) saturate(180%)',
        maxWidth: '280px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: labelColor,
          marginBottom: '6px',
          fontWeight: '600',
          borderBottom: `1px solid ${dividerColor}`,
          paddingBottom: '3px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '16px' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '1px',
              backgroundColor: linePayload.stroke || linePayload.color,
              boxShadow: isWhiteBackground ? 'none' : `0 0 3px ${linePayload.stroke || linePayload.color}`,
            }}
          />
          <span style={{ color: textColor, fontWeight: '500' }}>
            {linePayload.name || 'Value'}
          </span>
        </div>
        <span
          style={{
            color: isWhiteBackground ? '#000000' : (linePayload.stroke || linePayload.color || '#ffffff'),
            fontWeight: '600',
            textShadow: isWhiteBackground ? 'none' : `0 0 4px ${linePayload.stroke || linePayload.color}40`,
            minWidth: '60px',
            textAlign: 'right',
            whiteSpace: 'nowrap',
          }}
        >
          {formatNumber(value)}
        </span>
      </div>
    </div>
  );
};

// Custom tick component for Discord charts
const CustomDiscordTick = (props: any) => {
  const { x, y, payload, isWhiteBackground = false } = props;
  const textColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)';
  const textShadow = isWhiteBackground ? 'none' : '0px 1px 2px rgba(0, 0, 0, 0.5)';
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill={textColor}
        fontSize="11"
        fontWeight="500"
        transform="rotate(-45)"
        style={{ textShadow }}
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomSingleLineChart = ({
  data,
  chartId,
  dataKey,
  name,
  stroke,
  yAxisDomain,
  isWhiteBackground = false,
}: CustomSingleLineChartProps) => {
  const gridColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)';
  const axisColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)';
  const tickColor = isWhiteBackground ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.6)';
  
  // Enhanced gradients matching contributors page
  const baseColor = stroke;
  const match = baseColor.match(/rgba?\(([^)]+)\)/);
  let r = isWhiteBackground ? 0 : 255;
  let g = isWhiteBackground ? 0 : 255;
  let b = isWhiteBackground ? 0 : 255; // Default black for white background

  if (match) {
    const values = match[1].split(',').map(v => parseFloat(v.trim()));
    r = values[0];
    g = values[1];
    b = values[2];
  }

  const bright = `rgb(${Math.min(255, Math.round(r * 1.2))}, ${Math.min(255, Math.round(g * 1.2))}, ${Math.min(255, Math.round(b * 1.2))})`;
  const dim = `rgb(${Math.round(r * 0.4)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.4)})`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 15, right: 20, left: 15, bottom: 65 }}>
        <defs>
          <linearGradient id={`lineGradient-${chartId}-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bright} />
            <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} />
            <stop offset="100%" stopColor={dim} />
          </linearGradient>
          <linearGradient id={`areaGradient-${chartId}-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity={isWhiteBackground ? "0.15" : "0.3"} />
            <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity={isWhiteBackground ? "0.05" : "0.1"} />
            <stop offset="100%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="2 2"
          stroke={gridColor}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          stroke={axisColor}
          height={80}
          tick={<CustomDiscordTick isWhiteBackground={isWhiteBackground} />}
          tickLine={{ stroke: axisColor }}
          interval={0}
        />
        <YAxis
          stroke={axisColor}
          fontSize={10}
          fontWeight={500}
          tick={{ fill: tickColor }}
          domain={yAxisDomain || ['auto', 'auto']}
        />
        <Tooltip content={<CustomDiscordSingleTooltip isWhiteBackground={isWhiteBackground} />} cursor={false} />
        <Area
          type="monotone"
          dataKey={dataKey}
          fill={`url(#areaGradient-${chartId}-${dataKey})`}
          stroke="none"
        />
        <Line
          type="monotone"
          name={name}
          dataKey={dataKey}
          stroke={`url(#lineGradient-${chartId}-${dataKey})`}
          strokeWidth={1.5}
          strokeOpacity={0.85}
          dot={false}
          activeDot={{
            r: 4,
            fill: stroke,
            stroke: isWhiteBackground ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
            strokeWidth: 1.5,
            filter: isWhiteBackground ? 'none' : `drop-shadow(0 0 6px ${stroke.replace('1)', '0.4)')})`,
          }}
          connectNulls={false}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export interface MeshStatsViewProps extends Omit<OriginalMeshStatsViewProps, 'meshPackagesData'> {
  meshPackagesData?: MeshPackagesApiResponse | null;
  repoStats?: { repoStats: Array<{ name: string; stars: number; forks: number; full_name: string }> } | null;
}

const MeshStatsView: FC<MeshStatsViewProps> = ({
  discordStats,
  contributorStats,
  meshPackagesData,
  repoStats,
}) => {
  // Chart ready state to prevent jarring animations on initial load
  const [chartsReady, setChartsReady] = React.useState(false);

  // Calculate total forks across all repositories
  const totalForks = React.useMemo(() => {
    if (!repoStats?.repoStats || !Array.isArray(repoStats.repoStats)) {
      return 0;
    }
    return repoStats.repoStats.reduce((sum, repo) => sum + (repo.forks || 0), 0);
  }, [repoStats]);

  // Find the @meshsdk/core package
  const corePackage = meshPackagesData?.packages.find(pkg => pkg.name === '@meshsdk/core');
  // Find the @meshsdk/web3-sdk package
  const web3SdkPackage = meshPackagesData?.packages.find(pkg => pkg.name === '@meshsdk/web3-sdk');

  // Set charts ready with a small delay to prevent immediate animation
  React.useEffect(() => {
    if (meshPackagesData?.packages && meshPackagesData.packages.length > 0) {
      const timer = setTimeout(() => setChartsReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [meshPackagesData]);

  // Use all package data for the package comparison chart (all-time downloads)
  const packageData = useMemo(() => {
    return meshPackagesData?.packages
      ? meshPackagesData.packages.map(pkg => ({
          name: pkg.name
            .replace('@meshsdk/', '')
            .replace('-', ' ')
            .replace(/\b\w/g, c => c.toUpperCase()),
          downloads: pkg.last_12_months_downloads, // NPM's most comprehensive download data
          packageName: pkg.name, // Keep original package name for URL generation
        }))
      : [];
  }, [meshPackagesData]);

  // Aggregate monthly downloads across all packages for current year
  const currentYear = new Date().getFullYear();
  const currentMonthIndex1Based = new Date().getMonth() + 1;
  
  // Always show only completed months (previous month is the latest to show)
  const includeCurrentMonth = false; // Never include current month, only show completed months
  const monthlyData = useMemo(() => {
    if (!meshPackagesData?.packages) return [];

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthlyTotals: { [key: number]: number } = {};

    // Aggregate downloads from all packages for current year
    // Include all months up to and including the previous month (completed months)
    meshPackagesData.packages.forEach(pkg => {
      if (pkg.monthly_downloads) {
        pkg.monthly_downloads
          .filter(
            (monthObj: any) =>
              monthObj.year === currentYear && monthObj.month < currentMonthIndex1Based
          )
          .forEach((monthObj: any) => {
            const monthNum = monthObj.month;
            if (!monthlyTotals[monthNum]) {
              monthlyTotals[monthNum] = 0;
            }
            monthlyTotals[monthNum] += monthObj.downloads || 0;
          });
      }
    });

    // Convert to array format sorted by month
    return Object.entries(monthlyTotals)
      .map(([month, downloads]) => ({
        name: `${monthNames[parseInt(month) - 1]} ${currentYear}`,
        downloads: downloads,
      }))
      .sort((a, b) => {
        const aMonth = monthNames.indexOf(a.name.split(' ')[0]) + 1;
        const bMonth = monthNames.indexOf(b.name.split(' ')[0]) + 1;
        return aMonth - bMonth;
      });
  }, [meshPackagesData, currentYear, currentMonthIndex1Based]);

  // Get the latest year for display
  const latestYear =
    monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].name.split(' ')[1] : '';

  // repositoriesData: Use corePackage.package_stats_history for the current year
  const repositoriesData = useMemo(() => {
    if (!corePackage?.package_stats_history) return [];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return corePackage.package_stats_history
      .filter((stat: any) => {
        // stat.month can be 'YYYY-MM' or a number
        if (typeof stat.month === 'string' && stat.month.length === 7) {
          return Number(stat.month.split('-')[0]) === currentYear;
        }
        return false;
      })
      .filter((stat: any) => {
        if (typeof stat.month === 'string' && stat.month.length === 7) {
          const m = Number(stat.month.split('-')[1]);
          // Only show completed months for consistency with other charts
          return m < currentMonthIndex1Based;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        // sort by month number
        const aMonth = typeof a.month === 'string' ? Number(a.month.split('-')[1]) : 0;
        const bMonth = typeof b.month === 'string' ? Number(b.month.split('-')[1]) : 0;
        return aMonth - bMonth;
      })
      .map((stat: any) => {
        const monthIdx = typeof stat.month === 'string' ? Number(stat.month.split('-')[1]) - 1 : 0;
        return {
          month: months[monthIdx],
          repositories: stat.github_dependents_count ?? 0,
        };
      });
  }, [corePackage, currentYear, currentMonthIndex1Based]);

  // web3SdkRepositoriesData: Use historical data + real database data
  const web3SdkRepositoriesData = useMemo(() => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Historical data for web3-sdk launch (March-July 2025)
    const historicalData = [
      { month: 'March', repositories: 18 },
      { month: 'April', repositories: 32 },
      { month: 'May', repositories: 68 },
      { month: 'June', repositories: 98 },
      { month: 'July', repositories: 125 },
    ];

    // Get real data from database for August onwards
    const databaseData = web3SdkPackage?.package_stats_history
      ? web3SdkPackage.package_stats_history
          .filter((stat: any) => {
            if (typeof stat.month === 'string' && stat.month.length === 7) {
              const year = Number(stat.month.split('-')[0]);
              const month = Number(stat.month.split('-')[1]);
              // Only include August 2025 and later, but only show completed months
              return year === currentYear && month >= 8 && month < currentMonthIndex1Based;
            }
            return false;
          })
          .sort((a: any, b: any) => {
            const aMonth = typeof a.month === 'string' ? Number(a.month.split('-')[1]) : 0;
            const bMonth = typeof b.month === 'string' ? Number(b.month.split('-')[1]) : 0;
            return aMonth - bMonth;
          })
          .map((stat: any) => {
            const monthIdx =
              typeof stat.month === 'string' ? Number(stat.month.split('-')[1]) - 1 : 0;
            return {
              month: months[monthIdx],
              repositories: stat.github_dependents_count ?? 0,
            };
          })
      : [];

    // Combine historical and database data
    return [...historicalData, ...databaseData];
  }, [web3SdkPackage, currentYear, currentMonthIndex1Based]);

  // Combined repositories data for both core and web3-sdk
  const combinedRepositoriesData = useMemo(() => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const combined: Record<string, any> = {};

    // Add core data
    repositoriesData.forEach(item => {
      combined[item.month] = {
        month: item.month,
        core: item.repositories,
        web3sdk: 0,
      };
    });

    // Add web3-sdk data
    web3SdkRepositoriesData.forEach(item => {
      if (combined[item.month]) {
        combined[item.month].web3sdk = item.repositories;
      } else {
        combined[item.month] = {
          month: item.month,
          core: 0,
          web3sdk: item.repositories,
        };
      }
    });

    // Convert to array and sort by month order
    return Object.values(combined).sort((a: any, b: any) => {
      return months.indexOf(a.month) - months.indexOf(b.month);
    });
  }, [repositoriesData, web3SdkRepositoriesData]);

  // Package downloads data for 2025 (all available months)
  const historicalPackageDownloads = useMemo(() => {
    if (!meshPackagesData?.packages) return [];

    const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // Only include completed months (exclude current month since it's still in progress)
    const maxMonth = currentMonthIndex1Based - 1; // Previous month is the latest completed month
    const months = allMonths.slice(0, Math.max(1, maxMonth)); // At least include January
    const combined: { [key: string]: any } = {};

    // Initialize months
    months.forEach(month => {
      combined[month] = { month };
    });

    // Process each package's monthly downloads for 2025
    meshPackagesData.packages.forEach(pkg => {
      const monthlyData = pkg.monthly_downloads
        ?.filter(item => item.year === 2025 && item.month >= 1 && item.month <= maxMonth)
        ?.sort((a, b) => a.month - b.month);

      if (monthlyData && monthlyData.length > 0) {
        monthlyData.forEach(item => {
          const monthName = months[item.month - 1];
          const packageKey = pkg.name.replace('@meshsdk/', '').replace('-', '_');
          if (combined[monthName]) {
            combined[monthName][packageKey] = item.downloads || 0;
          }
        });
      }
    });

    // Convert to array and filter out months with no data
    return Object.values(combined).filter((monthData: any) => {
      const hasData = Object.keys(monthData).length > 1; // More than just 'month' property
      return hasData;
    });
  }, [meshPackagesData, currentMonthIndex1Based]);

  // State to control highlighted package in historical downloads chart
  const [highlightedPackageKey, setHighlightedPackageKey] = React.useState<string | null>(null);

  // Badge options derived from the lines config used in the historical chart
  const historicalLines = [
    { name: 'Core', dataKey: 'core', stroke: 'rgba(255, 255, 255, 1)' },
    { name: 'Core CST', dataKey: 'core_cst', stroke: 'rgba(255, 255, 255, 1)' },
    { name: 'Common', dataKey: 'common', stroke: 'rgba(255, 255, 255, 1)' },
    { name: 'Transaction', dataKey: 'transaction', stroke: 'rgba(255, 255, 255, 1)' },
    { name: 'Wallet', dataKey: 'wallet', stroke: 'rgba(255, 255, 255, 1)' },
    { name: 'React', dataKey: 'react', stroke: 'rgba(255, 255, 255, 1)' },
    { name: 'Provider', dataKey: 'provider', stroke: 'rgba(255, 255, 255, 1)' },
    { name: 'Web3 SDK', dataKey: 'web3_sdk', stroke: 'rgba(255, 255, 255, 1)' },
    { name: 'Core CSL', dataKey: 'core_csl', stroke: 'rgba(255, 255, 255, 1)' },
    { name: 'Contract', dataKey: 'contract', stroke: 'rgba(255, 255, 255, 1)' },
  ];

  const handleToggleBadge = (key: string | null) => {
    setHighlightedPackageKey(prev => (prev === key ? null : key));
  };

  // Generate monthly contribution data from timestamp arrays
  const contributionsData = useMemo(() => {
    if (!contributorStats?.contributors) return [];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Initialize monthly data for current year up to previous month only (completed months)
    const monthlyContributions = months.slice(0, currentMonth).map(month => ({
      month,
      contributions: 0,
    }));

    // Process all contributors' timestamps
    contributorStats.contributors.forEach(contributor => {
      contributor.repositories.forEach(repo => {
        // Process commit timestamps
        repo.commit_timestamps?.forEach(timestamp => {
          const date = new Date(timestamp);
          if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth();
            if (monthIndex < currentMonth && monthIndex < monthlyContributions.length) {
              monthlyContributions[monthIndex].contributions += 1;
            }
          }
        });

        // Process PR timestamps
        repo.pr_timestamps?.forEach(timestamp => {
          const date = new Date(timestamp);
          if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth();
            if (monthIndex < currentMonth && monthIndex < monthlyContributions.length) {
              monthlyContributions[monthIndex].contributions += 1;
            }
          }
        });
      });
    });

    return monthlyContributions;
  }, [contributorStats]);

  // Generate monthly contributor growth data
  const contributorsGrowthData = useMemo(() => {
    if (!contributorStats?.contributors) return [];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Calculate cumulative contributors per month (including previously existing ones)
    const monthlyGrowth = months.slice(0, currentMonth).map((month, index) => {
      const activeContributors = new Set<string>();

      contributorStats.contributors.forEach(contributor => {
        let hasContributedByThisMonth = false;

        contributor.repositories.forEach(repo => {
          // Check commit timestamps up to this month
          repo.commit_timestamps?.forEach(timestamp => {
            const date = new Date(timestamp);
            // Include contributions from any year, but only up to the previous month in current year
            if (
              date.getFullYear() < currentYear ||
              (date.getFullYear() === currentYear && date.getMonth() <= index)
            ) {
              hasContributedByThisMonth = true;
            }
          });

          // Check PR timestamps up to this month
          repo.pr_timestamps?.forEach(timestamp => {
            const date = new Date(timestamp);
            // Include contributions from any year, but only up to the previous month in current year
            if (
              date.getFullYear() < currentYear ||
              (date.getFullYear() === currentYear && date.getMonth() <= index)
            ) {
              hasContributedByThisMonth = true;
            }
          });
        });

        if (hasContributedByThisMonth) {
          activeContributors.add(contributor.login);
        }
      });

      return {
        month,
        contributors: activeContributors.size,
      };
    });

    return monthlyGrowth;
  }, [contributorStats]);

  // Format the Discord stats for the chart
  const discordStatsData = useMemo(() => {
    if (!discordStats?.stats) return [];

    // Get sorted months and only filter to show completed months (exclude current month September)
    const sortedMonths = Object.keys(discordStats.stats)
      .filter(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        // Only show completed months - exclude current month (September = 9)
        return yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonthIndex1Based);
      })
      .sort((a, b) => a.localeCompare(b));

    // Create an array of formatted data for the chart using real data only
    return sortedMonths.map(monthKey => {
      const stats = discordStats.stats[monthKey];
      // Extract year and month from the key (format: "YYYY-MM")
      const [year, month] = monthKey.split('-');
      // Convert month number to month name
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const monthName = monthNames[parseInt(month) - 1];

      return {
        month: monthName,
        memberCount: stats.memberCount,
        totalMessages: stats.totalMessages,
        uniquePosters: stats.uniquePosters,
      };
    });
  }, [discordStats, currentYear, currentMonthIndex1Based]);

  // Calculate the minimum member count to create a better visualization
  const memberCountMin = useMemo(() => {
    if (!discordStatsData.length) return 0;

    // Find minimum member count
    const min = Math.min(...discordStatsData.map(d => d.memberCount));

    // Calculate a floor that's ~10% below the minimum (to add some space at the bottom)
    // and round to a nice number
    return Math.floor((min * 0.9) / 100) * 100;
  }, [discordStatsData]);

  // Calculate download metrics across all packages
  const aggregatedMetrics = useMemo(() => {
    if (!meshPackagesData?.packages) {
      return {
        lastWeek: 0,
        lastMonth: 0,
        lastYear: 0,
        allTime: 0,
      };
    }

    // Get current date for calculations
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    let lastWeek = 0;
    let lastMonth = 0;
    let last12Months = 0;
    let allTime = 0;

    meshPackagesData.packages.forEach(pkg => {
      // Use API fields for recent periods (more reliable)
      lastWeek += pkg.last_week_downloads || 0;
      lastMonth += pkg.last_month_downloads || 0;
      last12Months += pkg.last_12_months_downloads || 0;

      // Calculate true all-time from monthly_downloads data
      if (pkg.monthly_downloads && Array.isArray(pkg.monthly_downloads)) {
        const packageAllTime = pkg.monthly_downloads.reduce((sum, monthData) => {
          return sum + (monthData.downloads || 0);
        }, 0);
        allTime += packageAllTime;
      }
    });

    // Validation: All-time should be >= 12 months (if not, monthly data might be incomplete)
    if (allTime < last12Months) {
      console.warn('All-time downloads appear incomplete. Using 12-month data as minimum.');
      allTime = last12Months;
    }

    return {
      lastWeek,
      lastMonth,
      lastYear: last12Months,
      allTime,
    };
  }, [meshPackagesData]);

  return (
    <div data-testid="mesh-stats-view">
      {meshPackagesData?.packages && meshPackagesData.packages.length > 0 && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <h3>Last Week</h3>
              <p>{formatNumber(aggregatedMetrics.lastWeek)}</p>
            </div>
            <div className={styles.stat}>
              <h3>Last Month</h3>
              <p>{formatNumber(aggregatedMetrics.lastMonth)}</p>
            </div>
            <div className={styles.stat}>
              <h3>Last 12 Months</h3>
              <p>{formatNumber(aggregatedMetrics.lastYear)}</p>
            </div>
            <div className={styles.stat}>
              <h3>All Time</h3>
              <p>{formatNumber(aggregatedMetrics.allTime)}</p>
            </div>
          </div>
        </>
      )}

      {packageData.length > 0 && monthlyData.length > 0 && (
        <>
          <div className={styles.chartsContainer}>
            {!chartsReady && (
              <div className={styles.chartsGrid}>
                <div className={styles.chartSection}>
                  <h2>Package Downloads (All Time)</h2>
                  <div
                    className={styles.chart}
                    style={{
                      height: '520px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '14px' }}>
                      Loading chart...
                    </div>
                  </div>
                </div>
                <div className={styles.chartSection}>
                  <h2>Monthly Downloads ({latestYear})</h2>
                  <div
                    className={styles.chart}
                    style={{
                      height: '520px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '14px' }}>
                      Loading chart...
                    </div>
                  </div>
                </div>
              </div>
            )}

            {chartsReady && (
              <div className={styles.chartsGrid}>
                <div className={styles.chartSection}>
                  <h2>Package Downloads (All Time)</h2>
                  <div className={styles.chart} style={{ height: '520px' }}>
                    <PackageDownloadsDonut packageData={packageData} />
                  </div>
                </div>

                <div className={styles.chartSection}>
                  <h2>Monthly Downloads ({latestYear})</h2>
                  <div className={styles.chart} style={{ height: '520px' }}>
                    <CustomBarChart data={monthlyData} chartId="monthly" isWhiteBackground={true} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Historical Package Downloads Chart */}
          {historicalPackageDownloads.length > 0 && (
            <div className={styles.chartsContainer}>
              <div className={styles.chartSection}>
                <h2>Package Downloads per month 2025</h2>
                <div className={styles.badges}>
                  <button
                    type="button"
                    className={`${styles.badge} ${!highlightedPackageKey ? styles.badgeSelected : ''}`}
                    onClick={() => handleToggleBadge(null)}
                  >
                    All
                  </button>
                  {historicalLines.map(line => (
                    <button
                      key={line.dataKey}
                      type="button"
                      className={`${styles.badge} ${highlightedPackageKey === line.dataKey ? styles.badgeSelected : ''}`}
                      onClick={() => handleToggleBadge(line.dataKey)}
                      title={line.name}
                    >
                      {line.name}
                    </button>
                  ))}
                </div>
                <div className={styles.chart} style={{ height: '520px' }}>
                  <CustomMultiLineChart
                    data={historicalPackageDownloads}
                    chartId="historical-downloads"
                    lines={historicalLines}
                    highlightedKey={highlightedPackageKey}
                    isWhiteBackground={true}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {meshPackagesData?.packages.find(pkg => pkg.name === '@meshsdk/core') && (
        <div className={styles.githubStats}>
          <SectionTitle title="GitHub Usage" />
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <h3>Projects Using Mesh</h3>
              <p>
                {formatNumber(
                  (meshPackagesData?.packages.find(pkg => pkg.name === '@meshsdk/core')
                    ?.github_dependents_count || 0) +
                    (meshPackagesData?.packages.find(pkg => pkg.name === '@meshsdk/web3-sdk')
                      ?.github_dependents_count || 0)
                )}
              </p>
            </div>

            {contributorStats && contributorStats.unique_count && (
              <div className={styles.stat}>
                <h3>GitHub Contributors</h3>
                <p>{formatNumber(contributorStats.unique_count)}</p>
              </div>
            )}
            {contributorStats && contributorStats.total_contributions && (
              <div className={styles.stat}>
                <h3>Total Contributions</h3>
                <p>{formatNumber(contributorStats.total_contributions)}</p>
              </div>
            )}
            {totalForks > 0 && (
              <div className={styles.stat}>
                <h3>Total Forks</h3>
                <p>{formatNumber(totalForks)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {((packageData.length > 0 && monthlyData.length > 0 && combinedRepositoriesData.length > 0) || 
        (contributionsData.length > 0 || contributorsGrowthData.length > 0)) && (
        <div className={styles.chartsContainer}>
          {packageData.length > 0 && monthlyData.length > 0 && combinedRepositoriesData.length > 0 && (
            <div className={styles.chartSection}>
              <h2>Repository Dependencies Growth ({new Date().getFullYear()})</h2>
              <div className={styles.chart} style={{ height: '520px' }}>
                <CustomMultiLineChart
                  data={combinedRepositoriesData}
                  chartId="combined-repositories"
                  lines={[
                    {
                      dataKey: 'core',
                      name: 'Mesh SDK',
                      stroke: 'rgba(0, 0, 0, 1)',
                    },
                    {
                      dataKey: 'web3sdk',
                      name: 'Web3 SDK',
                      stroke: 'rgba(0, 0, 0, 1)',
                    },
                  ]}
                  isWhiteBackground={true}
                />
              </div>
            </div>
          )}

          {(contributionsData.length > 0 || contributorsGrowthData.length > 0) && (
            <div className={styles.chartsGrid}>
              {contributionsData.length > 0 && (
                <div className={styles.chartSection}>
                  <h2>Monthly Contributions ({new Date().getFullYear()})</h2>
                  <div className={styles.chart} style={{ height: '520px' }}>
                    <CustomLineChart
                      data={contributionsData.map(item => ({
                        month: item.month,
                        repositories: item.contributions,
                      }))}
                      chartId="contributions"
                      isWhiteBackground={true}
                    />
                  </div>
                </div>
              )}

              {contributorsGrowthData.length > 0 && (
                <div className={styles.chartSection}>
                  <h2>Contributors Growth ({new Date().getFullYear()})</h2>
                  <div className={styles.chart} style={{ height: '520px' }}>
                    <CustomLineChart
                      data={contributorsGrowthData.map(item => ({
                        month: item.month,
                        repositories: item.contributors,
                      }))}
                      chartId="contributors"
                      isWhiteBackground={true}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Discord stats summary and charts */}
      {discordStatsData.length > 0 && (
        <>
          <SectionTitle title="Discord Community" />

          <div className={styles.chartsContainer}>
            <div className={styles.chartsGrid}>
              <div className={styles.chartSection}>
                <h2>Discord Active Users</h2>
                <div className={styles.chart} style={{ height: '520px' }}>
                  <CustomSingleLineChart
                    data={discordStatsData}
                    chartId="discord-posters"
                    dataKey="uniquePosters"
                    name="Unique Posters"
                    stroke="rgba(0, 0, 0, 1)"
                    yAxisDomain={[0, 'auto']}
                    isWhiteBackground={true}
                  />
                </div>
              </div>

              <div className={styles.chartSection}>
                <h2>Discord Messages Activity</h2>
                <div className={styles.chart} style={{ height: '520px' }}>
                  <CustomSingleLineChart
                    data={discordStatsData}
                    chartId="discord-messages"
                    dataKey="totalMessages"
                    name="Messages"
                    stroke="rgba(0, 0, 0, 1)"
                    yAxisDomain={[0, 'auto']}
                    isWhiteBackground={true}
                  />
                </div>
              </div>
            </div>

            <div className={styles.chartSection}>
              <h2>Discord Members Growth</h2>
              <div className={styles.chart} style={{ height: '520px' }}>
                <CustomSingleLineChart
                  data={discordStatsData}
                  chartId="discord-members"
                  dataKey="memberCount"
                  name="Members"
                  stroke="rgba(0, 0, 0, 1)"
                  yAxisDomain={[0, 'auto']}
                  isWhiteBackground={true}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MeshStatsView;
