import React, { useMemo, useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MilestoneContent } from '../types';
import styles from './MilestoneDeliveryChart.module.css';

interface MilestoneDeliveryChartProps {
  milestones: MilestoneContent[];
}

interface MonthlyData {
  month: string;
  count: number;
  deliveries: string[];
  milestones: MilestoneContent[];
}

const MilestoneDeliveryChart: React.FC<MilestoneDeliveryChartProps> = ({ milestones }) => {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const monthlyData = useMemo(() => {
    // Group milestones by month
    const monthlyDeliveries: { [key: string]: string[] } = {};
    const monthlyMilestones: { [key: string]: MilestoneContent[] } = {};

    milestones.forEach(milestone => {
      if (milestone.delivered && milestone.delivered.trim() !== '') {
        const deliveredText = milestone.delivered.trim();

        try {
          // Handle various date formats
          let deliveredDate: Date | null = null;

          // Try different date parsing strategies
          const parseAttempts = [
            // Standard ISO formats
            () => new Date(deliveredText),
            // Try with different separators
            () => new Date(deliveredText.replace(/[-/]/g, '/')),
            // Try DD/MM/YYYY format
            () => {
              const parts = deliveredText.split(/[-/]/);
              if (parts.length === 3) {
                // Try DD/MM/YYYY
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                if (day <= 31 && month <= 12 && year > 1900) {
                  return new Date(year, month - 1, day);
                }
              }
              return null;
            },
            // Try MM/DD/YYYY format
            () => {
              const parts = deliveredText.split(/[-/]/);
              if (parts.length === 3) {
                const month = parseInt(parts[0]);
                const day = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                if (day <= 31 && month <= 12 && year > 1900) {
                  return new Date(year, month - 1, day);
                }
              }
              return null;
            },
            // Try to parse month names
            () => {
              const monthNames = [
                'january',
                'february',
                'march',
                'april',
                'may',
                'june',
                'july',
                'august',
                'september',
                'october',
                'november',
                'december',
              ];
              const lowerText = deliveredText.toLowerCase();

              for (let i = 0; i < monthNames.length; i++) {
                if (lowerText.includes(monthNames[i])) {
                  // Extract year from the string
                  const yearMatch = deliveredText.match(/\b(20\d{2})\b/);
                  if (yearMatch) {
                    const year = parseInt(yearMatch[1]);
                    // Extract day if present
                    const dayMatch = deliveredText.match(/\b(\d{1,2})\b/);
                    const day = dayMatch ? parseInt(dayMatch[1]) : 1;
                    return new Date(year, i, day);
                  }
                }
              }
              return null;
            },
          ];

          // Try each parsing method
          for (const attempt of parseAttempts) {
            try {
              const result = attempt();
              if (result && !isNaN(result.getTime())) {
                deliveredDate = result;
                break;
              }
            } catch (e) {
              // Continue to next attempt
            }
          }

          if (deliveredDate && !isNaN(deliveredDate.getTime())) {
            const monthKey = deliveredDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
            });

            if (!monthlyDeliveries[monthKey]) {
              monthlyDeliveries[monthKey] = [];
              monthlyMilestones[monthKey] = [];
            }
            monthlyDeliveries[monthKey].push(deliveredText);
            monthlyMilestones[monthKey].push(milestone);
          } else {
            console.warn('Could not parse milestone delivery date:', deliveredText);
          }
        } catch (error) {
          console.warn('Error parsing milestone delivery date:', deliveredText, error);
        }
      }
    });

    // Convert to array format for chart
    const rawData: MonthlyData[] = Object.entries(monthlyDeliveries)
      .map(([month, deliveries]) => ({
        month,
        count: deliveries.length,
        deliveries,
        milestones: monthlyMilestones[month] || [],
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Fill in missing months with 0 deliveries to show complete timeline
    const filledData: MonthlyData[] = [];

    if (rawData.length > 0) {
      // Find the actual start and end dates from the data
      const allDates = rawData.map(item => new Date(item.month));
      const startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      const endDate = new Date(Math.max(...allDates.map(d => d.getTime())));

      // Create a map for quick lookup of existing data
      const dataMap = new Map(rawData.map(item => [item.month, item]));

      // Generate all months from start to end (inclusive)
      const currentDate = new Date(startDate);
      currentDate.setDate(1); // Set to first day of month

      // Make sure we include the end month by going one month past it
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setMonth(endDatePlusOne.getMonth() + 1);

      while (currentDate < endDatePlusOne) {
        const monthKey = currentDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        });

        if (dataMap.has(monthKey)) {
          filledData.push(dataMap.get(monthKey)!);
        } else {
          filledData.push({
            month: monthKey,
            count: 0,
            deliveries: [],
            milestones: [],
          });
        }

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    return filledData;
  }, [milestones]);

  // Custom tooltip component that also sets hover state
  const CustomTooltip = ({ active, payload, label }: any) => {
    // Use useEffect to handle state updates to avoid render-time setState calls
    useEffect(() => {
      if (active && payload && payload.length) {
        if (hoveredMonth !== label) {
          setHoveredMonth(label);
        }
      } else if (hoveredMonth && !active && !selectedMonth) {
        // Clear hover state when tooltip is not active and no month is selected
        setHoveredMonth(null);
      }
    }, [active, payload, label]);

    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            maxWidth: '280px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '6px',
              fontWeight: '600',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
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
              marginBottom: '4px',
              fontSize: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '16px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 3px rgba(255, 255, 255, 0.5)',
                }}
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' }}>
                Milestones
              </span>
            </div>
            <span
              style={{
                color: 'rgba(255, 255, 255, 1)',
                fontWeight: '600',
              }}
            >
              {data.count}
            </span>
          </div>
          <div
            style={{
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: '4px',
            }}
          >
            Click to pin details
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle chart click to select/pin a month
  const handleChartClick = (event: any) => {
    if (event && event.activeLabel) {
      setSelectedMonth(event.activeLabel);
    }
  };

  // Calculate Y-axis ticks (step of 1)
  const maxCount = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.count)) : 0;
  const yAxisTicks = Array.from({ length: maxCount + 1 }, (_, i) => i);

  // Get details for the currently displayed month (selected takes priority over hovered)
  const displayedMonth = selectedMonth || hoveredMonth;
  const displayedMonthData = displayedMonth
    ? monthlyData.find(item => item.month === displayedMonth)
    : null;

  // Handle milestone card click to navigate to proposal page
  const handleMilestoneClick = (milestone: MilestoneContent) => {
    const proposalUrl = `/catalyst-proposals/${milestone.projectId}`;
    window.open(proposalUrl, '_blank');
  };

  if (monthlyData.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Milestone Delivery Timeline</h3>
        <div className={styles.noData}>No milestone delivery data available</div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.headerLayout}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Milestone Delivery Timeline</h3>
          <p className={styles.chartSubtitle}>
            Track the number of milestones delivered each month
          </p>
        </div>
        <div className={styles.detailHeader}>
          <h4 className={styles.detailTitle}>Milestone Details</h4>
          <p className={styles.detailSubtitle}>Hover over chart points to see milestone details</p>
        </div>
      </div>

      <div className={styles.chartLayout}>
        <div className={styles.chartSection}>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={500}>
              <ComposedChart
                data={monthlyData}
                margin={{ top: 15, right: 20, left: -40, bottom: 15 }}
                onClick={handleChartClick}
              >
                <defs>
                  <linearGradient id="milestoneGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(255, 255, 255)" stopOpacity="1" />
                    <stop offset="50%" stopColor="rgb(255, 255, 255)" stopOpacity="1" />
                    <stop offset="100%" stopColor="rgb(255, 255, 255)" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="milestoneLineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 1)" />
                    <stop offset="50%" stopColor="rgba(255, 255, 255, 0.9)" />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0.8)" />
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
                  interval={0}
                />
                <YAxis
                  stroke="rgba(255, 255, 255, 0.6)"
                  fontSize={10}
                  fontWeight={500}
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                  allowDecimals={false}
                  domain={[0, maxCount]}
                  ticks={yAxisTicks}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="count"
                  fill="url(#milestoneGradient)"
                  fillOpacity={1}
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="url(#milestoneLineGradient)"
                  strokeWidth={1.5}
                  strokeOpacity={0.85}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: 'rgba(255, 255, 255, 1)',
                    stroke: 'rgba(0, 0, 0, 0.8)',
                    strokeWidth: 1.5,
                    filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))',
                  }}
                  connectNulls={false}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.detailPanel}>
          {displayedMonthData && displayedMonthData.count > 0 ? (
            <div className={styles.detailContent}>
              <div className={styles.monthHeader}>
                <span className={styles.monthName}>{displayedMonthData.month}</span>
                <span className={styles.monthCount}>
                  {displayedMonthData.count} milestone{displayedMonthData.count !== 1 ? 's' : ''}
                </span>
                {selectedMonth && (
                  <button
                    className={styles.clearButton}
                    onClick={() => setSelectedMonth(null)}
                    title="Clear selection"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className={styles.milestoneList}>
                {displayedMonthData.milestones.map((milestone: MilestoneContent, index: number) => (
                  <div
                    key={`${milestone.projectId}-${milestone.number}-${index}`}
                    className={styles.milestoneItem}
                    onClick={() => handleMilestoneClick(milestone)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.projectIdRow}>
                      <span className={styles.projectId}>Project {milestone.projectId}</span>
                    </div>
                    <div className={styles.divider}></div>
                    <div className={styles.milestoneRow}>
                      <span className={styles.milestoneNumber}>
                        {milestone.isCloseOut ? 'Close-out' : `Milestone ${milestone.number}`}
                      </span>
                    </div>
                    <div className={styles.divider}></div>
                    <div className={styles.deliveryDateRow}>
                      <span className={styles.deliveryDate}>Delivered: {milestone.delivered}</span>
                    </div>
                    {milestone.budget && (
                      <>
                        <div className={styles.divider}></div>
                        <div className={styles.budgetRow}>
                          <span className={styles.milestoneBudget}>Budget: {milestone.budget}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : displayedMonthData ? (
            <div className={styles.detailContent}>
              <div className={styles.monthHeader}>
                <span className={styles.monthName}>{displayedMonthData.month}</span>
                <span className={styles.monthCount}>No milestones delivered</span>
                {selectedMonth && (
                  <button
                    className={styles.clearButton}
                    onClick={() => setSelectedMonth(null)}
                    title="Clear selection"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.detailPlaceholder}>
              <p>
                {selectedMonth
                  ? 'Click on a month to pin details'
                  : 'Hover over a month on the chart to see detailed milestone information'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilestoneDeliveryChart;
