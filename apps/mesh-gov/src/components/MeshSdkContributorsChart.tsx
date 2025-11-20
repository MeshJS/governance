import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Contributor } from '../types';

interface ContributorsEvolutionChartProps {
  contributors: Contributor[];
  height?: number;
  maxContributors?: number;
  globalStartDate?: string;
  globalEndDate?: string;
}

// Custom Tooltip Component
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  // Filter out entries with 0 values, remove duplicates, and sort by value descending
  const uniquePayload = payload.reduce((acc: any[], entry: any) => {
    const existing = acc.find((item: any) => item.dataKey === entry.dataKey);
    if (!existing && entry.value > 0) {
      acc.push(entry);
    }
    return acc;
  }, [] as any[]);

  const filteredPayload = uniquePayload.sort((a: any, b: any) => b.value - a.value);

  if (filteredPayload.length === 0) return null;

  // Show only top 10 contributors to keep tooltip compact
  const maxItems = 10;
  const displayedPayload = filteredPayload.slice(0, maxItems);
  const remainingCount = filteredPayload.length - maxItems;

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '220px',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: 'rgba(0, 0, 0, 0.8)',
          marginBottom: '6px',
          fontWeight: '600',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          paddingBottom: '3px',
        }}
      >
        {label}
      </div>
      {displayedPayload.map((entry, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom:
              index === displayedPayload.length - 1 && remainingCount === 0 ? '0' : '4px',
            fontSize: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '1px',
                backgroundColor: '#000000',
                boxShadow: '0 0 3px rgba(0, 0, 0, 0.3)',
              }}
            />
            <span
              style={{
                color: 'rgba(0, 0, 0, 0.9)',
                fontWeight: '500',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {entry.dataKey}
            </span>
          </div>
          <span
            style={{
              color: 'rgba(0, 0, 0, 0.9)',
              fontWeight: '600',
              minWidth: '20px',
              textAlign: 'right',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {entry.value}
          </span>
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          style={{
            fontSize: '9px',
            color: 'rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            marginTop: '2px',
            fontStyle: 'italic',
          }}
        >
          +{remainingCount} more
        </div>
      )}
    </div>
  );
};

// Generate cohesive white/grey color variations matching the dashboard theme
const generateColor = (login: string, index: number): string => {
  const colors = [
    'rgba(255, 255, 255, 0.95)', // Pure white
    'rgba(255, 255, 255, 0.9)', // Slightly dimmed white
    'rgba(255, 255, 255, 0.85)', // More dimmed white
    'rgba(255, 255, 255, 0.8)', // Dimmed white
    'rgba(255, 255, 255, 0.75)', // More dimmed white
    'rgba(255, 255, 255, 0.7)', // Dimmed white
    'rgba(255, 255, 255, 0.65)', // More dimmed white
    'rgba(255, 255, 255, 0.6)', // Dimmed white
    'rgba(255, 255, 255, 0.55)', // More dimmed white
    'rgba(255, 255, 255, 0.5)', // Dimmed white
    'rgba(255, 255, 255, 0.45)', // More dimmed white
    'rgba(255, 255, 255, 0.4)', // Dimmed white
    'rgba(255, 255, 255, 0.35)', // More dimmed white
    'rgba(255, 255, 255, 0.3)', // Dimmed white
    'rgba(255, 255, 255, 0.25)', // More dimmed white
  ];
  return colors[index % colors.length];
};

// Convert rgba to hex for SVG gradients
const rgbaToRgb = (rgba: string): string => {
  const match = rgba.match(/rgba?\(([^)]+)\)/);
  if (!match) return rgba;
  const values = match[1].split(',').map(v => v.trim());
  return `rgb(${values[0]}, ${values[1]}, ${values[2]})`;
};

// Get bright and dim versions of a color for gradients
const getColorVariations = (baseColor: string) => {
  const rgb = rgbaToRgb(baseColor);
  const match = rgb.match(/rgb\(([^)]+)\)/);
  if (!match) return { bright: baseColor, dim: baseColor };

  const [r, g, b] = match[1].split(',').map(v => parseInt(v.trim()));

  // Create brighter version (increase saturation and brightness)
  const bright = `rgb(${Math.min(255, Math.round(r * 1.2))}, ${Math.min(255, Math.round(g * 1.2))}, ${Math.min(255, Math.round(b * 1.2))})`;

  // Create dimmer version (reduce to about 40% intensity)
  const dim = `rgb(${Math.round(r * 0.4)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.4)})`;

  return { bright, dim };
};

// Get dimmed version of a color for non-selected state
const getDimmedColor = (originalColor: string): string => {
  // Convert to a muted grey for consistency
  return 'rgba(148, 163, 184, 0.4)'; // Slate gray with low opacity
};

