import { useData } from '../contexts/DataContext';
import styles from '../styles/ContributorNetwork.module.css';
import ContributorNetwork from '../components/ContributorNetwork';
import PageHeader from '../components/PageHeader';

export default function ContributorNetworkPage() {
    const { contributorsData, isLoading, error } = useData();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!contributorsData) return <div>No contributor data available</div>;

    return (
        <div className={styles.pageContainer}>
            <PageHeader
                title={<>Mesh <span>Contributor Network</span></>}
                subtitle="Interactive visualization of repository contributions"
            />

            <ContributorNetwork contributors={contributorsData.contributors} />
        </div>
    );
} 