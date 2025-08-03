import React, { FC, useMemo } from 'react';
import styles from '../styles/MeshStats.module.css';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, TooltipProps, LineChart, Line, Area, ComposedChart } from 'recharts';
import { PackageData, MeshStatsViewProps as OriginalMeshStatsViewProps, DiscordStats, ContributorStats, MeshPackagesApiResponse } from '../types';

const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
};

const CustomTooltip = ({ active, payload, label, chartId }: TooltipProps<number, string> & { chartId?: string }) => {
    if (active && payload && payload.length && payload[0].value !== undefined) {
        const unit = chartId === 'repositories' ? 'repositories' :
            chartId === 'contributions' ? 'contributions' :
                chartId === 'contributors' ? 'contributors' : 'downloads';
        return (
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                border: '1px solid rgba(56, 232, 225, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 232, 225, 0.1) inset',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                maxWidth: '280px'
            }}>
                <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '6px',
                    fontWeight: '600',
                    borderBottom: '1px solid rgba(56, 232, 225, 0.2)',
                    paddingBottom: '3px'
                }}>
                    {label}
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '16px' }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '1px',
                            backgroundColor: 'rgba(12, 242, 180, 1)',
                            boxShadow: '0 0 3px rgba(12, 242, 180, 1)'
                        }} />
                        <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
                            {unit}
                        </span>
                    </div>
                    <span style={{ 
                        color: 'rgba(12, 242, 180, 1)', 
                        fontWeight: '600',
                        textShadow: '0 0 4px rgba(12, 242, 180, 0.4)'
                    }}>
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
                fill="rgba(255, 255, 255, 0.6)" 
                fontSize="10" 
                transform="rotate(-45)"
            >
                {payload.value}
            </text>
        </g>
    );
};

const CustomBarChart = ({ data, chartId }: CustomBarChartProps) => {
    const gradientId = `tealGradient-${chartId}`;
    
    const handleBarClick = (data: any) => {
        if (data && data.packageName) {
            const npmUrl = `https://www.npmjs.com/package/${data.packageName}`;
            window.open(npmUrl, '_blank');
        }
    };
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={8} margin={{ top: 10, right: 10, left: -15, bottom: 45 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14B8A6" />
                        <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                </defs>
            <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.03)"
                vertical={false}
            />
            <XAxis
                dataKey="name"
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tick={<CustomTick />}
                tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                height={60}
                interval={0}
            />
            <YAxis
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
                tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
            />
            <Tooltip
                content={<CustomTooltip chartId={chartId} />}
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
            />
            <Bar
                dataKey="downloads"
                fill={`url(#${gradientId})`}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
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
}

const CustomLineChart = ({ data, chartId }: CustomLineChartProps) => {
    // Enhanced gradients matching contributors page - using teal colors
    const stroke = 'rgba(12, 242, 180, 1)';
    const r = 12, g = 242, b = 180;
    
    const bright = `rgb(${Math.min(255, Math.round(r * 1.2))}, ${Math.min(255, Math.round(g * 1.2))}, ${Math.min(255, Math.round(b * 1.2))})`;
    const dim = `rgb(${Math.round(r * 0.4)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.4)})`;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 15, right: 20, left: 15, bottom: 15 }}>
                <defs>
                    <linearGradient id={`lineGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={bright} />
                        <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} />
                        <stop offset="100%" stopColor={dim} />
                    </linearGradient>
                    <linearGradient id={`areaGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0.3" />
                        <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0.1" />
                        <stop offset="100%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0" />
                    </linearGradient>
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
                    fontSize={10}
                    fontWeight={500}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                />
                <YAxis
                    stroke="rgba(255, 255, 255, 0.6)"
                    fontSize={10}
                    fontWeight={500}
                    tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                />
                <Tooltip
                    content={<CustomTooltip chartId={chartId} />}
                    cursor={false}
                />
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
                        stroke: 'rgba(255, 255, 255, 0.8)',
                        strokeWidth: 1.5,
                        filter: `drop-shadow(0 0 6px ${stroke.replace('1)', '0.4)')})`
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
}

