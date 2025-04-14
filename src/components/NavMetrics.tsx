import { useData } from '../contexts/DataContext';
import styles from '../styles/NavMetrics.module.css';

const NavMetrics = () => {
    const { isLoading } = useData();

    if (isLoading) return null;

    return (
        <div className={styles.metricsContainer}>
            {/* Navigation metrics have been moved to their respective pages */}
        </div>
    );
};

export default NavMetrics; 