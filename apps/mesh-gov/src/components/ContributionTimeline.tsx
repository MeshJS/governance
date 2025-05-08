import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface ContributionTimelineProps {
    commitTimestamps: string[];
    prTimestamps: string[];
    height?: number;
    showAxis?: boolean;
}

export const ContributionTimeline: React.FC<ContributionTimelineProps> = ({
    commitTimestamps,
    prTimestamps,
    height = 60,
    showAxis = false,
}) => {
    const data = useMemo(() => {
        // Combine and sort all timestamps
        const allTimestamps = [...commitTimestamps, ...prTimestamps].sort();

        // Create a map to count contributions per day
        const contributionMap = new Map<string, { commits: number; prs: number }>();

        allTimestamps.forEach(timestamp => {
            const date = new Date(timestamp).toISOString().split('T')[0];
            const current = contributionMap.get(date) || { commits: 0, prs: 0 };

            if (commitTimestamps.includes(timestamp)) {
                current.commits++;
            } else {
                current.prs++;
            }

            contributionMap.set(date, current);
        });

        // Convert to array format for recharts
        return Array.from(contributionMap.entries()).map(([date, counts]) => ({
            date,
            commits: counts.commits,
            prs: counts.prs,
            total: counts.commits + counts.prs
        }));
    }, [commitTimestamps, prTimestamps]);

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
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
                                    <p style={{ margin: '0 0 4px 0' }}>Commits: <span style={{ color: '#8884d8' }}>{data.commits}</span></p>
                                    <p style={{ margin: '0 0 4px 0' }}>PRs: <span style={{ color: '#8884d8' }}>{data.prs}</span></p>
                                    <p style={{ margin: '0', fontWeight: '600' }}>Total: <span style={{ color: '#8884d8' }}>{data.total}</span></p>
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