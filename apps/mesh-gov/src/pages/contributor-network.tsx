import { useData } from '../contexts/DataContext';
import styles from '../styles/ContributorNetwork.module.css';
import ContributorNetwork from '../components/ContributorNetwork';
import PageHeader from '../components/PageHeader';
import { Contributor } from '../types';

export default function ContributorNetworkPage() {
    const { meshData, isLoading, error } = useData();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!meshData) return <div>No data available</div>;

    const { contributors } = meshData.currentStats;

    return (
        <div className={styles.pageContainer}>
            <PageHeader
                title={<>Mesh <span>Contributor Network</span></>}
                subtitle="Interactive visualization of repository contributions"
            />
            
            <ContributorNetwork contributors={contributors.contributors} />
        </div>
    );
} 