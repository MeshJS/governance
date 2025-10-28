import { useData } from '../contexts/DataContext';
import styles from '../styles/Projects.module.css';
import PageHeader from '../components/PageHeader';
import Link from 'next/link';
import Image from 'next/image';
import { FaGithub } from 'react-icons/fa';
import { TbWorld, TbBook } from 'react-icons/tb';
import RepositoriesEvolutionChart from '../components/RepositoriesEvolutionChart';
import { useEffect, useMemo, useState } from 'react';
import { Contributor } from '../types';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import React from 'react';

// Repository data structure for tracking
interface RepositoryData {
  name: string;
  contributions: number;
  commits: number;
  pullRequests: number;
  contributors: string[];
}

// Custom Tooltip Component (simplified version from RepositoriesEvolutionChart)
const CustomTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({
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
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(56, 232, 225, 0.3)',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 232, 225, 0.1) inset',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        maxWidth: '220px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '6px',
          fontWeight: '600',
          borderBottom: '1px solid rgba(56, 232, 225, 0.2)',
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
                backgroundColor: entry.color,
                boxShadow: `0 0 3px ${entry.color}`,
              }}
            />
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
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
              color: 'rgba(255, 255, 255, 0.7)',
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
            color: 'rgba(255, 255, 255, 0.5)',
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

// Generate cohesive teal/green color variations matching the dashboard theme
const generateColor = (repoName: string, index: number): string => {
  const colors = [
    'rgba(56, 232, 225, 0.95)', // Primary bright teal
    'rgba(20, 184, 166, 0.95)', // Deep teal
    'rgba(34, 211, 238, 0.95)', // Light cyan
    'rgba(16, 185, 129, 0.95)', // Emerald green
    'rgba(12, 242, 180, 0.95)', // Bright mint
    'rgba(8, 145, 178, 0.95)', // Steel teal
    'rgba(45, 212, 191, 0.95)', // Turquoise
    'rgba(6, 182, 212, 0.95)', // Sky cyan
    'rgba(20, 158, 147, 0.95)', // Dark teal
    'rgba(96, 255, 248, 0.95)', // Bright aqua
    'rgba(34, 197, 194, 0.95)', // Medium teal
    'rgba(14, 116, 144, 0.95)', // Deep cyan
    'rgba(77, 208, 225, 0.95)', // Light blue-green
    'rgba(26, 188, 156, 0.95)', // Sea green
    'rgba(52, 199, 89, 0.95)', // System green
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
  return 'rgba(100, 116, 139, 0.4)'; // Slate gray with low opacity
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

// Generic repository chart component
const createRepositoryChart = (repoName: string) => {
  const RepositoryChart: React.FC<{
    contributors: Contributor[];
    globalStartDate?: string;
    globalEndDate?: string;
    maxYValue?: number;
  }> = ({ contributors, globalStartDate, globalEndDate, maxYValue }) => {
    const [selectedRepositories, setSelectedRepositories] = useState<Set<string>>(new Set());

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

      // Filter to only show the specified repository
      const targetRepo = repositoryMap.get(repoName);
      const topRepositories = targetRepo ? [targetRepo] : [];

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
    }, [contributors, globalStartDate, globalEndDate]);

    if (!chartData?.monthlyData?.length) {
      return (
        <div
          style={{
            height: 280,
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
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData.monthlyData}
          margin={{
            top: 10,
            right: 10,
            left: 5,
            bottom: 50,
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
                    id={`gradient-repo-${repository.name}-card`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="rgba(100, 116, 139, 0.5)" />
                    <stop offset="100%" stopColor="rgba(100, 116, 139, 0.2)" />
                  </linearGradient>
                );
              }

              const baseColor = generateColor(repository.name, index);
              const colorVariations = getColorVariations(baseColor);

              return (
                <linearGradient
                  key={`gradient-${repository.name}`}
                  id={`gradient-repo-${repository.name}-card`}
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
            stroke="rgba(255, 255, 255, 0.08)"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="rgba(255, 255, 255, 0.6)"
            fontSize={7}
            fontWeight={500}
            angle={-45}
            textAnchor="end"
            height={45}
            tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 5 }}
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.6)"
            fontSize={7}
            fontWeight={500}
            tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 5 }}
            width={25}
            domain={maxYValue ? [0, maxYValue] : undefined}
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
                  stroke={
                    shouldHighlight
                      ? `url(#gradient-repo-${repository.name}-card)`
                      : getDimmedColor(baseColor)
                  }
                  strokeWidth={shouldHighlight ? 1.5 : 1}
                  strokeOpacity={shouldHighlight ? 0.85 : 0.4}
                  dot={false}
                  activeDot={{
                    r: shouldHighlight ? 4 : 2.5,
                    fill: shouldHighlight ? baseColor : getDimmedColor(baseColor),
                    stroke: 'rgba(255, 255, 255, 0.8)',
                    strokeWidth: 1.5,
                    opacity: shouldHighlight ? 1 : 0.7,
                    filter: shouldHighlight
                      ? `drop-shadow(0 0 6px ${baseColor.replace('0.95', '0.4')})`
                      : 'none',
                  }}
                  connectNulls={false}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </React.Fragment>
            );
          }) || []}
        </LineChart>
      </ResponsiveContainer>
    );
  };
  return RepositoryChart;
};

