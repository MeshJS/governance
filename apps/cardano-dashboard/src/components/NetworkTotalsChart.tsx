// components/NetworkTotalsChart.tsx
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { NetworkTotals } from '../../types/network';
import styles from '@/styles/NetworkTotalsChart.module.css';
import dynamic from 'next/dynamic';

interface NetworkTotalsChartProps {
    data: NetworkTotals[];
}

interface LineConfig {
    key: keyof NetworkTotals;
    label: string;
    color: string;
    enabled: boolean;
}

function NetworkTotalsChartComponent({ data }: NetworkTotalsChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const [hoveredLine, setHoveredLine] = useState<string | null>(null);
    const [hoveredData, setHoveredData] = useState<NetworkTotals | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isMounted, setIsMounted] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [lineConfigs, setLineConfigs] = useState<LineConfig[]>([
        { key: 'circulation', label: 'Circulation', color: '#4FF5F0', enabled: true },
        { key: 'treasury', label: 'Treasury', color: '#FFE44D', enabled: true },
        { key: 'reward', label: 'Reward', color: '#FF8B8B', enabled: true },
        { key: 'supply', label: 'Supply', color: '#6EFFE8', enabled: true },
        { key: 'reserves', label: 'Reserves', color: '#FFB74D', enabled: true },
        { key: 'fees', label: 'Fees', color: '#B388FF', enabled: true },
        { key: 'deposits_stake', label: 'Stake Deposits', color: '#4DB6AC', enabled: true },
        { key: 'deposits_drep', label: 'DRep Deposits', color: '#9575CD', enabled: true },
        { key: 'deposits_proposal', label: 'Proposal Deposits', color: '#FF80AB', enabled: true },
        { key: 'exchange_rate', label: 'Exchange Rate', color: '#FF5252', enabled: true },
        { key: 'active_stake', label: 'Active Stake', color: '#7CB342', enabled: true },
        { key: 'tx_count', label: 'Transaction Count', color: '#29B6F6', enabled: true },
    ]);

    useEffect(() => {
        setIsMounted(true);

        // Check if sidebar is expanded
        const sidebar = document.querySelector(`.${styles.sidebar}:not(.${styles.collapsed})`);
        setIsSidebarExpanded(!!sidebar);

        // Create observer to watch for sidebar changes
        const observer = new MutationObserver(() => {
            const sidebar = document.querySelector(`.${styles.sidebar}:not(.${styles.collapsed})`);
            setIsSidebarExpanded(!!sidebar);
        });

        // Start observing the sidebar
        const sidebarElement = document.querySelector(`.${styles.sidebar}`);
        if (sidebarElement) {
            observer.observe(sidebarElement, { attributes: true });
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isMounted || !chartRef.current || !data || data.length === 0) return;

        // Sort data by epoch number in ascending order
        const sortedData = [...data].sort((a, b) => a.epoch_no - b.epoch_no);

        // Clear any existing SVG
        d3.select(chartRef.current).selectAll('*').remove();

        // Set up dimensions
        const margin = { top: 40, right: 60, bottom: 30, left: 60 };
        const width = chartRef.current.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Set up scales
        const xScale = d3.scaleLinear()
            .domain([0, sortedData.length - 1])
            .range([0, width]);

        // Calculate percentage changes from initial values
        const percentageData = sortedData.map((d) => {
            const percentages: { [key: string]: number } = {};
            lineConfigs.forEach(config => {
                let currentValue: number;
                let initialValue: number;

                if (config.key === 'active_stake') {
                    // Handle active_stake which is a direct lovelace string
                    const currentAmount = d.active_stake;
                    const initialAmount = sortedData[0].active_stake;

                    // Convert string values to numbers and handle null cases
                    currentValue = currentAmount ? Number(currentAmount) / 1000000 : 0;
                    initialValue = initialAmount ? Number(initialAmount) / 1000000 : 0;

                    // Ensure we have valid numbers
                    if (isNaN(currentValue)) currentValue = 0;
                    if (isNaN(initialValue)) initialValue = 0;
                } else if (config.key === 'exchange_rate') {
                    // Handle exchange_rate which is a direct number
                    currentValue = d.exchange_rate || 0;
                    initialValue = sortedData[0].exchange_rate || 0;
                } else if (config.key === 'tx_count') {
                    // Handle tx_count which is a direct number
                    currentValue = d.tx_count;
                    initialValue = sortedData[0].tx_count;
                } else {
                    // Handle other metrics as before
                    currentValue = (d[config.key] as number) / 1000000;
                    initialValue = (sortedData[0][config.key] as number) / 1000000;
                }

                // Special handling for metrics that start at 0
                if (initialValue === 0) {
                    // Find the first non-zero value for this metric
                    const firstNonZero = sortedData.find(item => {
                        if (config.key === 'active_stake') {
                            return item.active_stake && Number(item.active_stake) > 0;
                        } else if (config.key === 'exchange_rate') {
                            return item.exchange_rate && item.exchange_rate > 0;
                        } else if (config.key === 'tx_count') {
                            return item.tx_count > 0;
                        }
                        return (item[config.key] as number) > 0;
                    });

                    if (firstNonZero) {
                        let baselineValue: number;
                        if (config.key === 'active_stake') {
                            baselineValue = Number(firstNonZero.active_stake) / 1000000;
                        } else if (config.key === 'exchange_rate') {
                            baselineValue = firstNonZero.exchange_rate || 0;
                        } else if (config.key === 'tx_count') {
                            baselineValue = firstNonZero.tx_count;
                        } else {
                            baselineValue = (firstNonZero[config.key] as number) / 1000000;
                        }
                        percentages[config.key] = (currentValue / baselineValue) * 100;
                    } else {
                        percentages[config.key] = 0;
                    }
                } else {
                    // Normal percentage calculation for metrics that don't start at 0
                    percentages[config.key] = (currentValue / initialValue) * 100;
                }
            });
            return {
                ...d,
                percentages
            };
        });

        // Calculate the maximum percentage value, ensuring it's a valid number
        const maxPercentage = d3.max(percentageData, d =>
            Math.max(...lineConfigs.map(config => {
                const value = d.percentages[config.key];
                return isFinite(value) ? value : 0;
            }))
        ) || 100; // Fallback to 100 if no valid values

        // Use a logarithmic scale for the y-axis to better handle the range
        const yScale = d3.scaleLog()
            .domain([1, maxPercentage]) // Start at 1 to avoid log(0)
            .range([height, 0]);

        // Create line generators for each enabled line
        const lineGenerators = lineConfigs
            .filter(config => config.enabled)
            .map(config => d3.line<{ percentages: Record<string, number> }>()
                .x((_, i) => xScale(i))
                .y(d => {
                    const value = Math.max(1, d.percentages[config.key]); // Ensure value is at least 1 for log scale
                    return yScale(value);
                })
                .curve(d3.curveMonotoneX));

        // Add axes
        svg.append('g')
            .attr('class', styles['x-axis'])
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .ticks(5)
                .tickFormat(i => `Epoch ${sortedData[i as number].epoch_no}`));

        // Custom y-axis formatting to show actual percentages
        const yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickFormat(() => ''); // Hide the numbers but keep the grid lines

        svg.append('g')
            .attr('class', styles['y-axis'])
            .call(yAxis);

        // Add the lines
        lineConfigs
            .filter(config => config.enabled)
            .forEach((config, i) => {
                svg.append('path')
                    .datum(percentageData)
                    .attr('class', `line-${config.key}`)
                    .attr('d', lineGenerators[i])
                    .style('stroke', config.color)
                    .style('stroke-width', 2)
                    .style('fill', 'none')
                    .style('opacity', hoveredLine === null || hoveredLine === config.key ? 1 : 0.3);
            });

        // Add hover effects
        const focus = svg.append('g')
            .attr('class', styles.focus)
            .style('display', 'none');

        lineConfigs
            .filter(config => config.enabled)
            .forEach(config => {
                focus.append('circle')
                    .attr('class', `focus-circle-${config.key}`)
                    .attr('r', 4)
                    .style('fill', config.color);
            });

        const overlay = svg.append('rect')
            .attr('class', styles.overlay)
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'none')
            .style('pointer-events', 'all');

        // Update hover effects
        overlay
            .on('mouseover', () => focus.style('display', null))
            .on('mouseout', () => {
                focus.style('display', 'none');
                setHoveredLine(null);
                setHoveredData(null);
            })
            .on('mousemove', (event: MouseEvent) => {
                const [mouseX] = d3.pointer(event);
                const x0 = xScale.invert(mouseX);
                const i = Math.round(x0);
                if (i < 0 || i >= sortedData.length) return;

                const d = sortedData[i];
                setHoveredData(d);

                // Get chart container position
                const chartRect = chartRef.current?.getBoundingClientRect();
                if (!chartRect) return;

                // Calculate position relative to chart container
                const tooltipX = event.clientX - chartRect.left;
                const tooltipY = event.clientY - chartRect.top;

                setTooltipPosition({
                    x: tooltipX,
                    y: tooltipY
                });

                // Update focus elements with safety checks
                lineConfigs
                    .filter(config => config.enabled)
                    .forEach(config => {
                        const value = Math.max(1, percentageData[i].percentages[config.key]);
                        focus.select(`.focus-circle-${config.key}`)
                            .attr('transform', `translate(${xScale(i)},${yScale(value)})`);
                    });
            });

    }, [data, lineConfigs, hoveredLine, isMounted, isSidebarExpanded]);

    const toggleLine = (key: keyof NetworkTotals) => {
        setLineConfigs((configs: LineConfig[]) =>
            configs.map((config: LineConfig) =>
                config.key === key ? { ...config, enabled: !config.enabled } : config
            )
        );
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Network Totals</h3>
            {!isMounted ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingText}>Loading chart...</div>
                </div>
            ) : (
                <>
                    <div className={styles.legendContainer}>
                        <div className={styles.legendItems}>
                            {lineConfigs.map(config => (
                                <span
                                    key={config.key}
                                    onClick={() => toggleLine(config.key)}
                                    onMouseEnter={() => setHoveredLine(String(config.key))}
                                    onMouseLeave={() => setHoveredLine(null)}
                                    style={{
                                        color: config.enabled ? config.color : `${config.color}80`,
                                        opacity: hoveredLine === config.key ? 1 : 0.8,
                                    }}
                                    className={styles.legendItem}
                                >
                                    {config.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div ref={chartRef} className={styles.chartContainer} />
                    {hoveredData && isMounted && (
                        <div
                            className={styles.tooltip}
                            style={{
                                left: `${tooltipPosition.x}px`,
                                top: `${tooltipPosition.y}px`,
                                transform: `translate(${tooltipPosition.x > (chartRef.current?.clientWidth || 0) - 320
                                    ? '-100%'
                                    : '10px'
                                    }, -50%)`,
                                minWidth: '300px'
                            }}
                        >
                            <div className={styles.tooltipEpoch}>Epoch {hoveredData.epoch_no}</div>
                            {lineConfigs
                                .filter(config => config.enabled)
                                .map(config => {
                                    let displayValue: string;
                                    if (config.key === 'active_stake') {
                                        const amount = hoveredData.active_stake;
                                        const value = amount ? Number(amount) / 1000000 : 0;
                                        const displayValue = isNaN(value) ? '0' : d3.format(',.0f')(value);
                                        return (
                                            <div key={config.key} className={styles.tooltipItem}>
                                                <span style={{ color: config.color }}>{config.label}: </span>
                                                <span className={styles.tooltipValue}>
                                                    ₳ {displayValue}
                                                </span>
                                            </div>
                                        );
                                    } else if (config.key === 'exchange_rate') {
                                        displayValue = `${d3.format(',.4f')(hoveredData.exchange_rate || 0)} usd/ada`;
                                    } else if (config.key === 'tx_count') {
                                        displayValue = d3.format(',')(hoveredData.tx_count);
                                    } else {
                                        const value = (hoveredData[config.key] as number) / 1000000;
                                        displayValue = `₳ ${d3.format(',.0f')(value)}`;
                                    }
                                    return (
                                        <div key={config.key} className={styles.tooltipItem}>
                                            <span style={{ color: config.color }}>{config.label}: </span>
                                            <span className={styles.tooltipValue}>
                                                {displayValue}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Export a client-side only version of the component
const NetworkTotalsChart = dynamic(() => Promise.resolve(NetworkTotalsChartComponent), {
    ssr: false
});

export default NetworkTotalsChart;
