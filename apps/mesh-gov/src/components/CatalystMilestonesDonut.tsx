import CanvasDonutChart, { GradientStop } from './CanvasDonutChart';
import styles from '../styles/Proposals.module.css';

interface CatalystMilestonesDonutProps {
  totalMilestones: number;
  completedMilestones: number;
}

const WHITE_GRADIENT: GradientStop[] = [
  { offset: 0, color: 'rgba(255, 255, 255, 0.95)' },
  { offset: 0.4, color: 'rgba(255, 255, 255, 0.9)' },
  { offset: 0.8, color: 'rgba(255, 255, 255, 0.85)' },
  { offset: 1, color: 'rgba(255, 255, 255, 0.8)' },
];
const WHITE_HOVER: GradientStop[] = [
  { offset: 0, color: 'rgba(255, 255, 255, 1)' },
  { offset: 0.4, color: 'rgba(255, 255, 255, 0.95)' },
  { offset: 0.8, color: 'rgba(255, 255, 255, 0.9)' },
  { offset: 1, color: 'rgba(255, 255, 255, 0.85)' },
];
const BLACK_GRADIENT: GradientStop[] = [
  { offset: 0, color: 'rgba(0, 0, 0, 0.95)' },
  { offset: 0.4, color: 'rgba(0, 0, 0, 0.9)' },
  { offset: 0.8, color: 'rgba(0, 0, 0, 0.85)' },
  { offset: 1, color: 'rgba(0, 0, 0, 0.8)' },
];
const BLACK_HOVER: GradientStop[] = [
  { offset: 0, color: 'rgba(0, 0, 0, 1)' },
  { offset: 0.4, color: 'rgba(0, 0, 0, 0.95)' },
  { offset: 0.8, color: 'rgba(0, 0, 0, 0.9)' },
  { offset: 1, color: 'rgba(0, 0, 0, 0.85)' },
];

const CatalystMilestonesDonut: React.FC<CatalystMilestonesDonutProps> = ({
  totalMilestones,
  completedMilestones,
}) => {
  const segments = [
    {
      key: 'completed',
      value: completedMilestones,
      label: 'Completed Milestones',
      gradientStops: WHITE_GRADIENT,
      hoverGradientStops: WHITE_HOVER,
    },
    {
      key: 'remaining',
      value: totalMilestones - completedMilestones,
      label: 'Remaining Milestones',
      gradientStops: BLACK_GRADIENT,
      hoverGradientStops: BLACK_HOVER,
    },
  ];

  const legend = [
    {
      key: 'completed',
      label: 'Completed Milestones',
      formattedValue: completedMilestones.toString(),
      colorClassName: `${styles.legendColor} ${styles.completed}`,
    },
    {
      key: 'remaining',
      label: 'Remaining Milestones',
      formattedValue: (totalMilestones - completedMilestones).toString(),
      colorClassName: `${styles.legendColor} ${styles.remaining}`,
    },
  ];

  return <CanvasDonutChart segments={segments} legend={legend} styles={styles} />;
};

export default CatalystMilestonesDonut;
