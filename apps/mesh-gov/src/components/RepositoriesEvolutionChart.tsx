import React, { useMemo, useState, useEffect } from 'react';
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

interface RepositoriesEvolutionChartProps {
  contributors: Contributor[];
  height?: number;
  maxRepositories?: number;
  globalStartDate?: string;
  globalEndDate?: string;
}

// Repository data structure for tracking
interface RepositoryData {
  name: string;
  contributions: number;
  commits: number;
  pullRequests: number;
  contributors: string[];
}

// Custom Tooltip Component
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  isSticky?: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  isSticky = false,
}) => {
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

  // Show only top 10 repositories to keep tooltip compact
  const maxItems = 10;
  const displayedPayload = filteredPayload.slice(0, maxItems);
  const remainingCount = filteredPayload.length - maxItems;

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        border: `1px solid ${isSticky ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)'}`,
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: `0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1) inset`,
        maxWidth: '220px',
        position: 'relative',
      }}
    >
      {isSticky && (
        <div
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            color: 'black',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          ×
        </div>
      )}
      <div
        style={{
          fontSize: '11px',
          color: 'rgba(0, 0, 0, 0.8)',
          marginBottom: '6px',
          fontWeight: '600',
          borderBottom: '1px solid rgba(0, 0, 0, 0.2)',
          paddingBottom: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{label}</span>
        {isSticky && (
          <span
            style={{
              fontSize: '9px',
              color: 'rgba(0, 0, 0, 0.6)',
              fontWeight: '500',
            }}
          >
            Pinned
          </span>
        )}
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
                backgroundColor: entry.color,
                boxShadow: `0 0 3px ${entry.color}`,
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
              color: 'rgba(0, 0, 0, 0.7)',
              fontWeight: '600',
              minWidth: '20px',
              textAlign: 'right',
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

// Generate harmonious, elegant colors for each project line
const generateColor = (repoName: string, index: number): string => {
  const colors = [
    '#1a1a1a', // Deep charcoal
    '#4a5568', // Slate gray
    '#2d3748', // Dark slate
    '#718096', // Medium gray
    '#4a5568', // Slate
    '#2c5282', // Deep blue-gray
    '#2c7a7b', // Teal-gray
    '#744210', // Warm brown
    '#553c9a', // Muted purple
    '#7c2d12', // Burnt sienna
    '#1e3a8a', // Navy blue
    '#065f46', // Forest green
    '#6b21a8', // Deep purple
    '#831843', // Deep rose
    '#78350f', // Dark amber
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

// Repository name mapping for display
const getDisplayName = (repoName: string): string => {
  const nameMapping: { [key: string]: string } = {
    mesh: 'MESH SDK',
    'web3-services': 'UTXOS',
    'web3-sdk': 'UTXOS SDK',
  };

  return nameMapping[repoName.toLowerCase()] || repoName.toUpperCase();
};

// Custom Legend Component with dashboard styling
interface CustomLegendProps {
  topRepositories: RepositoryData[];
  selectedRepositories: Set<string>;
  onRepositoryToggle: (repoName: string) => void;
}

const CustomLegend: React.FC<CustomLegendProps> = ({
  topRepositories,
  selectedRepositories,
  onRepositoryToggle,
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
      {topRepositories.map((repository, index) => {
        const isSelected = selectedRepositories.has(repository.name);
        const hasAnySelected = selectedRepositories.size > 0;
        const color = generateColor(repository.name, index);
        const shouldHighlight = !hasAnySelected || isSelected;

        return (
          <div
            key={repository.name}
            onClick={() => onRepositoryToggle(repository.name)}
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
                ? '0 0 15px rgba(0, 0, 0, 0.2)'
                : '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '1px',
                backgroundColor: color,
                opacity: shouldHighlight ? 1 : 0.3,
                border: `1px solid ${
                  isSelected
                    ? 'rgba(0, 0, 0, 0.2)'
                    : shouldHighlight
                    ? 'rgba(0, 0, 0, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }`,
                transition: 'all 0.3s ease',
                boxShadow: shouldHighlight && !isSelected ? `0 0 4px ${color}40` : 'none',
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
              {repository.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const RepositoriesEvolutionChart: React.FC<RepositoriesEvolutionChartProps> = ({
  contributors,
  height = 480, // INCREASED HEIGHT: Use space from removed badges
  maxRepositories = 10,
  globalStartDate,
  globalEndDate,
}) => {
  const [selectedRepositories, setSelectedRepositories] = useState<Set<string>>(new Set());
  const [stickyTooltip, setStickyTooltip] = useState<{
    active: boolean;
    payload: any[];
    label: string;
    coordinate: { x: number; y: number };
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleRepositoryToggle = (repoName: string) => {
    setSelectedRepositories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(repoName)) {
        newSet.delete(repoName);
      } else {
        newSet.add(repoName);
      }
      return newSet;
    });
  };

  const chartData = useMemo(() => {
    if (!contributors.length) return null;

    // Aggregate all repositories with their contributions
    const repositoryMap = new Map<string, RepositoryData>();

    contributors.forEach(contributor => {
      contributor.repositories.forEach(repo => {
        const filteredCommits = repo.commit_timestamps.filter(timestamp =>
          isTimestampInRange(timestamp, globalStartDate || null, globalEndDate || null)
        );
        const filteredPRs = repo.pr_timestamps.filter(timestamp =>
          isTimestampInRange(timestamp, globalStartDate || null, globalEndDate || null)
        );

        if (!repositoryMap.has(repo.name)) {
          repositoryMap.set(repo.name, {
            name: repo.name,
            contributions: 0,
            commits: 0,
            pullRequests: 0,
            contributors: [],
          });
        }

        const repoData = repositoryMap.get(repo.name)!;
        repoData.contributions += filteredCommits.length + filteredPRs.length;
        repoData.commits += filteredCommits.length;
        repoData.pullRequests += filteredPRs.length;

        if (!repoData.contributors.includes(contributor.login)) {
          repoData.contributors.push(contributor.login);
        }
      });
    });

    // Convert to array and sort by total contributions
    const allRepositories = Array.from(repositoryMap.values()).sort(
      (a, b) => b.contributions - a.contributions
    );

    // Ensure mimir repository is always included
    const mimirRepo = allRepositories.find(repo => repo.name.toLowerCase() === 'mimir');
    let topRepositories = allRepositories.slice(0, maxRepositories);

    // If mimir exists but isn't in top repositories, replace the last one with mimir
    if (mimirRepo && !topRepositories.some(repo => repo.name.toLowerCase() === 'mimir')) {
      topRepositories = topRepositories.slice(0, maxRepositories - 1);
      topRepositories.push(mimirRepo);
    }

    if (topRepositories.length === 0) return null;

    // Find the overall date range from all timestamps
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

      // Initialize all repositories to 0 for this month
      topRepositories.forEach(repository => {
        monthData[repository.name] = 0;
      });

      // Count contributions for each repository in this month
      topRepositories.forEach(repository => {
        let monthlyContributions = 0;
        contributors.forEach(contributor => {
          const repo = contributor.repositories.find(r => r.name === repository.name);
          if (repo) {
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
          }
        });
        monthData[repository.name] = monthlyContributions;
      });

      monthlyData.push(monthData);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return { monthlyData, topRepositories };
  }, [contributors, maxRepositories, globalStartDate, globalEndDate]);

  const handlePointClick = (data: any, event: any) => {
    if (stickyTooltip && stickyTooltip.label === data.month) {
      // Close sticky tooltip if clicking the same point
      setStickyTooltip(null);
    } else {
      // Create sticky tooltip data
      const dataPoint = chartData?.monthlyData?.find((d: any) => d.month === data.month);
      if (dataPoint) {
        const payload = Object.keys(dataPoint)
          .filter(key => key !== 'month')
          .map((key, index) => ({
            dataKey: key,
            value: dataPoint[key] as number,
            color: generateColor(key, index),
          }))
          .filter(entry => entry.value > 0)
          .sort((a, b) => b.value - a.value);

        setStickyTooltip({
          active: true,
          payload,
          label: data.month,
          coordinate: { x: event.chartX || 0, y: event.chartY || 0 },
        });
      }
    }
  };

  const handleChartClick = (event: any) => {
    // Close sticky tooltip when clicking elsewhere on the chart
    if (!event.activeLabel) {
      setStickyTooltip(null);
    }
  };

  if (!chartData?.monthlyData?.length) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.6)',
          background:
            'linear-gradient(165deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.005) 100%)',
          backdropFilter: 'blur(10px) saturate(180%)',
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        No repository data available for the selected time period
      </div>
    );
  }

  const hasAnySelected = selectedRepositories.size > 0;

  return (
    <div
      style={{
        display: 'flex',
        gap: isMobile ? '1.5rem' : '2rem',
        alignItems: 'flex-start',
        flexDirection: isMobile ? 'column' : 'row',
        position: 'relative',
      }}
    >
      {/* Chart Section */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          marginRight: isMobile ? '0' : '313px', // Make space for Activity panel (280px + 1.5rem spacing)
        }}
      >
        <div style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={chartData.monthlyData}
              margin={{
                top: 15,
                right: 20,
                left: 15,
                bottom: 15,
              }}
              onClick={handleChartClick}
            >
              <defs>
                {chartData?.topRepositories?.map((repository: RepositoryData, index: number) => {
                  const isSelected = selectedRepositories.has(repository.name);
                  const shouldHighlight = !hasAnySelected || isSelected;

                  const baseColor = generateColor(repository.name, index);
                  
                  if (!shouldHighlight) {
                    // Dimmed version for non-selected
                    return (
                      <linearGradient
                        key={`gradient-${repository.name}`}
                        id={`gradient-repo-${repository.name}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={baseColor} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={baseColor} stopOpacity="0.15" />
                      </linearGradient>
                    );
                  }

                  return (
                    <linearGradient
                      key={`gradient-${repository.name}`}
                      id={`gradient-repo-${repository.name}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={baseColor} stopOpacity="1" />
                      <stop offset="100%" stopColor={baseColor} stopOpacity="0.8" />
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
                fontSize={10}
                fontWeight={500}
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: 'rgba(0, 0, 0, 0.6)' }}
              />
              <YAxis
                stroke="rgba(0, 0, 0, 0.6)"
                fontSize={10}
                fontWeight={500}
                tick={{ fill: 'rgba(0, 0, 0, 0.6)' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />

              {/* Create elegant thin lines */}
              {chartData?.topRepositories?.map((repository: RepositoryData, index: number) => {
                const isSelected = selectedRepositories.has(repository.name);
                const shouldHighlight = !hasAnySelected || isSelected;
                const baseColor = generateColor(repository.name, index);

                return (
                  <React.Fragment key={repository.name}>
                    {/* Main elegant line */}
                    <Line
                      type="monotone"
                      dataKey={repository.name}
                      stroke={baseColor}
                      strokeWidth={shouldHighlight ? 1.5 : 0.8}
                      strokeOpacity={shouldHighlight ? 1 : 0.3}
                      dot={false}
                      activeDot={false}
                      connectNulls={false}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      onClick={handlePointClick}
                    />

                    {/* Invisible line for hover detection and tooltip */}
                    <Line
                      type="monotone"
                      dataKey={repository.name}
                      stroke="transparent"
                      strokeWidth={8}
                      dot={false}
                      activeDot={{
                        r: shouldHighlight ? 4 : 2.5,
                        fill: baseColor,
                        stroke: 'rgba(255, 255, 255, 0.8)',
                        strokeWidth: 1.5,
                        opacity: shouldHighlight ? 1 : 0.5,
                        filter: shouldHighlight
                          ? `drop-shadow(0 0 4px ${baseColor})`
                          : 'none',
                      }}
                      connectNulls={false}
                    />
                  </React.Fragment>
                );
              }) || []}
            </LineChart>
          </ResponsiveContainer>

          {/* Sticky Tooltip Overlay */}
          {stickyTooltip && (
            <div
              style={{
                position: 'absolute',
                left: `${stickyTooltip.coordinate.x}px`,
                top: `${stickyTooltip.coordinate.y}px`,
                transform: 'translate(-50%, -100%)',
                marginTop: '-10px',
                zIndex: 1000,
                pointerEvents: 'auto',
              }}
              onClick={e => {
                e.stopPropagation();
                setStickyTooltip(null);
              }}
            >
              <CustomTooltip
                active={true}
                payload={stickyTooltip.payload}
                label={stickyTooltip.label}
                isSticky={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Activity Panel */}
      <div
        style={{
          width: isMobile ? '100%' : '280px',
          flexShrink: 0,
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          height: isMobile ? 'auto' : `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'relative' : 'absolute',
          top: isMobile ? 'auto' : '-2.5rem',
          right: isMobile ? 'auto' : '1.5rem',
          boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)',
        }}
      >
        <h4
          style={{
            margin: '0 0 1rem 0',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'rgba(0, 0, 0, 0.9)',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          Activity
        </h4>
        <div
          className="activity-scroll-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '0.5rem',
            marginRight: '-0.5rem',
          }}
        >
          {chartData?.topRepositories?.map((repository: RepositoryData, index: number) => {
            const isSelected = selectedRepositories.has(repository.name);
            const hasAnySelected = selectedRepositories.size > 0;
            const shouldHighlight = !hasAnySelected || isSelected;
            const color = generateColor(repository.name, index);

            return (
              <div
                key={repository.name}
                onClick={() => handleRepositoryToggle(repository.name)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isSelected
                    ? '#000000'
                    : shouldHighlight
                    ? 'rgba(0, 0, 0, 0.03)'
                    : '#ffffff',
                  border: `1px solid ${
                    isSelected
                      ? 'rgba(0, 0, 0, 0.2)'
                      : shouldHighlight
                      ? 'rgba(0, 0, 0, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)'
                  }`,
                  opacity: shouldHighlight ? 1 : 0.6,
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleRepositoryToggle(repository.name)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    marginTop: '2px',
                    accentColor: '#000000',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: isSelected
                        ? '#ffffff'
                        : shouldHighlight
                        ? 'rgba(0, 0, 0, 0.9)'
                        : 'rgba(0, 0, 0, 0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {getDisplayName(repository.name)}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: isSelected
                        ? 'rgba(255, 255, 255, 0.8)'
                        : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: '500',
                    }}
                  >
                    Contributions: {repository.contributions}
                  </div>
                </div>
              </div>
            );
          }) || []}
        </div>
      </div>
    </div>
  );
};

export default RepositoriesEvolutionChart;