// Enhanced Repository Dependencies tooltip matching contributors page style
const CustomRepositoryTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    // Filter to only show Line components (not Area components) to avoid duplicates
    const filteredPayload = payload.filter((entry: any) => entry.name && entry.name !== entry.dataKey);

    return (
        <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(56, 232, 225, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 232, 225, 0.1) inset',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            maxWidth: '280px'
        }}>
            <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '6px',
                fontWeight: '600',
                borderBottom: '1px solid rgba(56, 232, 225, 0.2)',
                paddingBottom: '3px'
            }}>
                {label}
            </div>
            {filteredPayload.map((entry: any, index: number) => (
                <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: index === filteredPayload.length - 1 ? '0' : '4px',
                    fontSize: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '16px' }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '1px',
                            backgroundColor: entry.color,
                            boxShadow: `0 0 3px ${entry.color}`
                        }} />
                        <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
                            {entry.name}
                        </span>
                    </div>
                    <span style={{ 
                        color: entry.color, 
                        fontWeight: '600',
                        textShadow: `0 0 4px ${entry.color}40`
                    }}>
                        {formatNumber(entry.value)}
                    </span>
                </div>
            ))}
        </div>
    );
};

const CustomMultiLineChart = ({ data, chartId, lines }: CustomMultiLineChartProps) => (
    <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 15, right: 20, left: 15, bottom: 15 }}>
            <defs>
                {lines.map((line, index) => {
                    // Enhanced gradients matching contributors page
                    const baseColor = line.stroke;
                    const match = baseColor.match(/rgba?\(([^)]+)\)/);
                    let r = 56, g = 232, b = 225; // Default teal
                    
                    if (match) {
                        const values = match[1].split(',').map(v => parseFloat(v.trim()));
                        r = values[0]; g = values[1]; b = values[2];
                    }
                    
                    const bright = `rgb(${Math.min(255, Math.round(r * 1.2))}, ${Math.min(255, Math.round(g * 1.2))}, ${Math.min(255, Math.round(b * 1.2))})`;
                    const dim = `rgb(${Math.round(r * 0.4)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.4)})`;
                    
                    return [
                        <linearGradient key={`line-${index}`} id={`lineGradient-${chartId}-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={bright} />
                            <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} />
                            <stop offset="100%" stopColor={dim} />
                        </linearGradient>,
                        <linearGradient key={`area-${index}`} id={`areaGradient-${chartId}-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0.3" />
                            <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0.1" />
                            <stop offset="100%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0" />
                        </linearGradient>
                    ];
                })}
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
                fontSize={10}
                fontWeight={500}
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
            />
            <YAxis
                stroke="rgba(255, 255, 255, 0.6)"
                fontSize={10}
                fontWeight={500}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
            />
            <Tooltip
                content={<CustomRepositoryTooltip />}
                cursor={false}
            />
            {lines.map((line, index) => (
                <Area
                    key={`area-${index}`}
                    type="monotone"
                    dataKey={line.dataKey}
                    fill={`url(#areaGradient-${chartId}-${line.dataKey})`}
                    stroke="none"
                />
            ))}
            {lines.map((line, index) => (
                <Line
                    key={`line-${index}`}
                    type="monotone"
                    name={line.name}
                    dataKey={line.dataKey}
                    stroke={`url(#lineGradient-${chartId}-${line.dataKey})`}
                    strokeWidth={1.5}
                    strokeOpacity={0.85}
                    dot={false}
                    activeDot={{ 
                        r: 4,
                        fill: line.stroke,
                        stroke: 'rgba(255, 255, 255, 0.8)',
                        strokeWidth: 1.5,
                        filter: `drop-shadow(0 0 6px ${line.stroke.replace('1)', '0.4)')})`
                    }}
                    connectNulls={false}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ))}
        </ComposedChart>
    </ResponsiveContainer>
);

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
}

