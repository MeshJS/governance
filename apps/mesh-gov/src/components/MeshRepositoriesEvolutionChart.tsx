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
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
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
const generateColor = (repoName: string, index: number): string => {
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

// Repository name mapping for display
const getDisplayName = (repoName: string): string => {
  const nameMapping: { [key: string]: string } = {
    mesh: 'MESH SDK',
    'web3-services': 'UTXOS',
    'web3-sdk': 'UTXOS SDK',
  };

  return nameMapping[repoName.toLowerCase()] || repoName.toUpperCase();
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
        fontSize={10}
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
        fontSize={10}
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
              background: shouldHighlight
                ? 'rgba(0, 0, 0, 0.03)'
                : 'rgba(0, 0, 0, 0.01)',
              border: `1px solid ${
                shouldHighlight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              }`,
              opacity: shouldHighlight ? 1 : 0.5,
              transform: isSelected ? 'scale(1.02) translateY(-1px)' : 'scale(1)',
              boxShadow: isSelected
                ? '0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)'
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
                color: shouldHighlight ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.5)',
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

// Filter repositories to only include the main "mesh" repository
const filterMeshSdkRepositories = (contributors: Contributor[]) => {
  // Only include the main "mesh" repository
  const meshMainRepo = 'mesh';
  
  return contributors.map(contributor => {
    // Filter the contributor's repositories to only include the main "mesh" repository
    const meshContributions = contributor.repositories.filter(repo => {
      const repoName = repo.name.toLowerCase();
      // Check if the repository is the main "mesh" repo
      return repoName === meshMainRepo.toLowerCase();
    });
    
    // Return a new contributor object with only the main "mesh" repository
    return {
      ...contributor,
      repositories: meshContributions
    };
  }).filter(contributor => contributor.repositories.length > 0);
};

export const MeshRepositoriesEvolutionChart: React.FC<RepositoriesEvolutionChartProps> = ({
  contributors,
  height = 400,
  maxRepositories = 10,
  globalStartDate,
  globalEndDate,
}) => {
  const [selectedRepositories, setSelectedRepositories] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Filter contributors to only include those with Mesh SDK repositories
  const meshSdkContributors = useMemo(() => {
    return filterMeshSdkRepositories(contributors);
  }, [contributors]);

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
    if (!meshSdkContributors.length) return null;

    // Aggregate all repositories with their contributions
    const repositoryMap = new Map<string, RepositoryData>();

    meshSdkContributors.forEach(contributor => {
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

    // Take top repositories
    const topRepositories = allRepositories.slice(0, maxRepositories);

    if (topRepositories.length === 0) return null;

    // Find the overall date range from all timestamps
    const allTimestamps: string[] = [];

    meshSdkContributors.forEach(contributor => {
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
        meshSdkContributors.forEach(contributor => {
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
  }, [meshSdkContributors, maxRepositories, globalStartDate, globalEndDate]);

  if (!chartData?.monthlyData?.length) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(0, 0, 0, 0.6)',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        No repository data available for Mesh SDK
      </div>
    );
  }

  const hasAnySelected = selectedRepositories.size > 0;

  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={height} debounce={5}>
        <LineChart
          data={chartData.monthlyData}
          margin={{
            top: 15,
            right: 20,
            left: 15,
            bottom: 15,
          }}
        >
          <defs>
            {chartData?.topRepositories?.map((repository: RepositoryData, index: number) => {
              const isSelected = selectedRepositories.has(repository.name);
              const shouldHighlight = !hasAnySelected || isSelected;

              if (!shouldHighlight) {
                // Simple gray gradient for non-selected
                return (
                  <linearGradient
                    key={`gradient-${repository.name}`}
                    id={`gradient-repo-${repository.name}`}
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

              const baseColor = generateColor(repository.name, index);
              const colorVariations = getColorVariations(baseColor);

              return (
                <linearGradient
                  key={`gradient-${repository.name}`}
                  id={`gradient-repo-${repository.name}`}
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
            fontSize={10}
            fontWeight={500}
            angle={-45}
            textAnchor="end"
            height={60}
            tick={<CustomXAxisTick />}
            allowDataOverflow={true}
          />
          <YAxis
            stroke="rgba(0, 0, 0, 0.6)"
            fontSize={10}
            fontWeight={500}
            tick={<CustomYAxisTick />}
            allowDataOverflow={true}
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
                  dataKey={repository.name}
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
      
      {/* Remove legend for the mesh-sdk page */}
      {chartData?.topRepositories?.length > 1 && (
        <CustomLegend
          topRepositories={chartData.topRepositories || []}
          selectedRepositories={selectedRepositories}
          onRepositoryToggle={handleRepositoryToggle}
        />
      )}
    </div>
  );
};

export default MeshRepositoriesEvolutionChart;