// Check if a timestamp falls within the given date range
const isTimestampInRange = (
  timestamp: string,
  startDate: string | null,
  endDate: string | null
): boolean => {
  if (!startDate && !endDate) return true;

  const date = new Date(timestamp);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  // For end date, include the entire day
  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  return (!start || date >= start) && (!end || date <= end);
};

// Custom tick component with no animation effects
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`} style={{ textShadow: 'none', filter: 'none' }}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="rgba(0, 0, 0, 0.6)"
        fontSize={11}
        fontWeight={500}
        transform="rotate(-45)"
        style={{ textShadow: 'none', filter: 'none' }}
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`} style={{ textShadow: 'none', filter: 'none' }}>
      <text
        x={0}
        y={0}
        dy={5}
        textAnchor="end"
        fill="rgba(0, 0, 0, 0.6)"
        fontSize={11}
        fontWeight={500}
        style={{ textShadow: 'none', filter: 'none' }}
      >
        {payload.value}
      </text>
    </g>
  );
};

// Custom Legend Component with dashboard styling
interface CustomLegendProps {
  topContributors: Contributor[];
  selectedContributors: Set<string>;
  onContributorToggle: (login: string) => void;
}

const CustomLegend: React.FC<CustomLegendProps> = ({
  topContributors,
  selectedContributors,
  onContributorToggle,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'center',
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      {topContributors.map((contributor, index) => {
        const isSelected = selectedContributors.has(contributor.login);
        const hasAnySelected = selectedContributors.size > 0;
        const color = generateColor(contributor.login, index);
        const shouldHighlight = !hasAnySelected || isSelected;

        return (
          <div
            key={contributor.login}
            onClick={() => onContributorToggle(contributor.login)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
              background: isSelected
                ? '#ffffff'
                : shouldHighlight
                ? 'rgba(0, 0, 0, 0.03)'
                : 'rgba(0, 0, 0, 0.01)',
              border: `1px solid ${
                isSelected
                  ? 'rgba(0, 0, 0, 0.2)'
                  : shouldHighlight
                  ? 'rgba(0, 0, 0, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)'
              }`,
              opacity: shouldHighlight ? 1 : 0.5,
              transform: isSelected ? 'scale(1.02) translateY(-1px)' : 'scale(1)',
              boxShadow: isSelected
                ? '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)'
                : '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '1px',
                backgroundColor: '#000000',
                border: `1px solid rgba(0, 0, 0, 0.2)`,
                transition: 'all 0.3s ease',
                boxShadow: shouldHighlight ? '0 0 4px rgba(0, 0, 0, 0.2)' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '10px',
                color: isSelected
                  ? '#000000'
                  : shouldHighlight
                  ? 'rgba(0, 0, 0, 0.9)'
                  : 'rgba(0, 0, 0, 0.5)',
                fontWeight: isSelected ? '600' : '500',
                transition: 'all 0.3s ease',
                letterSpacing: '0.01em',
              }}
            >
              {contributor.login}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const MeshSdkContributorsChart: React.FC<ContributorsEvolutionChartProps> = ({
  contributors,
  height = 400,
  maxContributors = 10,
  globalStartDate,
  globalEndDate,
}) => {
  const [selectedContributors, setSelectedContributors] = useState<Set<string>>(new Set());

  const handleContributorToggle = (login: string) => {
    setSelectedContributors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(login)) {
        newSet.delete(login);
      } else {
        newSet.add(login);
      }
      return newSet;
    });
  };

  const chartData = useMemo(() => {
    if (!contributors.length) return null;

    // Sort contributors by total contributions and take top N
    const topContributors = [...contributors]
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, maxContributors);

    // Find the overall date range
    const allTimestamps: string[] = [];

    contributors.forEach(contributor => {
      contributor.repositories.forEach(repo => {
        [...repo.commit_timestamps, ...repo.pr_timestamps].forEach(timestamp => {
          if (isTimestampInRange(timestamp, globalStartDate || null, globalEndDate || null)) {
            allTimestamps.push(timestamp);
          }
        });
      });
    });

    if (allTimestamps.length === 0) return null;

    const sortedTimestamps = allTimestamps.sort();
    let earliestDate = new Date(sortedTimestamps[0]);
    let latestDate = new Date(sortedTimestamps[sortedTimestamps.length - 1]);

    // If global dates are provided, use them as boundaries
    if (globalStartDate) {
      const globalStart = new Date(globalStartDate);
      if (globalStart < earliestDate) {
        earliestDate = globalStart;
      }
    }
    if (globalEndDate) {
      const globalEnd = new Date(globalEndDate);
      if (globalEnd > latestDate) {
        latestDate = globalEnd;
      }
    }

    // Generate monthly data points
    const monthlyData: Array<{ month: string; [key: string]: number | string }> = [];
    const currentDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    const endDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);

    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthData: { month: string; [key: string]: number | string } = { month: monthKey };

      // Initialize all contributors to 0 for this month
      topContributors.forEach(contributor => {
        monthData[contributor.login] = 0;
      });

      // Count contributions for each contributor in this month
      topContributors.forEach(contributor => {
        let monthlyContributions = 0;
        contributor.repositories.forEach(repo => {
          [...repo.commit_timestamps, ...repo.pr_timestamps].forEach(timestamp => {
            if (isTimestampInRange(timestamp, globalStartDate || null, globalEndDate || null)) {
              const date = new Date(timestamp);
              if (
                date.getFullYear() === currentDate.getFullYear() &&
                date.getMonth() === currentDate.getMonth()
              ) {
                monthlyContributions++;
              }
            }
          });
        });
        monthData[contributor.login] = monthlyContributions;
      });

      monthlyData.push(monthData);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return { monthlyData, topContributors };
  }, [contributors, maxContributors, globalStartDate, globalEndDate]);

  if (!chartData?.monthlyData?.length) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(0, 0, 0, 0.6)',
          background: '#ffffff',
          border: '1px dashed rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        No contribution data available for the selected time period
      </div>
    );
  }

  const hasAnySelected = selectedContributors.size > 0;

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={height} debounce={5}>
          <LineChart
            data={chartData.monthlyData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <defs>
              {chartData?.topContributors?.map((contributor: Contributor, index: number) => {
                const isSelected = selectedContributors.has(contributor.login);
                const shouldHighlight = !hasAnySelected || isSelected;

                if (!shouldHighlight) {
                  // Simple gray gradient for non-selected
                  return (
                    <linearGradient
                      key={`gradient-${contributor.login}`}
                      id={`gradient-${contributor.login}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="rgba(148, 163, 184, 0.5)" />
                      <stop offset="100%" stopColor="rgba(148, 163, 184, 0.2)" />
                    </linearGradient>
                  );
                }

                const baseColor = generateColor(contributor.login, index);
                const colorVariations = getColorVariations(baseColor);

                return (
                  <linearGradient
                    key={`gradient-${contributor.login}`}
                    id={`gradient-${contributor.login}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={colorVariations.bright} />
                    <stop offset="50%" stopColor={rgbaToRgb(baseColor)} />
                    <stop offset="100%" stopColor={colorVariations.dim} />
                  </linearGradient>
                );
              }) || []}
            </defs>
            <CartesianGrid
              strokeDasharray="2 2"
              stroke="rgba(0, 0, 0, 0.1)"
              horizontal={true}
              vertical={false}
            />
          <XAxis
            dataKey="month"
            stroke="rgba(0, 0, 0, 0.6)"
            fontSize={11}
            fontWeight={500}
            angle={-45}
            textAnchor="end"
            height={80}
            tick={<CustomXAxisTick />}
            allowDataOverflow={true}
          />
          <YAxis
            stroke="rgba(0, 0, 0, 0.6)"
            fontSize={11}
            fontWeight={500}
            tick={<CustomYAxisTick />}
            allowDataOverflow={true}
          />
            <Tooltip content={<CustomTooltip />} cursor={false} />

            {/* Create elegant thin lines */}
            {chartData?.topContributors?.map((contributor: Contributor, index: number) => {
              const isSelected = selectedContributors.has(contributor.login);
              const shouldHighlight = !hasAnySelected || isSelected;
              const baseColor = generateColor(contributor.login, index);

              return (
                <React.Fragment key={contributor.login}>
                  {/* Main elegant line */}
                  <Line
                    type="monotone"
                    dataKey={contributor.login}
                    stroke="#000000"
                    strokeWidth={shouldHighlight ? 1.5 : 0.8}
                    strokeOpacity={shouldHighlight ? 1 : 0.3}
                    dot={false}
                    activeDot={false}
                    connectNulls={false}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    isAnimationActive={true}
                  />

                  {/* Invisible line for hover detection and tooltip */}
                  <Line
                    type="monotone"
                    dataKey={contributor.login}
                    stroke="transparent"
                    strokeWidth={8}
                    dot={false}
                    activeDot={{
                      r: shouldHighlight ? 4 : 2.5,
                      fill: '#000000',
                      stroke: 'rgba(255, 255, 255, 0.8)',
                      strokeWidth: 1.5,
                      opacity: shouldHighlight ? 1 : 0.5,
                      filter: shouldHighlight
                        ? 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))'
                        : 'none',
                    }}
                    connectNulls={false}
                    isAnimationActive={true}
                  />
                </React.Fragment>
              );
            }) || []}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <CustomLegend
        topContributors={chartData.topContributors || []}
        selectedContributors={selectedContributors}
        onContributorToggle={handleContributorToggle}
      />
    </div>
  );
};

export default MeshSdkContributorsChart;
