import CanvasDonutChart, { GradientStop } from './CanvasDonutChart';
import styles from '../styles/Proposals.module.css';

interface CatalystBudgetDonutProps {
  totalBudget: number;
  distributedBudget: number;
}

const formatAda = (amount: number): string => {
  return `₳ ${new Intl.NumberFormat('en-US').format(amount)}`;
};

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

const CatalystBudgetDonut: React.FC<CatalystBudgetDonutProps> = ({
  totalBudget,
  distributedBudget,
}) => {
  const segments = [
    {
      key: 'distributed',
      value: distributedBudget,
      label: 'Received Funds',
      gradientStops: WHITE_GRADIENT,
      hoverGradientStops: WHITE_HOVER,
    },
    {
      key: 'remaining',
      value: totalBudget - distributedBudget,
      label: 'Remaining Funds',
      gradientStops: BLACK_GRADIENT,
      hoverGradientStops: BLACK_HOVER,
    },
  ];

  const legend = [
    {
      key: 'distributed',
      label: 'Received Funds',
      formattedValue: formatAda(distributedBudget),
      colorClassName: `${styles.legendColor} ${styles.distributed}`,
    },
    {
      key: 'remaining',
      label: 'Remaining Funds',
      formattedValue: formatAda(totalBudget - distributedBudget),
      colorClassName: `${styles.legendColor} ${styles.remaining}`,
    },
  ];

  return <CanvasDonutChart segments={segments} legend={legend} styles={styles} />;
};

export default CatalystBudgetDonut;
