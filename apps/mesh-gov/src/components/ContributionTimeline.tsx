import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useMemo } from 'react';

interface ContributionTimelineProps {
    commitTimestamps: string[];
    prTimestamps: string[];
    height?: number;
    showAxis?: boolean;
    globalStartDate?: string; // Optional global start date for all timelines
    globalEndDate?: string; // Optional global end date for time window selection
}

/**
 * Parse ISO date string to Date object, handling timezone consistently
 * @param dateString - ISO date string (YYYY-MM-DD format)
 * @returns Date object set to start of day in local timezone
 */
const parseDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Check if a timestamp falls within the given date range for timeline filtering
 * @param timestamp - ISO timestamp string
 * @param startDate - Start date string or null
 * @param endDate - End date string or null  
 * @returns boolean indicating if timestamp is within range
 */
const isTimestampInRange = (timestamp: string, startDate: string | null, endDate: string | null): boolean => {
    const date = new Date(timestamp);
    const start = startDate ? parseDate(startDate) : null;
    const end = endDate ? parseDate(endDate) : null;
    
    // For end date, include the entire day
    if (end) {
        end.setHours(23, 59, 59, 999);
    }
    
    return (!start || date >= start) && (!end || date <= end);
};

export const ContributionTimeline: React.FC<ContributionTimelineProps> = ({
    commitTimestamps,
    prTimestamps,
    height = 60,
    showAxis = false,
    globalStartDate,
    globalEndDate,
}) => {
    const data = useMemo(() => {
        // Combine and sort all timestamps
        const allTimestamps = [...commitTimestamps, ...prTimestamps].sort();

        // Determine the earliest and latest dates for timeline boundaries
        let earliestDate: Date;
        let latestDate: Date;

        if (globalStartDate || globalEndDate) {
            // Use global dates for timeline boundaries
            if (globalStartDate) {
                earliestDate = parseDate(globalStartDate);
            } else {
                if (allTimestamps.length === 0) return [];
                earliestDate = new Date(allTimestamps[0]);
            }
            
            if (globalEndDate) {
                latestDate = parseDate(globalEndDate);
            } else {
                latestDate = allTimestamps.length > 0 
                    ? new Date(allTimestamps[allTimestamps.length - 1])
                    : new Date();
            }
        } else {
            // Use individual contributor's date range
            if (allTimestamps.length === 0) return [];
            earliestDate = new Date(allTimestamps[0]);
            latestDate = new Date(allTimestamps[allTimestamps.length - 1]);
        }

        // Filter timestamps to only include those within the time window
        const filteredCommitTimestamps = commitTimestamps.filter(timestamp => 
            isTimestampInRange(timestamp, globalStartDate || null, globalEndDate || null)
        );

        const filteredPrTimestamps = prTimestamps.filter(timestamp => 
            isTimestampInRange(timestamp, globalStartDate || null, globalEndDate || null)
        );

        // Create a map to count contributions per day (only from filtered timestamps)
        const contributionMap = new Map<string, { commits: number; prs: number }>();

        filteredCommitTimestamps.forEach(timestamp => {
            const date = new Date(timestamp).toISOString().split('T')[0];
            const current = contributionMap.get(date) || { commits: 0, prs: 0 };
            current.commits++;
            contributionMap.set(date, current);
        });

        filteredPrTimestamps.forEach(timestamp => {
            const date = new Date(timestamp).toISOString().split('T')[0];
            const current = contributionMap.get(date) || { commits: 0, prs: 0 };
            current.prs++;
            contributionMap.set(date, current);
        });

        // Create a complete timeline from earliest to latest date
        const timelineData = [] as Array<{ date: string; commits: number; prs: number; total: number }>;
        const currentDate = new Date(earliestDate);

        while (currentDate <= latestDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            const contributions = contributionMap.get(dateString) || { commits: 0, prs: 0 };

            timelineData.push({
                date: dateString,
                commits: contributions.commits,
                prs: contributions.prs,
                total: contributions.commits + contributions.prs
            });

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return timelineData;
    }, [commitTimestamps, prTimestamps, globalStartDate, globalEndDate]);

    // Build month-start ticks from the data range; downsample to avoid label overlaps
    const { monthTicks, monthStep } = useMemo(() => {
        if (!data.length) return { monthTicks: [] as string[], monthStep: 1 };
        const ticks: string[] = [];
        const start = new Date(data[0].date);
        start.setDate(1);
        const end = new Date(data[data.length - 1].date);
        const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        while (cursor <= end) {
            ticks.push(cursor.toISOString().split('T')[0]);
            cursor.setMonth(cursor.getMonth() + 1);
        }
        // Limit to ~12 labels
        const maxLabels = 12;
        let step = 1;
        if (ticks.length > maxLabels) {
            step = Math.ceil(ticks.length / maxLabels);
        }
        const downsampled = ticks.filter((_, idx) => idx % step === 0);
        if (downsampled[downsampled.length - 1] !== ticks[ticks.length - 1]) {
            downsampled.push(ticks[ticks.length - 1]);
        }
        return { monthTicks: downsampled, monthStep: step };
    }, [data]);

    const monthTickFormatter = (value: string) => {
        const d = new Date(value);
        const isJanuary = d.getMonth() === 0;
        const month = d.toLocaleString('en-US', { month: 'short' });
        if (monthStep > 1 || isJanuary) {
            return `${month} ${String(d.getFullYear()).slice(2)}`;
        }
        return month;
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: showAxis ? 28 : 0 }}>
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                {showAxis && (
                    <>
                        <CartesianGrid strokeDasharray="2 2" stroke="rgba(255, 255, 255, 0.08)" horizontal={true} vertical={false} />
                        <XAxis
                            dataKey="date"
                            ticks={monthTicks}
                            tickFormatter={monthTickFormatter}
                            stroke="rgba(255, 255, 255, 0.6)"
                            fontSize={10}
                            height={28}
                            interval={0}
                        />
                        <YAxis hide domain={[0, 'auto']} />
                    </>
                )}
                <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    dot={false}
                    filter="url(#glow)"
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload as any;
                            return (
                                <div style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                    padding: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                    backdropFilter: 'blur(8px)',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '0.875rem',
                                    fontFamily: 'system-ui, -apple-system, sans-serif'
                                }}>
                                    <p style={{ margin: '0 0 8px 0', color: 'rgba(255, 255, 255, 0.7)' }}>Date: {data.date}</p>
                                    <p style={{ margin: '0 0 4px 0' }}>Commits: <span style={{ color: '#FFFFFF' }}>{data.commits}</span></p>
                                    <p style={{ margin: '0 0 4px 0' }}>PRs: <span style={{ color: '#FFFFFF' }}>{data.prs}</span></p>
                                    <p style={{ margin: '0', fontWeight: '600' }}>Total: <span style={{ color: '#FFFFFF' }}>{data.total}</span></p>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default ContributionTimeline; 