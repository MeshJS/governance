import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { NetworkTotals } from '@/types/network';
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
    const [isMounted, setIsMounted] = useState(false);
    const [lineConfigs, setLineConfigs] = useState<LineConfig[]>([
        { key: 'circulation', label: 'Circulation', color: '#38E8E1', enabled: true },
        { key: 'treasury', label: 'Treasury', color: '#FFD700', enabled: true },
        { key: 'reward', label: 'Reward', color: '#FF6B6B', enabled: true },
        { key: 'supply', label: 'Supply', color: '#4ECDC4', enabled: true },
        { key: 'reserves', label: 'Reserves', color: '#FF9F1C', enabled: true },
        { key: 'fees', label: 'Fees', color: '#6A0572', enabled: true },
        { key: 'deposits_stake', label: 'Stake Deposits', color: '#1A535C', enabled: true },
        { key: 'deposits_drep', label: 'DRep Deposits', color: '#4B0082', enabled: true },
        { key: 'deposits_proposal', label: 'Proposal Deposits', color: '#FF1493', enabled: true },
    ]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || !chartRef.current || !data || data.length === 0) return;

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
            .domain([0, data.length - 1])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => Math.max(...lineConfigs.map(config => d[config.key] as number))) as number])
            .range([height, 0]);

        // Create line generators for each enabled line
        const lineGenerators = lineConfigs
            .filter(config => config.enabled)
            .map(config => d3.line<NetworkTotals>()
                .x((_, i) => xScale(i))
                .y(d => yScale(d[config.key] as number))
                .curve(d3.curveMonotoneX));

        // Add axes
        svg.append('g')
            .attr('class', styles['x-axis'])
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .ticks(5)
                .tickFormat(i => `Epoch ${data[i as number].epoch_no}`));

        svg.append('g')
            .attr('class', styles['y-axis'])
            .call(d3.axisLeft(yScale)
                .ticks(5)
                .tickFormat(d => `₳${d3.format('.2s')(d as number)}`));

        // Add the lines
        lineConfigs
            .filter(config => config.enabled)
            .forEach((config, i) => {
                svg.append('path')
                    .datum(data)
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

        // Hover interaction
        overlay
            .on('mouseover', () => focus.style('display', null))
            .on('mouseout', () => {
                focus.style('display', 'none');
                setHoveredLine(null);
            })
            .on('mousemove', (event: MouseEvent) => {
                const [mouseX] = d3.pointer(event);
                const x0 = xScale.invert(mouseX);
                const i = Math.round(x0);
                if (i < 0 || i >= data.length) return;

                const d = data[i];
                setHoveredData(d);

                // Update focus elements
                lineConfigs
                    .filter(config => config.enabled)
                    .forEach(config => {
                        focus.select(`.focus-circle-${config.key}`)
                            .attr('transform', `translate(${xScale(i)},${yScale(d[config.key] as number)})`);
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
                    <div className="flex flex-wrap gap-4 mb-4">
                        {lineConfigs.map(config => (
                            <button
                                key={config.key}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all
                                    ${config.enabled ? 'bg-white/10' : 'bg-white/5'}
                                    ${hoveredLine === config.key ? 'ring-2 ring-white/20' : ''}`}
                                onClick={() => toggleLine(config.key)}
                                onMouseEnter={() => setHoveredLine(config.key)}
                                onMouseLeave={() => setHoveredLine(null)}
                            >
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: config.color }}
                                />
                                <span className="text-white/80">{config.label}</span>
                            </button>
                        ))}
                    </div>
                    <div ref={chartRef} className="w-full h-[400px]" />
                    {hoveredData && (
                        <div className="mt-4 p-3 bg-white/5 rounded-lg">
                            <div className="text-sm text-white/60">Epoch {hoveredData.epoch_no}</div>
                            {lineConfigs
                                .filter(config => config.enabled)
                                .map(config => (
                                    <div key={config.key} className="flex justify-between items-center mt-1">
                                        <span className="text-white/80">{config.label}</span>
                                        <span className="text-white">
                                            ₳{d3.format('.2s')(hoveredData[config.key] as number)}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