const MeshCoreRepositoryChart = createRepositoryChart('mesh');
// Special UTXOS chart that shows both web3-services and web3-sdk
const UTXOSRepositoryChart: React.FC<{
  contributors: Contributor[];
  globalStartDate?: string;
  globalEndDate?: string;
  maxYValue?: number;
}> = ({ contributors, globalStartDate, globalEndDate, maxYValue }) => {
  const [selectedRepositories, setSelectedRepositories] = useState<Set<string>>(new Set());

  const chartData = useMemo(() => {
    if (!contributors.length) return null;

    // Aggregate both UTXOS repositories
    const repositoryMap = new Map<string, RepositoryData>();
    const targetRepos = ['web3-services', 'web3-sdk'];

    contributors.forEach(contributor => {
      contributor.repositories.forEach(repo => {
        if (targetRepos.includes(repo.name)) {
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
        }
      });
    });

    const topRepositories = Array.from(repositoryMap.values());

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
  }, [contributors, globalStartDate, globalEndDate]);

  if (!chartData?.monthlyData?.length) {
    return (
      <div
        style={{
          height: 280,
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
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={chartData.monthlyData}
        margin={{
          top: 10,
          right: 10,
          left: 5,
          bottom: 50,
        }}
      >
        <defs>
          {chartData?.topRepositories?.map((repository: RepositoryData, index: number) => {
            const isSelected = selectedRepositories.has(repository.name);
            const shouldHighlight = !hasAnySelected || isSelected;

            if (!shouldHighlight) {
              return (
                <linearGradient
                  key={`gradient-${repository.name}`}
                  id={`gradient-repo-${repository.name}-utxos`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="rgba(100, 116, 139, 0.5)" />
                  <stop offset="100%" stopColor="rgba(100, 116, 139, 0.2)" />
                </linearGradient>
              );
            }

            const baseColor = generateColor(repository.name, index);
            const colorVariations = getColorVariations(baseColor);

            return (
              <linearGradient
                key={`gradient-${repository.name}`}
                id={`gradient-repo-${repository.name}-utxos`}
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
          stroke="rgba(255, 255, 255, 0.08)"
          horizontal={true}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          stroke="rgba(255, 255, 255, 0.6)"
          fontSize={7}
          fontWeight={500}
          angle={-45}
          textAnchor="end"
          height={45}
          tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 5 }}
        />
        <YAxis
          stroke="rgba(255, 255, 255, 0.6)"
          fontSize={7}
          fontWeight={500}
          tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 5 }}
          width={25}
          domain={maxYValue ? [0, maxYValue] : undefined}
        />
        <Tooltip content={<CustomTooltip />} cursor={false} />

        {chartData?.topRepositories?.map((repository: RepositoryData, index: number) => {
          const isSelected = selectedRepositories.has(repository.name);
          const shouldHighlight = !hasAnySelected || isSelected;
          const baseColor = generateColor(repository.name, index);

          return (
            <React.Fragment key={repository.name}>
              <Line
                type="monotone"
                dataKey={repository.name}
                stroke={
                  shouldHighlight
                    ? `url(#gradient-repo-${repository.name}-utxos)`
                    : getDimmedColor(baseColor)
                }
                strokeWidth={shouldHighlight ? 1.5 : 1}
                strokeOpacity={shouldHighlight ? 0.85 : 0.4}
                dot={false}
                activeDot={{
                  r: shouldHighlight ? 4 : 2.5,
                  fill: shouldHighlight ? baseColor : getDimmedColor(baseColor),
                  stroke: 'rgba(255, 255, 255, 0.8)',
                  strokeWidth: 1.5,
                  opacity: shouldHighlight ? 1 : 0.7,
                  filter: shouldHighlight
                    ? `drop-shadow(0 0 6px ${baseColor.replace('0.95', '0.4')})`
                    : 'none',
                }}
                connectNulls={false}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </React.Fragment>
          );
        }) || []}
      </LineChart>
    </ResponsiveContainer>
  );
};
const MultisigRepositoryChart = createRepositoryChart('multisig');
const MidnightRepositoryChart = createRepositoryChart('midnight');
const MimirRepositoryChart = createRepositoryChart('mimir');
const CquisitorRepositoryChart = createRepositoryChart('cquisitor-lib');

interface ProjectLinks {
  github?: string;
  web?: string;
  docs?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  previewImage: string;
  links: ProjectLinks;
  category?: string;
}

const projects: Project[] = [
  {
    id: '1',
    name: 'Mesh SDK',
    description:
      'Collection of comprehensive TypeScript libraries for blockchain development on Cardano.',
    icon: '/logo-mesh-white-512x512.png',
    previewImage: '/pr-sdk.png',
    links: {
      github: 'https://github.com/MeshJS/mesh',
      web: 'https://meshjs.dev/',
      docs: 'https://docs.meshjs.dev/',
    },
    category: 'Development Tool',
  },
  {
    id: '4',
    name: 'UTXOS',
    description:
      "Streamline user onboarding and Web3 integration, accelerating your app's time to market.",
    icon: '/logo-mesh-white-512x512.png',
    previewImage: '/pr-utxos.png',
    links: {
      github: 'https://github.com/MeshJS/web3-sdk',
      web: 'https://utxos.dev/',
      docs: 'https://docs.utxos.dev/',
    },
    category: 'Development Tool',
  },
  {
    id: '3',
    name: 'Multisig Platform',
    description:
      'Secure your treasury and participate in Cardano governance as a team with multi-signature.',
    icon: '/wallet.png',
    previewImage: '/pr-multisig.png',
    links: {
      github: 'https://github.com/MeshJS/multisig',
      web: 'https://multisig.meshjs.dev/',
    },
    category: 'Development Tool',
  },
  {
    id: '2',
    name: 'Midnight',
    description: 'Mesh Midnight providers tools and resources for developers to build on Midnight.',
    icon: '/Midnight-RGB_Symbol-White.png',
    previewImage: '/pr-midnight.png',
    links: {
      github: 'https://github.com/MeshJS/midnight',
    },
    category: 'Development Tool',
  },
  {
    id: '5',
    name: 'Mimir',
    description:
      'AI compatible web3 tools for enhanced blockchain development and smart contract interactions.',
    icon: '/logo-mesh-white-512x512.png',
    previewImage: '/pr-mimir.png',
    links: {
      github: 'https://github.com/MeshJS/mimir',
    },
    category: 'Development Tool',
  },
  {
    id: '7',
    name: 'Cquisitor',
    description:
      'An open source CBOR investigation tool for analyzing and debugging Cardano blockchain transactions.',
    icon: '/logo-mesh-white-512x512.png',
    previewImage: '/pr-cquisitor.png',
    links: {
      github: 'https://github.com/MeshJS/cquisitor-lib',
      web: 'https://cloud.meshjs.dev/cquisitor',
    },
    category: 'Development Tool',
  },
];

const ProjectCard = ({
  project,
  contributorStats,
  humanContributors,
  timeWindowBoundaries,
  meshData,
  repoStats,
}: {
  project: Project;
  contributorStats: any;
  humanContributors: Contributor[];
  timeWindowBoundaries: { startDate: string | null; endDate: string | null };
  meshData: any;
  repoStats: any;
}) => {
  // Check if this is the Mesh SDK card to make it navigable
  const isNavigable = project.name === 'Mesh SDK';
  const cardClassName = `${styles.projectCard} ${isNavigable ? styles.navigableCard : ''}`;
  
  // Map project names to repository names
  const getRepositoryName = (projectName: string): string => {
    const projectToRepoMapping: { [key: string]: string } = {
      'Mesh SDK': 'mesh',
      UTXOS: 'web3-services',
      'Multisig Platform': 'multisig',
      Midnight: 'midnight',
      Mimir: 'mimir',
      Cquisitor: 'cquisitor-lib',
    };
    return projectToRepoMapping[projectName] || projectName.toLowerCase().replace(/\s+/g, '-');
  };

  const repoName = getRepositoryName(project.name);
  const contributorRepoStats = contributorStats?.perRepo?.[repoName];

  // Get real statistics from GitHub data with time filtering
  const stats = useMemo(() => {
    if (!humanContributors.length) {
      return {
        contributors: 0,
        contributions: 0,
        dependents: 0,
      };
    }

    const repoContributors = new Set<string>();
    let totalContributions = 0;

    // Special handling for UTXOS project (combines web3-services and web3-sdk)
    const targetRepos = project.name === 'UTXOS' ? ['web3-services', 'web3-sdk'] : [repoName];

    humanContributors.forEach(contributor => {
      targetRepos.forEach(targetRepo => {
        const repo = contributor.repositories.find(r => r.name === targetRepo);
        if (repo) {
          // Filter timestamps by time window
          const filteredCommits = repo.commit_timestamps.filter(timestamp =>
            isTimestampInRange(
              timestamp,
              timeWindowBoundaries.startDate || null,
              timeWindowBoundaries.endDate || null
            )
          );
          const filteredPRs = repo.pr_timestamps.filter(timestamp =>
            isTimestampInRange(
              timestamp,
              timeWindowBoundaries.startDate || null,
              timeWindowBoundaries.endDate || null
            )
          );

          if (filteredCommits.length > 0 || filteredPRs.length > 0) {
            repoContributors.add(contributor.login);
            totalContributions += filteredCommits.length + filteredPRs.length;
          }
        }
      });
    });

    // Get dependents count from package data
    let dependentsCount = 0;
    if (meshData?.meshPackagesData?.packages) {
      if (project.name === 'Mesh SDK') {
        const corePackage = meshData.meshPackagesData.packages.find(
          (pkg: any) => pkg.name === '@meshsdk/core'
        );
        if (corePackage?.package_stats_history?.length > 0) {
          const latestStats =
            corePackage.package_stats_history[corePackage.package_stats_history.length - 1];
          dependentsCount = latestStats.github_dependents_count || 0;
        }
      } else if (project.name === 'UTXOS') {
        const web3SdkPackage = meshData.meshPackagesData.packages.find(
          (pkg: any) => pkg.name === '@meshsdk/web3-sdk'
        );
        if (web3SdkPackage?.package_stats_history?.length > 0) {
          const latestStats =
            web3SdkPackage.package_stats_history[web3SdkPackage.package_stats_history.length - 1];
          dependentsCount = latestStats.github_dependents_count || 0;
        }
      }
    }

    // Get stars and forks from GitHub repo stats
    let stars = 0;
    let forks = 0;
    if (repoStats?.repoStats) {
      // For UTXOS, combine stats from both repos
      if (project.name === 'UTXOS') {
        const web3ServicesStats = repoStats.repoStats.find(
          (repo: any) => repo.name === 'web3-services'
        );
        const web3SdkStats = repoStats.repoStats.find((repo: any) => repo.name === 'web3-sdk');
        stars = (web3ServicesStats?.stars || 0) + (web3SdkStats?.stars || 0);
        forks = (web3ServicesStats?.forks || 0) + (web3SdkStats?.forks || 0);
      } else {
        const repoStat = repoStats.repoStats.find((repo: any) => repo.name === repoName);
        stars = repoStat?.stars || 0;
        forks = repoStat?.forks || 0;
      }
    }

    return {
      contributors: repoContributors.size,
      contributions: totalContributions,
      dependents: dependentsCount,
      stars,
      forks,
    };
  }, [humanContributors, repoName, timeWindowBoundaries, meshData, project.name, repoStats]);

  // Generate chart data - use mock data for now since timestamp data structure needs investigation
  const generateChartDataFromTimestamps = () => {
    // Generate mock data based on repository stats
    const baseValue = stats.contributions / 12; // Distribute contributions across 12 months

    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));

      return {
        month: date.toISOString().slice(0, 7),
        value: Math.max(1, Math.floor(baseValue + Math.random() * baseValue * 0.5)),
      };
    });
  };

  const chartData = generateChartDataFromTimestamps();

  return (
    <div className={cardClassName}>
      {/* Header with title and description */}
      <div className={styles.projectHeader}>
        <h3 className={styles.projectName}>{project.name}</h3>
        <p className={styles.projectDescription}>{project.description}</p>
      </div>

      {/* Statistics row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Contributors</span>
          <span className={styles.statValue}>{stats.contributors}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Contributions</span>
          <span className={styles.statValue}>{stats.contributions}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Stars</span>
          <span className={styles.statValue}>{stats.stars}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Forks</span>
          <span className={styles.statValue}>{stats.forks}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Dependents</span>
          <span className={styles.statValue}>{stats.dependents}</span>
        </div>
      </div>

      {/* Chart area */}
      <div className={styles.chartArea}>
        {project.name === 'Mesh SDK' ? (
          <MeshCoreRepositoryChart
            contributors={humanContributors}
            globalStartDate={timeWindowBoundaries.startDate || undefined}
            globalEndDate={timeWindowBoundaries.endDate || undefined}
            maxYValue={400}
          />
        ) : project.name === 'UTXOS' ? (
          <UTXOSRepositoryChart
            contributors={humanContributors}
            globalStartDate={timeWindowBoundaries.startDate || undefined}
            globalEndDate={timeWindowBoundaries.endDate || undefined}
            maxYValue={400}
          />
        ) : project.name === 'Multisig Platform' ? (
          <MultisigRepositoryChart
            contributors={humanContributors}
            globalStartDate={timeWindowBoundaries.startDate || undefined}
            globalEndDate={timeWindowBoundaries.endDate || undefined}
            maxYValue={400}
          />
        ) : project.name === 'Midnight' ? (
          <MidnightRepositoryChart
            contributors={humanContributors}
            globalStartDate={timeWindowBoundaries.startDate || undefined}
            globalEndDate={timeWindowBoundaries.endDate || undefined}
            maxYValue={400}
          />
        ) : project.name === 'Mimir' ? (
          <MimirRepositoryChart
            contributors={humanContributors}
            globalStartDate={timeWindowBoundaries.startDate || undefined}
            globalEndDate={timeWindowBoundaries.endDate || undefined}
            maxYValue={400}
          />
        ) : project.name === 'Cquisitor' ? (
          <CquisitorRepositoryChart
            contributors={humanContributors}
            globalStartDate={timeWindowBoundaries.startDate || undefined}
            globalEndDate={timeWindowBoundaries.endDate || undefined}
            maxYValue={400}
          />
        ) : (
          <>
            {/* Debug: Show chart data */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ fontSize: '10px', color: 'white', marginBottom: '5px' }}>
                Data points: {chartData.length}, Max value:{' '}
                {Math.max(...chartData.map(d => d.value))}
              </div>
            )}
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 20, bottom: 20 }}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }}
                  width={15}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="rgb(12, 242, 180)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Bottom action bar */}
      <div className={styles.actionBar}>
        <div className={styles.actionIcons}>
          {project.links.github && (
            <Link
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionIcon}
              title="GitHub"
            >
              <FaGithub size={20} />
            </Link>
          )}
          {project.links.web && (
            <Link
              href={project.links.web}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionIcon}
              title="Website"
            >
              <TbWorld size={20} />
            </Link>
          )}
          {project.links.docs && (
            <Link
              href={project.links.docs}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionIcon}
              title="Documentation"
            >
              <TbBook size={20} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Projects() {
  const {
    meshData,
    contributorStats,
    repoStats,
    isLoading,
    isLoadingContributors,
    error,
    contributorsError,
    loadContributorStats,
    loadRepoStats,
  } = useData();

  // Trigger lazy loading when component mounts
  useEffect(() => {
    loadContributorStats();
    loadRepoStats();
  }, [loadContributorStats, loadRepoStats]);

  // Defensive: treat as no data if contributorStats is a legacy yearly record
  const isOrgStats =
    contributorStats &&
    typeof contributorStats === 'object' &&
    'contributors' in contributorStats &&
    Array.isArray(contributorStats.contributors);

  const humanContributors = useMemo(() => {
    if (!isOrgStats) return [] as Contributor[];
    return contributorStats.contributors as Contributor[];
  }, [contributorStats, isOrgStats]);

  // Time window state
  const [timeWindow, setTimeWindow] = useState<string>('all');

  // Time window presets
  const TIME_WINDOW_PRESETS = [
    { label: 'All time', value: 'all' },
    { label: 'Last year', value: '1y' },
    { label: 'Last 6 months', value: '6m' },
    { label: 'Last 3 months', value: '3m' },
    { label: 'Last 30 days', value: '30d' },
  ];

  // Calculate time window boundaries
  const timeWindowBoundaries = useMemo(() => {
    if (timeWindow === 'all') {
      return { startDate: null, endDate: null };
    }

    const now = new Date();
    const endDate = now.toISOString();
    let startDate: string;

    switch (timeWindow) {
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString();
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString();
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        startDate = new Date(2020, 0, 1).toISOString();
    }

    return { startDate, endDate };
  }, [timeWindow]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title={
          <>
            Mesh <span>Projects</span>
          </>
        }
        subtitle="Mesh is busy building tools to enhance and grow the Cardano Ecosystem, here a few of our most active and promising projects"
      />

      {/* Top Repositories Chart */}
      <div className={styles.repositoriesSection}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitleSection}>
            <h3 className={styles.chartTitle}>Projects Activity</h3>
            <p className={styles.chartSubtitle}>
              Monthly contribution trends for the most active repositories
            </p>
          </div>
          <div className={styles.timeWindowSelectorContainer}>
            <div className={styles.timeWindowSelector}>
              {TIME_WINDOW_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  className={`${styles.timeWindowButton} ${timeWindow === preset.value ? styles.active : ''}`}
                  onClick={() => setTimeWindow(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.chartContent}>
          {isLoadingContributors ? (
            <div className={styles.chartLoading}>Loading repository data...</div>
          ) : contributorsError ? (
            <div className={styles.chartError}>Error loading repository data</div>
          ) : (
            <RepositoriesEvolutionChart
              contributors={isOrgStats ? humanContributors : []}
              height={400}
              maxRepositories={10}
              globalStartDate={timeWindowBoundaries.startDate || undefined}
              globalEndDate={timeWindowBoundaries.endDate || undefined}
            />
          )}
        </div>
      </div>

      <div className={styles.projectsGrid} id="projectsGrid">
        {projects.map(project => (
          project.name === 'Mesh SDK' ? (
            <Link href="/projects/mesh-sdk" key={project.id} className={styles.projectCardLink}>
              <ProjectCard
                project={project}
                contributorStats={contributorStats}
                humanContributors={humanContributors}
                timeWindowBoundaries={timeWindowBoundaries}
                meshData={meshData}
                repoStats={repoStats}
              />
            </Link>
          ) : (
            <ProjectCard
              key={project.id}
              project={project}
              contributorStats={contributorStats}
              humanContributors={humanContributors}
              timeWindowBoundaries={timeWindowBoundaries}
              meshData={meshData}
              repoStats={repoStats}
            />
          )
        ))}
      </div>

      {/* Governance Initiatives Section */}
      <div className={styles.governanceSection}>
        <h2 className={styles.governanceTitle}>Governance initiatives</h2>
        <p className={styles.governanceDescription}>
          Initiatives to improve Cardano Onchain Governance
        </p>
        
        <div className={styles.governanceCards}>
          <div className={styles.governanceCard}>
            <h3>Deposit Crowdfunding</h3>
            <p>Smart Contracts to submit onchain governance actions via deposit crowdfunding</p>
            <Link href="/governance/deposit-crowdfunding" className={styles.governanceLink}>
              More
            </Link>
          </div>
          
          <div className={styles.governanceCard}>
            <h3>Cardano Multi Asset Treasury</h3>
            <p>The ideation, design and development of a Cardano Multi Asset Treasury</p>
            <Link href="/governance/multi-asset-treasury" className={styles.governanceLink}>
              More
            </Link>
          </div>
          
          <div className={styles.governanceCard}>
            <h3>Governance Tools</h3>
            <p>Open Source tools to help different roles to engage at onchain Governance.</p>
            <Link href="/governance/tools" className={styles.governanceLink}>
              More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
