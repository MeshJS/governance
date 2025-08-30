import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import styles from '../styles/Proposals.module.css';

interface DonutChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
  }>;
  total: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ title, data, total }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const COLORS = {
    active: [
      'rgba(56, 232, 225, 0.95)', // Teal
      'rgba(0, 0, 0, 0.85)', // Black
      'rgba(255, 255, 255, 0.85)', // White
    ],
    inactive: [
      'rgba(8, 74, 67, 0.8)', // Dark teal
      'rgba(0, 0, 0, 0.5)', // Black (dimmed)
      'rgba(255, 255, 255, 0.5)', // White (dimmed)
    ],
  };

  return (
    <div className={styles.donutChartContainer}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.donutChart}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    activeIndex === index ? COLORS.active[index % 3] : COLORS.inactive[index % 3]
                  }
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()}`, '']}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.donutLegend}>
        {data.map((entry, index) => (
          <div
            key={entry.name}
            className={`${styles.legendItem} ${activeIndex === index ? styles.active : ''}`}
          >
            <div className={`${styles.legendColor} ${index === 0 ? styles.distributed : ''}`} />
            <span className={styles.legendLabel}>{entry.name}</span>
            <span className={styles.legendValue}>{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
