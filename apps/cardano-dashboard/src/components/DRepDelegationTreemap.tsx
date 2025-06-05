import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from '@/styles/DRepDelegationTreemap.module.css';

interface DRepData {
    drep_id: string;
    total_delegated_amount: string | number;
    total_delegators: number;
    meta_json?: {
        body?: {
            givenName?: string;
        };
    } | null;
}

interface TreemapNode extends d3.HierarchyRectangularNode<DRepData> {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
}

interface HierarchyData {
    children: DRepData[];
}

interface DRepDelegationTreemapProps {
    drepData: DRepData[];
}

const DRepDelegationTreemap: React.FC<DRepDelegationTreemapProps> = ({ drepData }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!drepData || !svgRef.current) return;

        // Clear previous content
        d3.select(svgRef.current).selectAll("*").remove();

        // Set up dimensions
        const width = 700;
        const height = 315;
        const margin = { top: 10, right: 10, bottom: 10, left: 10 };

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Prepare data for treemap
        const root = d3.hierarchy<HierarchyData>({ children: drepData })
            .sum(d => {
                if ('children' in d) return 0;
                const node = d as unknown as DRepData;
                return typeof node.total_delegated_amount === 'string'
                    ? parseFloat(node.total_delegated_amount)
                    : node.total_delegated_amount;
            })
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        // Create treemap layout
        const treemap = d3.treemap<HierarchyData>()
            .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
            .padding(1);

        // Generate treemap data
        const nodes = treemap(root).descendants().slice(1) as unknown as TreemapNode[];

        // Create color scale based on ADA amount using Cardano colors
        const colorScale = d3.scaleSequential()
            .domain([0, d3.max(drepData, d =>
                typeof d.total_delegated_amount === 'string'
                    ? parseFloat(d.total_delegated_amount)
                    : d.total_delegated_amount
            ) || 0])
            .interpolator(d3.interpolateRgbBasis(['#0033AD', '#1FC7D4']));

        // Create tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', styles.tooltip)
            .style('opacity', 0);

        // Draw rectangles
        svg.selectAll('rect')
            .data(nodes)
            .enter()
            .append('rect')
            .attr('x', d => d.x0 + margin.left)
            .attr('y', d => d.y0 + margin.top)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => {
                const amount = typeof d.data.total_delegated_amount === 'string'
                    ? parseFloat(d.data.total_delegated_amount)
                    : d.data.total_delegated_amount;
                return colorScale(amount);
            })
            .attr('stroke', 'var(--border-color)')
            .on('mouseover', (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                // Extract name using the same logic as labels
                let name = 'Unknown';
                if (d.data.meta_json?.body?.givenName) {
                    if (typeof d.data.meta_json.body.givenName === 'string') {
                        name = d.data.meta_json.body.givenName;
                    } else if (typeof d.data.meta_json.body.givenName === 'object' && d.data.meta_json.body.givenName['@value']) {
                        name = d.data.meta_json.body.givenName['@value'];
                    }
                }

                // Handle cases where name might be an object or invalid value
                if (typeof name !== 'string') {
                    try {
                        name = JSON.stringify(name);
                    } catch {
                        name = 'Unknown';
                    }
                }

                const delegatedAmount = typeof d.data.total_delegated_amount === 'string'
                    ? parseFloat(d.data.total_delegated_amount)
                    : d.data.total_delegated_amount;

                tooltip.html(`
                    <strong>${name}</strong><br/>
                    Delegated Amount: ${(delegatedAmount / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} ₳<br/>
                    Delegators: ${d.data.total_delegators.toLocaleString()}
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Add labels for top 35 blocks with fade-out effect
        svg.selectAll('text')
            .data(nodes.slice(0, 35))
            .enter()
            .append('text')
            .attr('x', d => d.x0 + margin.left + 5)
            .attr('y', d => d.y0 + margin.top + 15)
            .attr('opacity', (d, i) => {
                // Calculate opacity based on position (0 to 1)
                // First 10 names are fully visible, then fade out gradually
                if (i < 10) return 1;
                return Math.max(0, 1 - ((i - 10) / 25)); // Fade out over the remaining 25 names
            })
            .text(d => {
                let name = 'Unknown';
                // Handle different meta_json structures
                if (d.data.meta_json?.body?.givenName) {
                    if (typeof d.data.meta_json.body.givenName === 'string') {
                        name = d.data.meta_json.body.givenName;
                    } else if (typeof d.data.meta_json.body.givenName === 'object' && d.data.meta_json.body.givenName['@value']) {
                        name = d.data.meta_json.body.givenName['@value'];
                    }
                }

                // Handle cases where name might be an object or invalid value
                if (typeof name !== 'string') {
                    try {
                        name = JSON.stringify(name);
                    } catch {
                        name = 'Unknown';
                    }
                }

                const maxWidth = d.x1 - d.x0 - 10; // Leave 5px padding on each side
                const fontSize = 10;
                const avgCharWidth = fontSize * 0.6; // Approximate width of characters
                const maxChars = Math.floor(maxWidth / avgCharWidth);

                return name.length > maxChars ? name.slice(0, maxChars - 3) + '...' : name;
            })
            .attr('font-size', '10px')
            .attr('fill', 'var(--text-primary)');

    }, [drepData]);

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>DRep Delegation Distribution</h3>
            <svg ref={svgRef} className={styles.treemap}></svg>
        </div>
    );
};

export default DRepDelegationTreemap; 