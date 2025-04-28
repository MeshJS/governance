import { useEffect, useRef, useState } from 'react';
import styles from '../styles/DelegationGrowth.module.css';
import * as d3 from 'd3';

interface DelegationDataPoint {
    date: Date;
    totalAdaDelegated: number;
    totalDelegators: number;
}

interface DelegationGrowthChartProps {
    data: DelegationDataPoint[];
}

export default function DelegationGrowthChart({ data }: DelegationGrowthChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState<'ada' | 'delegators' | null>(null);
    const [hoveredData, setHoveredData] = useState<DelegationDataPoint | null>(null);

    useEffect(() => {
        console.log('Chart Data:', data);
        if (!chartRef.current || !data || data.length === 0) {
            console.log('Chart not rendering:', {
                hasRef: !!chartRef.current,
                hasData: !!data,
                dataLength: data?.length
            });
            return;
        }

        // Clear any existing SVG
        d3.select(chartRef.current).selectAll('*').remove();

        // Set up dimensions
        const margin = { top: 40, right: 60, bottom: 30, left: 60 };
        const width = chartRef.current.clientWidth - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        console.log('Chart dimensions:', { width, height });

        // Create SVG
        const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Set up scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, (d: DelegationDataPoint) => d.date) as [Date, Date])
            .range([0, width]);

        const yScaleAda = d3.scaleLinear()
            .domain([0, d3.max(data, (d: DelegationDataPoint) => d.totalAdaDelegated) as number])
            .range([height, 0]);

        const yScaleDelegators = d3.scaleLinear()
            .domain([0, d3.max(data, (d: DelegationDataPoint) => d.totalDelegators) as number])
            .range([height, 0]);

        // Create line generators
        const lineAda = d3.line<DelegationDataPoint>()
            .x((d: DelegationDataPoint) => xScale(d.date))
            .y((d: DelegationDataPoint) => yScaleAda(d.totalAdaDelegated))
            .curve(d3.curveMonotoneX);

        const lineDelegators = d3.line<DelegationDataPoint>()
            .x((d: DelegationDataPoint) => xScale(d.date))
            .y((d: DelegationDataPoint) => yScaleDelegators(d.totalDelegators))
            .curve(d3.curveMonotoneX);

        // Add axes
        svg.append('g')
            .attr('class', styles.xAxis)
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        svg.append('g')
            .attr('class', styles.yAxisAda)
            .call(d3.axisLeft(yScaleAda)
                .tickFormat((d: d3.NumberValue) => `₳${d3.format('.2s')(d.valueOf())}`));

        svg.append('g')
            .attr('class', styles.yAxisDelegators)
            .attr('transform', `translate(${width},0)`)
            .call(d3.axisRight(yScaleDelegators)
                .tickFormat((d: d3.NumberValue) => d3.format('.0f')(d.valueOf())));

        // Add gradients
        const gradientAda = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'gradientAda')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');

        gradientAda.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', 'rgba(255, 255, 255, 0.9)');

        gradientAda.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'rgba(255, 255, 255, 0.9)');

        const gradientDelegators = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'gradientDelegators')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');

        gradientDelegators.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', 'rgba(203, 213, 225, 0.8)');

        gradientDelegators.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'rgba(203, 213, 225, 0.8)');

        // Add the lines
        svg.append('path')
            .datum(data)
            .attr('class', `${styles.lineAda}${hovered === 'ada' ? ' ' + styles.lineAdaActive : ''}`)
            .attr('d', lineAda)
            .style('stroke', 'url(#gradientAda)');

        svg.append('path')
            .datum(data)
            .attr('class', `${styles.lineDelegators}${hovered === 'delegators' ? ' ' + styles.lineDelegatorsActive : ''}`)
            .attr('d', lineDelegators)
            .style('stroke', 'url(#gradientDelegators)');

        // Add hover effects
        const focus = svg.append('g')
            .attr('class', styles.focus)
            .style('display', 'none');

        focus.append('circle')
            .attr('class', styles.focusCircleAda)
            .attr('r', 4);

        focus.append('circle')
            .attr('class', styles.focusCircleDelegators)
            .attr('r', 4);

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
                setHovered(null);
            })
            .on('mousemove', (event: MouseEvent) => {
                const [mouseX, mouseY] = d3.pointer(event);
                const x0 = xScale.invert(mouseX);
                const bisectDate = d3.bisector<DelegationDataPoint, Date>((d: DelegationDataPoint) => d.date).left;
                const i = bisectDate(data, x0, 1);
                if (i >= data.length) return;

                const d0 = data[i - 1];
                const d1 = data[i];
                if (!d0 || !d1) return;

                const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;

                // Find the point on each line segment closest to the mouse
                const x = xScale(d.date);
                const yAda = yScaleAda(d.totalAdaDelegated);
                const yDelegators = yScaleDelegators(d.totalDelegators);

                // Get previous points for line segments
                const prevX = i > 1 ? xScale(data[i - 2].date) : x;
                const prevYAda = i > 1 ? yScaleAda(data[i - 2].totalAdaDelegated) : yAda;
                const prevYDelegators = i > 1 ? yScaleDelegators(data[i - 2].totalDelegators) : yDelegators;

                // Calculate distances to line segments
                function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
                    const A = px - x1;
                    const B = py - y1;
                    const C = x2 - x1;
                    const D = y2 - y1;

                    const dot = A * C + B * D;
                    const len_sq = C * C + D * D;
                    let param = -1;

                    if (len_sq !== 0) param = dot / len_sq;

                    let xx, yy;

                    if (param < 0) {
                        xx = x1;
                        yy = y1;
                    } else if (param > 1) {
                        xx = x2;
                        yy = y2;
                    } else {
                        xx = x1 + param * C;
                        yy = y1 + param * D;
                    }

                    const dx = px - xx;
                    const dy = py - yy;
                    return Math.sqrt(dx * dx + dy * dy);
                }

                const distanceToAda = Math.min(
                    distToSegment(mouseX, mouseY, prevX, prevYAda, x, yAda),
                    distToSegment(mouseX, mouseY, x, yAda, xScale(d1.date), yScaleAda(d1.totalAdaDelegated))
                );

                const distanceToDelegators = Math.min(
                    distToSegment(mouseX, mouseY, prevX, prevYDelegators, x, yDelegators),
                    distToSegment(mouseX, mouseY, x, yDelegators, xScale(d1.date), yScaleDelegators(d1.totalDelegators))
                );

                const threshold = 30;
                const isCloseToLine = Math.min(distanceToAda, distanceToDelegators) <= threshold;

                if (!isCloseToLine) {
                    setHovered(null);
                    focus.style('display', 'none');
                    return;
                }

                const closestLine = distanceToAda < distanceToDelegators ? 'ada' : 'delegators';

                setHovered(closestLine);
                focus.style('display', null);

                // Update focus elements
                focus.select('.focusCircleAda')
                    .attr('transform', `translate(${x},${yAda})`);

                focus.select('.focusCircleDelegators')
                    .attr('transform', `translate(${x},${yDelegators})`);

                setHoveredData(d);
            });

    }, [data, hovered]);

    return (
        <div className={styles.container} style={{ position: 'relative' }}>
            <h3 className={styles.title}>Delegation Growth</h3>
            <div className={styles.legendBox}>
                <div
                    className={
                        styles.legendItem + (hovered === 'ada' ? ' ' + styles.legendItemActive : '')
                    }
                    onMouseEnter={() => setHovered('ada')}
                    onMouseLeave={() => setHovered(null)}
                >
                    <span
                        className={styles.legendLine}
                        style={{ background: 'rgba(255, 255, 255, 0.9)' }}
                    />
                    <span className={styles.legendText}>Total ADA Delegated</span>
                </div>
                <div
                    className={
                        styles.legendItem + (hovered === 'delegators' ? ' ' + styles.legendItemActive : '')
                    }
                    onMouseEnter={() => setHovered('delegators')}
                    onMouseLeave={() => setHovered(null)}
                >
                    <span
                        className={styles.legendLine}
                        style={{ background: 'rgba(203, 213, 225, 0.8)' }}
                    />
                    <span className={styles.legendText}>Number of Delegators</span>
                </div>
                <div className={`${styles.tooltip} ${hovered ? styles.visible : ''}`}>
                    <div className={styles.tooltipContent}>
                        {hovered && (
                            <>
                                <div className={styles.tooltipValue}>
                                    {hovered === 'ada'
                                        ? `₳${d3.format('.2s')(hoveredData?.totalAdaDelegated || 0)}`
                                        : `${hoveredData?.totalDelegators || 0} delegators`}
                                </div>
                                <div className={styles.tooltipDate}>
                                    {hoveredData?.date.toLocaleDateString()}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div ref={chartRef} className={styles.chart} />
        </div>
    );
} 