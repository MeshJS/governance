import { FC, useMemo } from 'react';
import styles from '../styles/MeshStats.module.css';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, TooltipProps, LineChart, Line } from 'recharts';
import { YearlyStats, PackageData, MeshStatsViewProps } from '../types';

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
    data: PackageData[] | YearlyStats['monthlyDownloads'];
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

interface CustomLineChartProps {
    data: Array<{
        month: string;
        repositories: number;
    }>;
    chartId: string;
}

const CustomLineChart = ({ data, chartId }: CustomLineChartProps) => (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
                <linearGradient id={`lineGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
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
                dataKey="month"
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
                tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                dy={8}
            />
            <YAxis
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
                tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />
            <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
            />
            <Line
                type="monotone"
                dataKey="repositories"
                stroke={`url(#lineGradient-${chartId})`}
                strokeWidth={2}
                dot={{ fill: '#FFFFFF', strokeWidth: 2 }}
                activeDot={{ r: 4, fill: '#FFFFFF' }}
            />
        </LineChart>
    </ResponsiveContainer>
);

const MeshStatsView: FC<MeshStatsViewProps> = ({ currentStats, yearlyStats }) => {
    // Use all package data
    const packageData = currentStats?.npm ? [
        { name: 'Core', downloads: currentStats.npm.downloads.core_package_last_12_months },
        { name: 'React', downloads: currentStats.npm.react_package_downloads },
        { name: 'Transaction', downloads: currentStats.npm.transaction_package_downloads },
        { name: 'Wallet', downloads: currentStats.npm.wallet_package_downloads },
        { name: 'Provider', downloads: currentStats.npm.provider_package_downloads },
        { name: 'Core CSL', downloads: currentStats.npm.core_csl_package_downloads },
        { name: 'Core CST', downloads: currentStats.npm.core_cst_package_downloads },
    ] : [];

    const years = Object.keys(yearlyStats || {}).map(Number).sort((a, b) => b - a);
    const latestYear = years[0];

    // Use all monthly data
    const monthlyData = latestYear && yearlyStats?.[latestYear]?.monthlyDownloads
        ? yearlyStats[latestYear].monthlyDownloads.map((month: YearlyStats['monthlyDownloads'][0]) => ({
            name: month.month,
            downloads: month.downloads,
            trend: month.trend
        }))
        : [];

    // Get the current year's repositories data up to current month
    const repositoriesData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        return months.slice(0, currentMonth + 1).map(month => {
            const yearData = yearlyStats[currentYear]?.githubStats.find(stat => stat.month === month);
            return {
                month,
                repositories: yearData?.repositories || 0
            };
        });
    }, [yearlyStats]);

    return (
        <div data-testid="mesh-stats-view">
            {currentStats?.npm?.downloads && (
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

            {currentStats?.github && (
                <div className={styles.githubStats}>
                    <h2>GitHub Usage</h2>
                    <div className={styles.statsGrid}>
                        <div className={styles.stat}>
                            <h3>Projects Using Mesh</h3>
                            <p>{formatNumber(currentStats.github.core_in_repositories)}</p>
                        </div>
                        
                        {currentStats.contributors?.unique_count && (
                            <div className={styles.stat}>
                                <h3>GitHub Contributors</h3>
                                <p>{formatNumber(currentStats.contributors.unique_count)}</p>
                            </div>
                        )}
                        <div className={styles.stat}>
                            <h3>Total Contributions</h3>
                            <p>{formatNumber(currentStats.contributors.contributors.reduce((sum, contributor) => sum + contributor.contributions, 0))}</p>
                        </div>
                    </div>
                </div>
            )}

            {packageData.length > 0 && monthlyData.length > 0 && (
                <div className={styles.chartsGrid}>
                    <div className={styles.chartSection}>
                        <h2>Package Downloads (Last 12 Months)</h2>
                        <div className={styles.chart}>
                            <CustomBarChart data={packageData} chartId="package" />
                        </div>
                    </div>

                    <div className={styles.chartSection}>
                        <h2>Monthly Downloads ({latestYear})</h2>
                        <div className={styles.chart}>
                            <CustomBarChart data={monthlyData} chartId="monthly" />
                        </div>
                    </div>

                    <div className={styles.chartSection}>
                        <h2>GitHub Repositories ({new Date().getFullYear()})</h2>
                        <div className={styles.chart}>
                            <CustomLineChart data={repositoriesData} chartId="repositories" />
                        </div>
                    </div>
                </div>
            )}

            {years.length > 0 && (
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