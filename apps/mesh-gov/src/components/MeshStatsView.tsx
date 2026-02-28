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
import SectionTitle from './SectionTitle';
import {
  PackageData,
  MeshStatsViewProps as OriginalMeshStatsViewProps,
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

interface CustomBarChartProps {
  data: PackageData[];
  chartId: string;
  isWhiteBackground?: boolean;
}

const CustomTick = (props: any) => {
  const { x, y, payload } = props;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#000000"
        fontSize={9}
        opacity={1}
        transform="rotate(-60)"
        style={{
          fill: '#000000',
          opacity: 1,
          transformOrigin: '0 0',
        }}
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomBarChart = ({ data, chartId, isWhiteBackground = false }: CustomBarChartProps) => {
  const gradientId = `whiteGradient-${chartId}`;
  const xAxisInterval = data.length > 12 ? Math.ceil(data.length / 12) - 1 : 0;

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
  const barColor = `url(#${gradientId})`;
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
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {isWhiteBackground ? (
              <>
                <stop offset="0%" stopColor="#999999" />
                <stop offset="100%" stopColor="#ffffff" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#94a3b8" />
              </>
            )}
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={{ stroke: axisColor }}
          tick={(props: any) => <CustomTick {...props} />}
          tickLine={{ stroke: axisColor }}
          height={80}
          interval={xAxisInterval}
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
  const xAxisInterval = data.length > 12 ? Math.ceil(data.length / 12) - 1 : 0;

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
          interval={xAxisInterval}
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
  const xAxisInterval = data.length > 12 ? Math.ceil(data.length / 12) - 1 : 0;

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

            return (
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
              </linearGradient>
            );
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
          interval={xAxisInterval}
        />
        <YAxis
          stroke={axisColor}
          fontSize={10}
          fontWeight={500}
          tick={{ fill: tickColor }}
        />
        <Tooltip content={<CustomRepositoryTooltip isWhiteBackground={isWhiteBackground} />} cursor={false} />
      {lines.map((line, index) => (
        <Line
          key={`line-${index}`}
          type="monotone"
          name={line.name}
          dataKey={line.dataKey}
          stroke={isWhiteBackground ? 'rgba(0, 0, 0, 0.6)' : `url(#lineGradient-${chartId}-${line.dataKey})`}
          strokeWidth={highlightedKey ? (line.dataKey === highlightedKey ? 1.5 : 0.5) : 1}
          strokeOpacity={highlightedKey ? (line.dataKey === highlightedKey ? 1 : 0.2) : 0.7}
          dot={false}
          activeDot={{
            r: 3,
            fill: isWhiteBackground ? '#000000' : line.stroke,
            stroke: isWhiteBackground ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
            strokeWidth: 1,
          }}
          connectNulls={false}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))' }}
        />
      ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export interface MeshStatsViewProps extends Omit<OriginalMeshStatsViewProps, 'meshPackagesData' | 'discordStats'> {
  meshPackagesData?: MeshPackagesApiResponse | null;
  repoStats?: { repoStats: Array<{ name: string; stars: number; forks: number; full_name: string }> } | null;
}

const MeshStatsView: FC<MeshStatsViewProps> = ({
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

  // Cutoff: only show completed months (exclude current in-progress month)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-based

  // Helper to check if a year/month is before the current month (i.e., completed)
  const isCompletedMonth = (year: number, month: number) =>
    year < currentYear || (year === currentYear && month < currentMonth);

  // Set charts ready with a small delay to prevent immediate animation
  React.useEffect(() => {
    if (meshPackagesData?.packages && meshPackagesData.packages.length > 0) {
      const timer = setTimeout(() => setChartsReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [meshPackagesData]);

  // Use all package data for the package comparison chart (all-time downloads)
  // Entry-point packages: only these are counted to avoid double-counting transitive dependencies
  const ENTRY_POINT_PACKAGES = ['@meshsdk/core', '@meshsdk/react', '@meshsdk/contract', '@meshsdk/web3-sdk'];

  // Aggregate monthly downloads for entry-point packages only — full timeline
  const monthlyData = useMemo(() => {
    if (!meshPackagesData?.packages) return [];

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTotals: Record<string, number> = {};

    meshPackagesData.packages
      .filter(pkg => ENTRY_POINT_PACKAGES.includes(pkg.name))
      .forEach(pkg => {
        if (pkg.monthly_downloads) {
          pkg.monthly_downloads
            .filter((m: any) => isCompletedMonth(m.year, m.month))
            .forEach((m: any) => {
              const key = `${m.year}-${String(m.month).padStart(2, '0')}`;
              monthlyTotals[key] = (monthlyTotals[key] || 0) + (m.downloads || 0);
            });
        }
      });

    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, downloads]) => {
        const [year, month] = key.split('-');
        return {
          name: `${shortMonths[parseInt(month) - 1]} ${year}`,
          downloads,
        };
      });
  }, [meshPackagesData, currentYear, currentMonth]);

  // repositoriesData: Use corePackage.package_stats_history — full timeline
  const repositoriesData = useMemo(() => {
    if (!corePackage?.package_stats_history) return [];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return corePackage.package_stats_history
      .filter((stat: any) => {
        if (typeof stat.month === 'string' && stat.month.length === 7) {
          const y = Number(stat.month.split('-')[0]);
          const m = Number(stat.month.split('-')[1]);
          return isCompletedMonth(y, m);
        }
        return false;
      })
      .sort((a: any, b: any) => a.month.localeCompare(b.month))
      .map((stat: any) => {
        const [year, month] = stat.month.split('-');
        return {
          month: `${shortMonths[parseInt(month) - 1]} ${year}`,
          repositories: stat.github_dependents_count ?? 0,
        };
      });
  }, [corePackage, currentYear, currentMonth]);

  // web3SdkRepositoriesData: Use historical data + real database data
  const web3SdkRepositoriesData = useMemo(() => {
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Historical data for web3-sdk launch (March-July 2025)
    const historicalData = [
      { month: 'Mar 2025', repositories: 18 },
      { month: 'Apr 2025', repositories: 32 },
      { month: 'May 2025', repositories: 68 },
      { month: 'Jun 2025', repositories: 98 },
      { month: 'Jul 2025', repositories: 125 },
    ];

    // Get real data from database for August 2025 onwards
    const databaseData = web3SdkPackage?.package_stats_history
      ? web3SdkPackage.package_stats_history
          .filter((stat: any) => {
            if (typeof stat.month === 'string' && stat.month.length === 7) {
              const y = Number(stat.month.split('-')[0]);
              const m = Number(stat.month.split('-')[1]);
              // Only include August 2025 and later
              return (y > 2025 || (y === 2025 && m >= 8)) && isCompletedMonth(y, m);
            }
            return false;
          })
          .sort((a: any, b: any) => a.month.localeCompare(b.month))
          .map((stat: any) => {
            const [year, month] = stat.month.split('-');
            return {
              month: `${shortMonths[parseInt(month) - 1]} ${year}`,
              repositories: stat.github_dependents_count ?? 0,
            };
          })
      : [];

    return [...historicalData, ...databaseData];
  }, [web3SdkPackage, currentYear, currentMonth]);

  // Combined repositories data for both core and web3-sdk
  const combinedRepositoriesData = useMemo(() => {
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

    // Sort chronologically by parsing "Mon YYYY" labels
    return Object.values(combined).sort((a: any, b: any) => {
      const [aM, aY] = a.month.split(' ');
      const [bM, bY] = b.month.split(' ');
      const aIdx = shortMonths.indexOf(aM) + parseInt(aY) * 12;
      const bIdx = shortMonths.indexOf(bM) + parseInt(bY) * 12;
      return aIdx - bIdx;
    });
  }, [repositoriesData, web3SdkRepositoriesData]);

  // Generate monthly contribution data from timestamp arrays — full timeline
  const contributionsData = useMemo(() => {
    if (!contributorStats?.contributors) return [];

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totals: Record<string, number> = {};

    contributorStats.contributors.forEach(contributor => {
      contributor.repositories.forEach(repo => {
        const processTimestamp = (timestamp: string) => {
          const date = new Date(timestamp);
          const y = date.getFullYear();
          const m = date.getMonth() + 1;
          if (isCompletedMonth(y, m)) {
            const key = `${y}-${String(m).padStart(2, '0')}`;
            totals[key] = (totals[key] || 0) + 1;
          }
        };
        repo.commit_timestamps?.forEach(processTimestamp);
        repo.pr_timestamps?.forEach(processTimestamp);
      });
    });

    return Object.entries(totals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, contributions]) => {
        const [year, month] = key.split('-');
        return { month: `${shortMonths[parseInt(month) - 1]} ${year}`, contributions };
      });
  }, [contributorStats, currentYear, currentMonth]);

  // Generate monthly contributor growth data
  // Cumulative contributor growth — full timeline
  const contributorsGrowthData = useMemo(() => {
    if (!contributorStats?.contributors) return [];

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Collect all completed year-month keys from contributor timestamps
    const allKeys = new Set<string>();
    contributorStats.contributors.forEach(contributor => {
      contributor.repositories.forEach(repo => {
        const addKey = (timestamp: string) => {
          const d = new Date(timestamp);
          const y = d.getFullYear();
          const m = d.getMonth() + 1;
          if (isCompletedMonth(y, m)) {
            allKeys.add(`${y}-${String(m).padStart(2, '0')}`);
          }
        };
        repo.commit_timestamps?.forEach(addKey);
        repo.pr_timestamps?.forEach(addKey);
      });
    });

    const sortedKeys = [...allKeys].sort();
    if (sortedKeys.length === 0) return [];

    // For each month, count cumulative unique contributors up to that point
    return sortedKeys.map(key => {
      const [keyYear, keyMonth] = key.split('-').map(Number);
      const activeContributors = new Set<string>();

      contributorStats.contributors.forEach(contributor => {
        let contributed = false;
        contributor.repositories.forEach(repo => {
          const check = (timestamp: string) => {
            const d = new Date(timestamp);
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            if (y < keyYear || (y === keyYear && m <= keyMonth)) {
              contributed = true;
            }
          };
          repo.commit_timestamps?.forEach(check);
          repo.pr_timestamps?.forEach(check);
        });
        if (contributed) activeContributors.add(contributor.login);
      });

      return {
        month: `${shortMonths[keyMonth - 1]} ${keyYear}`,
        contributors: activeContributors.size,
      };
    });
  }, [contributorStats, currentYear, currentMonth]);

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

    meshPackagesData.packages
      .filter(pkg => ENTRY_POINT_PACKAGES.includes(pkg.name))
      .forEach(pkg => {
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

      {monthlyData.length > 0 && (
        <div className={styles.chartsContainer}>
          {!chartsReady && (
            <div className={styles.chartSection}>
              <h2>Monthly Downloads</h2>
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
          )}

          {chartsReady && (
            <div className={styles.chartSection}>
              <h2>Monthly Downloads</h2>
              <div className={styles.chart} style={{ height: '520px' }}>
                <CustomBarChart data={monthlyData} chartId="monthly" isWhiteBackground={true} />
              </div>
            </div>
          )}
        </div>
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

      {(combinedRepositoriesData.length > 0 ||
        contributionsData.length > 0 || contributorsGrowthData.length > 0) && (
        <div className={styles.chartsContainer}>
          {combinedRepositoriesData.length > 0 && (
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

    </div>
  );
};

export default MeshStatsView;
