import { useMemo } from 'react';
import CanvasDonutChart from './CanvasDonutChart';
import styles from '../styles/MeshStats.module.css';
import { PackageData } from '../types';

interface PackageDownloadsDonutProps {
  packageData: PackageData[];
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

const PackageDownloadsDonut = ({ packageData }: PackageDownloadsDonutProps) => {
  const sortedData = useMemo(
    () => [...packageData].sort((a, b) => b.downloads - a.downloads),
    [packageData]
  );

  const segments = useMemo(
    () =>
      sortedData.map(pkg => ({
        key: pkg.name,
        value: pkg.downloads,
        label: pkg.name,
        gradientStops: ['#ffffff'],
        hoverGradientStops: ['#000000'],
      })),
    [sortedData]
  );

  const legend = useMemo(
    () =>
      sortedData.map(pkg => ({
        key: pkg.name,
        label: pkg.name,
        formattedValue: formatNumber(pkg.downloads),
      })),
    [sortedData]
  );

  return <CanvasDonutChart segments={segments} legend={legend} styles={styles} />;
};

export default PackageDownloadsDonut;