// Enhanced Discord tooltip matching the glassmorphism style
const CustomDiscordSingleTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length && payload[0].value !== undefined) {
        return (
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                border: '1px solid rgba(56, 232, 225, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 232, 225, 0.1) inset',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                maxWidth: '280px'
            }}>
                <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '6px',
                    fontWeight: '600',
                    borderBottom: '1px solid rgba(56, 232, 225, 0.2)',
                    paddingBottom: '3px'
                }}>
                    {label}
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '16px' }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '1px',
                            backgroundColor: payload[0].stroke,
                            boxShadow: `0 0 3px ${payload[0].stroke}`
                        }} />
                        <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
                            {payload[0].name}
                        </span>
                    </div>
                    <span style={{ 
                        color: payload[0].stroke, 
                        fontWeight: '600',
                        textShadow: `0 0 4px ${payload[0].stroke}40`
                    }}>
                        {formatNumber(payload[0].value)}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const CustomSingleLineChart = ({ data, chartId, dataKey, name, stroke, yAxisDomain }: CustomSingleLineChartProps) => {
    // Enhanced gradients matching contributors page
    const baseColor = stroke;
    const match = baseColor.match(/rgba?\(([^)]+)\)/);
    let r = 56, g = 232, b = 225; // Default teal
    
    if (match) {
        const values = match[1].split(',').map(v => parseFloat(v.trim()));
        r = values[0]; g = values[1]; b = values[2];
    }
    
    const bright = `rgb(${Math.min(255, Math.round(r * 1.2))}, ${Math.min(255, Math.round(g * 1.2))}, ${Math.min(255, Math.round(b * 1.2))})`;
    const dim = `rgb(${Math.round(r * 0.4)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.4)})`;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 15, right: 20, left: 15, bottom: 15 }}>
                <defs>
                    <linearGradient id={`lineGradient-${chartId}-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={bright} />
                        <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} />
                        <stop offset="100%" stopColor={dim} />
                    </linearGradient>
                    <linearGradient id={`areaGradient-${chartId}-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0.3" />
                        <stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0.1" />
                        <stop offset="100%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity="0" />
                    </linearGradient>
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
                    fontSize={10}
                    fontWeight={500}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                />
                <YAxis
                    stroke="rgba(255, 255, 255, 0.6)"
                    fontSize={10}
                    fontWeight={500}
                    tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                    domain={yAxisDomain || ['auto', 'auto']}
                />
                <Tooltip
                    content={<CustomDiscordSingleTooltip />}
                    cursor={false}
                />
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
                        stroke: 'rgba(255, 255, 255, 0.8)',
                        strokeWidth: 1.5,
                        filter: `drop-shadow(0 0 6px ${stroke.replace('1)', '0.4)')})`
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
}

