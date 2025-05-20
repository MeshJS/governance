import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { NetworkTotals } from '../../types/network';
import styles from '@/styles/NetworkTotalsChart.module.css';

interface NetworkTotalsChartProps {
    data: NetworkTotals[];
}

interface LineConfig {
    key: keyof NetworkTotals;
    label: string;
    color: string;
    enabled: boolean;
}

export default function NetworkTotalsChart({ data }: NetworkTotalsChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const [hoveredLine, setHoveredLine] = useState<string | null>(null);
    const [hoveredData, setHoveredData] = useState<NetworkTotals | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isMounted, setIsMounted] = useState(false);
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
    ]);

    useEffect(() => {
        setIsMounted(true);
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
                const initialValue = (sortedData[0][config.key] as number) / 1000000;
                const currentValue = (d[config.key] as number) / 1000000;

                // Special handling for metrics that start at 0
                if (initialValue === 0) {
                    // Find the first non-zero value for this metric
                    const firstNonZero = sortedData.find(item => (item[config.key] as number) > 0);
                    if (firstNonZero) {
                        const baselineValue = (firstNonZero[config.key] as number) / 1000000;
                        // Calculate percentage relative to first non-zero value
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

                setTooltipPosition({
                    x: event.pageX,
                    y: event.pageY
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

    }, [data, lineConfigs, hoveredLine, isMounted]);

    const toggleLine = (key: string) => {
        setLineConfigs((configs: LineConfig[]) =>
            configs.map((config: LineConfig) =>
                config.key === key ? { ...config, enabled: !config.enabled } : config
            )
        );
    };

    return (
        <div className="w-full p-4 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-2xl border border-white/8 shadow-lg">
            <h3 className="text-xl text-white mb-6">Network Totals</h3>
            {!isMounted ? (
                <div className="w-full h-[400px] flex items-center justify-center">
                    <div className="text-white/60">Loading chart...</div>
                </div>
            ) : (
                <>
                    <div className="flex justify-center mb-4">
                        <div className="flex flex-wrap justify-center gap-24">
                            {lineConfigs.map(config => (
                                <span
                                    key={config.key}
                                    onClick={() => toggleLine(config.key)}
                                    onMouseEnter={() => setHoveredLine(config.key)}
                                    onMouseLeave={() => setHoveredLine(null)}
                                    style={{
                                        color: config.enabled ? config.color : `${config.color}80`,
                                        opacity: hoveredLine === config.key ? 1 : 0.8,
                                        cursor: 'pointer',
                                        transition: 'opacity 0.2s ease',
                                        margin: '0 1rem'
                                    }}
                                    className="text-sm whitespace-nowrap"
                                >
                                    {config.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div ref={chartRef} className="w-full h-[400px]" />
                    {hoveredData && (
                        <div
                            className="fixed z-[9999] bg-black/80 backdrop-blur-md shadow-lg border border-white/10 pointer-events-none"
                            style={{
                                left: `${tooltipPosition.x}px`,
                                top: `${tooltipPosition.y}px`,
                                transform: 'translate(10px, -50%)',
                                maxWidth: '300px',
                                pointerEvents: 'none',
                                position: 'fixed',
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                padding: '10px',
                                borderRadius: '5px'
                            }}
                        >
                            <div className="text-sm text-white/60 mb-3">Epoch {hoveredData.epoch_no}</div>
                            {lineConfigs
                                .filter(config => config.enabled)
                                .map(config => {
                                    const currentValue = (hoveredData[config.key] as number) / 1000000;
                                    return (
                                        <div key={config.key} className="flex justify-between items-center mt-3">
                                            <span style={{ color: config.color }}>{config.label}: </span>
                                            <span className="text-white">
                                                ₳ {d3.format(',.0f')(currentValue)}
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
