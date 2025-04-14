import { FC } from 'react';
import styles from '../styles/MeshStats.module.css';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, TooltipProps } from 'recharts';
import { YearlyStats, CurrentStats } from '../types';

interface MonthlyDownload {
    month: string;
    downloads: number;
    trend: string;
}

interface PackageData {
    name: string;
    downloads: number;
}

interface MonthlyData {
    name: string;
    downloads: number;
    trend: string;
}

export interface FilteredStats {
    packageData?: PackageData[];
    monthlyData?: MonthlyData[];
    currentStats?: CurrentStats;
    yearlyStats?: Record<number, YearlyStats>;
}

interface MeshStatsViewProps {
    currentStats: CurrentStats;
    yearlyStats: Record<number, YearlyStats>;
    filteredStats?: FilteredStats;
}

const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length && payload[0].value !== undefined) {
        return (
            <div className={styles.customTooltip}>
                <p className={styles.tooltipLabel}>{label}</p>
                <p className={styles.tooltipValue}>
                    {formatNumber(payload[0].value)} downloads
                </p>
            </div>
        );
    }
    return null;
};

interface CustomBarChartProps {
    data: PackageData[] | MonthlyData[];
    chartId: string;
}

const CustomBarChart = ({ data, chartId }: CustomBarChartProps) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={8} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
                <linearGradient id={`barGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
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
                tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
                tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                dy={8}
            />
            <YAxis
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
                tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
            />
            <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
            />
            <Bar
                dataKey="downloads"
                fill={`url(#barGradient-${chartId})`}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
            >
                {data.map((entry, index) => (
                    <Cell
                        key={`cell-${index}`}
                        fill={`url(#barGradient-${chartId})`}
                    />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

const MeshStatsView: FC<MeshStatsViewProps> = ({ currentStats, yearlyStats, filteredStats }) => {
    // Determine if we're showing filtered data or all data
    const isFiltered = !!filteredStats && (filteredStats.packageData?.length || filteredStats.monthlyData?.length);

    // Use filtered package data if available, otherwise use all data
    const packageData = isFiltered && filteredStats?.packageData
        ? filteredStats.packageData
        : currentStats?.npm ? [
            { name: 'Core', downloads: currentStats.npm.downloads.last_month },
            { name: 'React', downloads: currentStats.npm.react_package_downloads },
            { name: 'Transaction', downloads: currentStats.npm.transaction_package_downloads },
            { name: 'Wallet', downloads: currentStats.npm.wallet_package_downloads },
            { name: 'Provider', downloads: currentStats.npm.provider_package_downloads },
            { name: 'Core CSL', downloads: currentStats.npm.core_csl_package_downloads },
            { name: 'Core CST', downloads: currentStats.npm.core_cst_package_downloads },
        ] : [];

    const years = Object.keys(yearlyStats || {}).map(Number).sort((a, b) => b - a);
    const latestYear = years[0];

    // Use filtered monthly data if available, otherwise use all data
    const monthlyData = isFiltered && filteredStats?.monthlyData
        ? filteredStats.monthlyData
        : latestYear && yearlyStats?.[latestYear]?.monthlyDownloads
            ? yearlyStats[latestYear].monthlyDownloads.map((month: MonthlyDownload) => ({
                name: month.month,
                downloads: month.downloads,
                trend: month.trend
            }))
            : [];

    return (
        <div data-testid="mesh-stats-view">
            {isFiltered && (
                <div className={styles.filterNotice}>
                    <h2>Filtered Results</h2>
                    <p>Showing filtered statistics based on your search criteria.</p>
                </div>
            )}

            {currentStats?.npm?.downloads && !isFiltered && (
                <>
                    <h2 className={styles.statsHeader}>meshsdk/core downloads</h2>
                    <div className={styles.statsGrid}>
                        <div className={styles.stat}>
                            <h3>Last Week</h3>
                            <p>{formatNumber(currentStats.npm.downloads.last_week)}</p>
                        </div>
                        <div className={styles.stat}>
                            <h3>Last Month</h3>
                            <p>{formatNumber(currentStats.npm.downloads.last_month)}</p>
                        </div>
                        <div className={styles.stat}>
                            <h3>Last Year</h3>
                            <p>{formatNumber(currentStats.npm.downloads.last_year)}</p>
                        </div>
                    </div>
                </>
            )}

            {currentStats?.github && !isFiltered && (
                <div className={styles.githubStats}>
                    <h2>GitHub Usage</h2>
                    <div className={styles.statsGrid}>
                        <div className={styles.stat}>
                            <h3>Projects Using Mesh</h3>
                            <p>{formatNumber(currentStats.github.core_in_package_json)}</p>
                        </div>
                        <div className={styles.stat}>
                            <h3>Total File References</h3>
                            <p>{formatNumber(currentStats.github.core_in_any_file)}</p>
                        </div>
                        {currentStats.contributors?.unique_count && (
                            <div className={styles.stat}>
                                <h3>GitHub Contributors</h3>
                                <p>{formatNumber(currentStats.contributors.unique_count)}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {packageData.length > 0 && monthlyData.length > 0 && (
                <div className={styles.chartsGrid}>
                    <div className={styles.chartSection}>
                        <h2>Package Downloads {isFiltered ? '(Filtered)' : '(Last 12 Months)'}</h2>
                        <div className={styles.chart}>
                            <CustomBarChart data={packageData} chartId="package" />
                        </div>
                    </div>

                    <div className={styles.chartSection}>
                        <h2>Monthly Downloads {isFiltered ? '(Filtered)' : `(${latestYear})`}</h2>
                        <div className={styles.chart}>
                            <CustomBarChart data={monthlyData} chartId="monthly" />
                        </div>
                    </div>
                </div>
            )}

            {years.length > 0 && !isFiltered && (
                <div className={styles.chartSection}>
                    <h2>Yearly Comparison</h2>
                    <div className={styles.yearGrid}>
                        {years.map(year => (
                            <div key={year} className={styles.year}>
                                <h3>{year}</h3>
                                <p>Total Core Downloads: {formatNumber(yearlyStats[year].yearlyTotals.core)}</p>
                                <p>Peak Month: {yearlyStats[year].peakMonth.name} ({formatNumber(yearlyStats[year].peakMonth.downloads)})</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeshStatsView; 