const MeshStatsView: FC<MeshStatsViewProps> = ({ discordStats, contributorStats, meshPackagesData }) => {
    // Find the @meshsdk/core package
    const corePackage = meshPackagesData?.packages.find(pkg => pkg.name === '@meshsdk/core');
    // Find the @meshsdk/web3-sdk package
    const web3SdkPackage = meshPackagesData?.packages.find(pkg => pkg.name === '@meshsdk/web3-sdk');



    // Use all package data for the package comparison chart (all-time downloads)
    const packageData = meshPackagesData?.packages
        ? meshPackagesData.packages.map(pkg => ({
            name: pkg.name.replace('@meshsdk/', '').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()),
            downloads: pkg.last_12_months_downloads, // NPM's most comprehensive download data
            packageName: pkg.name // Keep original package name for URL generation
        }))
        : [];

    // Aggregate monthly downloads across all packages for current year
    const currentYear = new Date().getFullYear();
    const monthlyData = useMemo(() => {
        if (!meshPackagesData?.packages) return [];
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthlyTotals: { [key: number]: number } = {};
        
        // Aggregate downloads from all packages for current year
        meshPackagesData.packages.forEach(pkg => {
            if (pkg.monthly_downloads) {
                pkg.monthly_downloads
                    .filter((monthObj: any) => monthObj.year === currentYear)
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
                downloads: downloads
            }))
            .sort((a, b) => {
                const aMonth = monthNames.indexOf(a.name.split(' ')[0]) + 1;
                const bMonth = monthNames.indexOf(b.name.split(' ')[0]) + 1;
                return aMonth - bMonth;
            });
    }, [meshPackagesData, currentYear]);

    // Get the latest year for display
    const latestYear = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].name.split(' ')[1] : '';

    // repositoriesData: Use corePackage.package_stats_history for the current year
    const repositoriesData = useMemo(() => {
        if (!corePackage?.package_stats_history) return [];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return corePackage.package_stats_history
            .filter((stat: any) => {
                // stat.month can be 'YYYY-MM' or a number
                if (typeof stat.month === 'string' && stat.month.length === 7) {
                    return Number(stat.month.split('-')[0]) === currentYear;
                }
                return false;
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
                    repositories: stat.github_dependents_count ?? 0
                };
            });
    }, [corePackage, currentYear]);

    // web3SdkRepositoriesData: Use historical data + real database data
    const web3SdkRepositoriesData = useMemo(() => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Historical data for web3-sdk launch (March-July 2025)
        const historicalData = [
            { month: 'March', repositories: 18 },
            { month: 'April', repositories: 32 },
            { month: 'May', repositories: 68 },
            { month: 'June', repositories: 98 },
            { month: 'July', repositories: 125 }
        ];

        // Get real data from database for August onwards
        const databaseData = web3SdkPackage?.package_stats_history
            ? web3SdkPackage.package_stats_history
                .filter((stat: any) => {
                    if (typeof stat.month === 'string' && stat.month.length === 7) {
                        const year = Number(stat.month.split('-')[0]);
                        const month = Number(stat.month.split('-')[1]);
                        // Only include August 2025 and later
                        return year === currentYear && month >= 8;
                    }
                    return false;
                })
                .sort((a: any, b: any) => {
                    const aMonth = typeof a.month === 'string' ? Number(a.month.split('-')[1]) : 0;
                    const bMonth = typeof b.month === 'string' ? Number(b.month.split('-')[1]) : 0;
                    return aMonth - bMonth;
                })
                .map((stat: any) => {
                    const monthIdx = typeof stat.month === 'string' ? Number(stat.month.split('-')[1]) - 1 : 0;
                    return {
                        month: months[monthIdx],
                        repositories: stat.github_dependents_count ?? 0
                    };
                })
            : [];

        // Combine historical and database data
        return [...historicalData, ...databaseData];
    }, [web3SdkPackage, currentYear]);

    // Combined repositories data for both core and web3-sdk
    const combinedRepositoriesData = useMemo(() => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const combined: Record<string, any> = {};

        // Add core data
        repositoriesData.forEach(item => {
            combined[item.month] = {
                month: item.month,
                core: item.repositories,
                web3sdk: 0
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
                    web3sdk: item.repositories
                };
            }
        });

        // Convert to array and sort by month order
        return Object.values(combined).sort((a: any, b: any) => {
            return months.indexOf(a.month) - months.indexOf(b.month);
        });
    }, [repositoriesData, web3SdkRepositoriesData]);

    // Historical package downloads data (Jan-July 2025)
    const historicalPackageDownloads = useMemo(() => {
        if (!meshPackagesData?.packages) return [];
        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
        const combined: { [key: string]: any } = {};
        
        // Initialize months
        months.forEach(month => {
            combined[month] = { month };
        });
        
        // Process each package's monthly downloads for Jan-July 2025
        meshPackagesData.packages.forEach(pkg => {
            const monthlyData = pkg.monthly_downloads
                ?.filter(item => item.year === 2025 && item.month >= 1 && item.month <= 7)
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
    }, [meshPackagesData]);

    // Generate monthly contribution data from timestamp arrays
    const contributionsData = useMemo(() => {
        if (!contributorStats?.contributors) return [];

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // Initialize monthly data for current year up to previous month (excluding current month)
        const monthlyContributions = months.slice(0, currentMonth).map(month => ({
            month,
            contributions: 0
        }));

        // Process all contributors' timestamps
        contributorStats.contributors.forEach(contributor => {
            contributor.repositories.forEach(repo => {
                // Process commit timestamps
                repo.commit_timestamps?.forEach(timestamp => {
                    const date = new Date(timestamp);
                    if (date.getFullYear() === currentYear) {
                        const monthIndex = date.getMonth();
                        if (monthIndex < currentMonth) {
                            monthlyContributions[monthIndex].contributions += 1;
                        }
                    }
                });

                // Process PR timestamps
                repo.pr_timestamps?.forEach(timestamp => {
                    const date = new Date(timestamp);
                    if (date.getFullYear() === currentYear) {
                        const monthIndex = date.getMonth();
                        if (monthIndex < currentMonth) {
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
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
                        if (date.getFullYear() < currentYear ||
                            (date.getFullYear() === currentYear && date.getMonth() <= index)) {
                            hasContributedByThisMonth = true;
                        }
                    });

                    // Check PR timestamps up to this month
                    repo.pr_timestamps?.forEach(timestamp => {
                        const date = new Date(timestamp);
                        // Include contributions from any year, but only up to the previous month in current year
                        if (date.getFullYear() < currentYear ||
                            (date.getFullYear() === currentYear && date.getMonth() <= index)) {
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
                contributors: activeContributors.size
            };
        });

        return monthlyGrowth;
    }, [contributorStats]);

    // Format the Discord stats for the chart
    const discordStatsData = useMemo(() => {
        if (!discordStats?.stats) return [];

        // Get sorted months in the format "YYYY-MM"
        const sortedMonths = Object.keys(discordStats.stats)
            .sort((a, b) => a.localeCompare(b));

        // Create an array of formatted data for the chart
        return sortedMonths.map(monthKey => {
            const stats = discordStats.stats[monthKey];
            // Extract year and month from the key (format: "YYYY-MM")
            const [year, month] = monthKey.split('-');
            // Convert month number to month name
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const monthName = monthNames[parseInt(month) - 1];

            return {
                month: monthName,
                memberCount: stats.memberCount,
                totalMessages: stats.totalMessages,
                uniquePosters: stats.uniquePosters
            };
        });
    }, [discordStats]);

    // Calculate the minimum member count to create a better visualization
    const memberCountMin = useMemo(() => {
        if (!discordStatsData.length) return 0;

        // Find minimum member count
        const min = Math.min(...discordStatsData.map(d => d.memberCount));

        // Calculate a floor that's ~10% below the minimum (to add some space at the bottom)
        // and round to a nice number
        return Math.floor(min * 0.9 / 100) * 100;
    }, [discordStatsData]);

    // Calculate download metrics across all packages
    const aggregatedMetrics = useMemo(() => {
        if (!meshPackagesData?.packages) {
            return {
                lastWeek: 0,
                lastMonth: 0,
                lastYear: 0,
                allTime: 0
            };
        }
        
        return meshPackagesData.packages.reduce((totals, pkg) => ({
            lastWeek: totals.lastWeek + (pkg.last_week_downloads || 0),
            lastMonth: totals.lastMonth + (pkg.last_month_downloads || 0),
            lastYear: totals.lastYear + (pkg.last_year_downloads || 0),
            allTime: totals.allTime + (pkg.last_12_months_downloads || 0)
        }), {
            lastWeek: 0,
            lastMonth: 0,
            lastYear: 0,
            allTime: 0
        });
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
                            <h3>Last Year</h3>
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
                    <div className={styles.chartsGrid}>
                        <div className={styles.chartSection}>
                            <h2>Package Downloads (All Time)</h2>
                            <div className={styles.chart} style={{ height: '420px' }}>
                                <CustomBarChart data={packageData} chartId="package" />
                            </div>
                        </div>

                        <div className={styles.chartSection}>
                            <h2>Monthly Downloads ({latestYear})</h2>
                            <div className={styles.chart} style={{ height: '420px' }}>
                                <CustomBarChart data={monthlyData} chartId="monthly" />
                            </div>
                        </div>

                    </div>

                    {/* Historical Package Downloads Chart */}
                    {historicalPackageDownloads.length > 0 && (
                        <div className={styles.chartSection}>
                            <h2>Package Downloads per month 2025</h2>
                            <div className={styles.chart}>
                                <CustomMultiLineChart
                                    data={historicalPackageDownloads}
                                    chartId="historical-downloads"
                                    lines={[
                                        { name: 'Core', dataKey: 'core', stroke: 'rgba(56, 232, 225, 1)' },
                                        { name: 'Core CST', dataKey: 'core_cst', stroke: 'rgba(12, 242, 180, 1)' },
                                        { name: 'Common', dataKey: 'common', stroke: 'rgba(20, 184, 166, 1)' },
                                        { name: 'Transaction', dataKey: 'transaction', stroke: 'rgba(45, 212, 191, 1)' },
                                        { name: 'Wallet', dataKey: 'wallet', stroke: 'rgba(94, 234, 212, 1)' },
                                        { name: 'React', dataKey: 'react', stroke: 'rgba(153, 246, 228, 1)' },
                                        { name: 'Provider', dataKey: 'provider', stroke: 'rgba(204, 251, 241, 1)' },
                                        { name: 'Web3 SDK', dataKey: 'web3_sdk', stroke: 'rgba(240, 253, 250, 1)' },
                                        { name: 'Core CSL', dataKey: 'core_csl', stroke: 'rgba(255, 255, 255, 0.9)' },
                                        { name: 'Contract', dataKey: 'contract', stroke: 'rgba(255, 255, 255, 0.7)' },
                                    ]}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {meshPackagesData?.packages.find(pkg => pkg.name === '@meshsdk/core') && (
                <div className={styles.githubStats}>
                    <h2>GitHub Usage</h2>
                    <div className={styles.statsGrid}>
                        <div className={styles.stat}>
                            <h3>Projects Using Mesh</h3>
                            <p>{formatNumber(
                                (meshPackagesData?.packages.find(pkg => pkg.name === '@meshsdk/core')?.github_dependents_count || 0) +
                                (meshPackagesData?.packages.find(pkg => pkg.name === '@meshsdk/web3-sdk')?.github_dependents_count || 0)
                            )}</p>
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
                    </div>
                </div>
            )}

            {packageData.length > 0 && monthlyData.length > 0 && combinedRepositoriesData.length > 0 && (
                <div className={styles.chartSection}>
                    <h2>Repository Dependencies Growth ({new Date().getFullYear()})</h2>
                    <div className={styles.chart}>
                        <CustomMultiLineChart 
                            data={combinedRepositoriesData} 
                            chartId="combined-repositories"
                            lines={[
                                {
                                    dataKey: 'core',
                                    name: 'Mesh SDK',
                                    stroke: 'rgba(12, 242, 180, 1)'
                                },
                                {
                                    dataKey: 'web3sdk',
                                    name: 'Web3 SDK',
                                    stroke: 'rgba(20, 184, 166, 1)'
                                }
                            ]}
                        />
                    </div>
                </div>
            )}

            {(contributionsData.length > 0 || contributorsGrowthData.length > 0) && (
                <div className={styles.chartsGrid}>
                    {contributionsData.length > 0 && (
                        <div className={styles.chartSection}>
                            <h2>Monthly Contributions ({new Date().getFullYear()})</h2>
                            <div className={styles.chart}>
                                <CustomLineChart
                                    data={contributionsData.map(item => ({
                                        month: item.month,
                                        repositories: item.contributions
                                    }))}
                                    chartId="contributions"
                                />
                            </div>
                        </div>
                    )}

                    {contributorsGrowthData.length > 0 && (
                        <div className={styles.chartSection}>
                            <h2>Contributors Growth ({new Date().getFullYear()})</h2>
                            <div className={styles.chart}>
                                <CustomLineChart
                                    data={contributorsGrowthData.map(item => ({
                                        month: item.month,
                                        repositories: item.contributors
                                    }))}
                                    chartId="contributors"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Discord stats summary and charts */}
            {discordStatsData.length > 0 && (
                <>
                    <div className={styles.githubStats}>
                        <h2>Discord Community</h2>
                        <div className={styles.statsGrid}>
                            <div className={styles.stat}>
                                <h3>Total Members</h3>
                                <p>{formatNumber(discordStatsData[discordStatsData.length - 1].memberCount)}</p>
                            </div>
                            <div className={styles.stat}>
                                <h3>Unique Posters</h3>
                                <p>{formatNumber(discordStatsData[discordStatsData.length - 1].uniquePosters)}</p>
                            </div>
                            <div className={styles.stat}>
                                <h3>Messages Last Month</h3>
                                <p>{formatNumber(discordStatsData[discordStatsData.length - 1].totalMessages)}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartsGrid}>
                        <div className={styles.chartSection}>
                            <h2>Discord Active Users</h2>
                            <div className={styles.chart}>
                                <CustomSingleLineChart
                                    data={discordStatsData}
                                    chartId="discord-posters"
                                    dataKey="uniquePosters"
                                    name="Unique Posters"
                                    stroke="rgba(12, 242, 180, 1)"
                                    yAxisDomain={[0, 'auto']}
                                />
                            </div>
                        </div>

                        <div className={styles.chartSection}>
                            <h2>Discord Messages Activity</h2>
                            <div className={styles.chart}>
                                <CustomSingleLineChart
                                    data={discordStatsData}
                                    chartId="discord-messages"
                                    dataKey="totalMessages"
                                    name="Messages"
                                    stroke="rgba(20, 184, 166, 1)"
                                    yAxisDomain={[0, 'auto']}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartSection}>
                        <h2>Discord Members Growth</h2>
                        <div className={styles.chart}>
                            <CustomSingleLineChart
                                data={discordStatsData}
                                chartId="discord-members"
                                dataKey="memberCount"
                                name="Members"
                                stroke="rgba(56, 232, 225, 1)"
                                yAxisDomain={[0, 'auto']}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MeshStatsView; 