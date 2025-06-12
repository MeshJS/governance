import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from '@/styles/CommitteeMemberVoteChart.module.css';
import { CommitteeMember } from '../../types/committee';

interface CommitteeMemberVoteChartProps {
    committeeData: CommitteeMember[];
}

interface ProcessedData {
    name: string;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
}

export default function CommitteeMemberVoteChart({ committeeData }: CommitteeMemberVoteChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!committeeData || !svgRef.current) return;

        // Process data to get vote counts for each member
        const processedData: ProcessedData[] = committeeData.map(member => ({
            name: member.name || member.cc_cold_id || member.cc_hot_id || 'Unknown',
            yesVotes: (member.votes || []).filter(v => v.vote === 'Yes').length,
            noVotes: (member.votes || []).filter(v => v.vote === 'No').length,
            abstainVotes: (member.votes || []).filter(v => v.vote === 'Abstain').length
        }));

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        // Set up dimensions
        const margin = { top: 0, right: 0, bottom: 0, left: 0 };
        const width = 600 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMinYMid meet');

        // Add gradient definitions
        const defs = svg.append('defs');

        // Success gradient
        const successGradient = defs.append('linearGradient')
            .attr('id', 'gradient-success')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', '100%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '0%');
        successGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', 'var(--color-success)');
        successGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'var(--color-success-dark)');

        // Danger gradient
        const dangerGradient = defs.append('linearGradient')
            .attr('id', 'gradient-danger')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', '100%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '0%');
        dangerGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', 'var(--color-danger)');
        dangerGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'var(--color-danger-dark)');

        // Info gradient
        const infoGradient = defs.append('linearGradient')
            .attr('id', 'gradient-info')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', '100%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '0%');
        infoGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', 'var(--color-info)');
        infoGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'var(--color-info-dark)');

        // Create chart group
        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create tooltip div
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', styles.tooltip)
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.85)')
            .style('border', '1px solid var(--color-border)')
            .style('padding', '12px')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('color', 'var(--color-text)')
            .style('box-shadow', '0 2px 4px rgba(0,0,0,0.2)')
            .style('z-index', '1000')
            .style('width', '180px')
            .style('min-height', '80px')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('gap', '4px');

        // Create scales
        const y = d3.scaleBand()
            .domain(processedData.map(d => d.name))
            .range([0, height])
            .padding(0.2);

        const x = d3.scaleLinear()
            .domain([0, d3.max(processedData, d => d.yesVotes + d.noVotes + d.abstainVotes) || 0])
            .range([0, width]);

        // Create stacked data
        const stack = d3.stack<ProcessedData>()
            .keys(['yesVotes', 'noVotes', 'abstainVotes'])
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const stackedData = stack(processedData);

        // Add bars
        chartGroup.append('g')
            .selectAll('g')
            .data(stackedData)
            .join('g')
            .attr('class', d => {
                switch (d.key) {
                    case 'yesVotes': return styles.yes;
                    case 'noVotes': return styles.no;
                    case 'abstainVotes': return styles.abstain;
                    default: return '';
                }
            })
            .selectAll('rect')
            .data(d => d)
            .join('rect')
            .attr('y', d => y(d.data.name) || 0)
            .attr('x', d => x(d[0]))
            .attr('width', d => x(d[1]) - x(d[0]))
            .attr('height', y.bandwidth())
            .style('transition', 'transform 0.2s ease-in-out')
            .style('transform-origin', 'left center')
            .on('mouseover', function (event, d) {
                // Get all rects for this member
                const memberRects = d3.selectAll('rect')
                    .filter((_, i, nodes) => {
                        const rect = nodes[i] as SVGElement;
                        return rect.getAttribute('y') === y(d.data.name)?.toString();
                    });

                // Scale up all rects for this member
                memberRects.style('transform', 'scale(1.05)');

                // Show tooltip immediately
                tooltip.transition()
                    .duration(0) // No delay
                    .style('opacity', 1);

                tooltip.html(`
                    <div style="font-weight: bold; color: var(--color-text); margin-bottom: 4px;">${d.data.name}</div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--color-success)">Yes:</span>
                        <span style="color: var(--color-text)">${d.data.yesVotes}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--color-danger)">No:</span>
                        <span style="color: var(--color-text)">${d.data.noVotes}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--color-info)">Abstain:</span>
                        <span style="color: var(--color-text)">${d.data.abstainVotes}</span>
                    </div>
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mousemove', function (event) {
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function (event, d) {
                // Get all rects for this member
                const memberRects = d3.selectAll('rect')
                    .filter((_, i, nodes) => {
                        const rect = nodes[i] as SVGElement;
                        return rect.getAttribute('y') === y(d.data.name)?.toString();
                    });

                // Reset scale
                memberRects.style('transform', 'scale(1)');

                // Hide tooltip
                tooltip.transition()
                    .duration(0) // No delay
                    .style('opacity', 0);
            });

        // Add text labels inside the bars
        chartGroup.append('g')
            .selectAll('text')
            .data(processedData)
            .join('text')
            .attr('x', 5)
            .attr('y', d => (y(d.name) || 0) + y.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('class', styles.barLabel)
            .text(d => {
                // Truncate text if it's too long
                const maxLength = Math.max(10, Math.floor(width / 20)); // Adjust based on available width
                return d.name.length > maxLength ? d.name.slice(0, maxLength) + '...' : d.name;
            })
            .each(function () {
                const text = d3.select(this);
                const words = text.text()?.split(/\s+/).reverse() || [];
                let word;
                let line: string[] = [];
                let lineNumber = 0;
                const lineHeight = 1.1;
                const y = text.attr('y');
                const dy = parseFloat(text.attr('dy') || '0');
                let tspan = text.text(null).append('tspan')
                    .attr('x', 5)
                    .attr('y', y)
                    .attr('dy', dy + 'em');

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(' '));
                    const node = tspan.node();
                    if (node && node.getComputedTextLength() > width - 10) {
                        line.pop();
                        tspan.text(line.join(' '));
                        line = [word];
                        tspan = text.append('tspan')
                            .attr('x', 5)
                            .attr('y', y)
                            .attr('dy', ++lineNumber * lineHeight + dy + 'em')
                            .text(word);
                    }
                }
            });

        // Clean up tooltip on component unmount
        return () => {
            tooltip.remove();
        };

    }, [committeeData]);

    return (
        <div className={styles.chartContainer}>
            <h2>CC Member Vote Breakdown</h2>
            <div className={styles.chart}>
                <svg ref={svgRef}></svg>
            </div>
        </div>
    );
} 