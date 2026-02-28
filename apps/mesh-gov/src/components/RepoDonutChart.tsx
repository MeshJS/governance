import { useMemo } from 'react';
import CanvasDonutChart from './CanvasDonutChart';
import styles from '../styles/ContributorModal.module.css';

interface ContributorRepository {
  name: string;
  commits: number;
  contributions: number;
  pull_requests: number;
}

interface RepoDonutChartProps {
  repositories: ContributorRepository[];
}

const GRADIENT_STOPS = ['#FFFFFF', '#E6E6E6', '#CCCCCC', '#000'];
const LEGEND_GRADIENT = 'linear-gradient(135deg, #FFFFFF 0%, #E6E6E6 40%, #CCCCCC 80%, #000 100%)';

const RepoDonutChart: React.FC<RepoDonutChartProps> = ({ repositories }) => {
  const chartData = useMemo(() => {
    const sorted = [...repositories].sort((a, b) => b.contributions - a.contributions);
    const topRepos = sorted.slice(0, 12);
    const otherRepos = sorted.slice(12);
    const otherContributions = otherRepos.reduce((sum, repo) => sum + repo.contributions, 0);
    const otherCommits = otherRepos.reduce((sum, repo) => sum + repo.commits, 0);
    const otherPRs = otherRepos.reduce((sum, repo) => sum + repo.pull_requests, 0);

    return otherContributions > 0
      ? [
          ...topRepos,
          {
            name: 'Others',
            contributions: otherContributions,
            commits: otherCommits,
            pull_requests: otherPRs,
          },
        ]
      : topRepos;
  }, [repositories]);

  const segments = useMemo(
    () =>
      chartData.map(repo => ({
        key: repo.name,
        value: repo.contributions,
        label: repo.name,
        gradientStops: GRADIENT_STOPS,
      })),
    [chartData]
  );

  const legend = useMemo(
    () =>
      chartData.map(repo => ({
        key: repo.name,
        label: repo.name,
        formattedValue: repo.contributions.toString(),
        colorStyle: { background: LEGEND_GRADIENT },
        href:
          repo.name === 'Others'
            ? 'https://github.com/MeshJS'
            : repo.name.startsWith('nomos/')
              ? `https://github.com/nomos-guild/${repo.name.replace('nomos/', '')}`
              : `https://github.com/MeshJS/${repo.name}`,
      })),
    [chartData]
  );

  return <CanvasDonutChart segments={segments} legend={legend} styles={styles} />;
};

export default RepoDonutChart;
