import React, { useState, useEffect } from 'react';
import styles from '../styles/Proposals.module.css';
import DonutChart from '../components/DonutChart';
import VotesDonutChart from '../components/VotesDonutChart';

interface Proposal {
    id: string;
    title: string;
    description: string;
    status: string;
    totalVotes: number;
    milestones: Array<{
        completed: boolean;
    }>;
    budget: {
        total: number;
        distributed: number;
    };
}

const Proposals: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const response = await fetch('/api/proposals');
                const data = await response.json();
                setProposals(data);
            } catch (err) {
                setError('Failed to fetch proposals');
            } finally {
                setLoading(false);
            }
        };

        fetchProposals();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    const milestoneData = [
        {
            name: 'Completed',
            value: proposals.reduce((sum, p) => sum + p.milestones.filter(m => m.completed).length, 0)
        },
        {
            name: 'Remaining',
            value: proposals.reduce((sum, p) => sum + p.milestones.filter(m => !m.completed).length, 0)
        }
    ];

    const totalMilestones = proposals.reduce((sum, p) => sum + p.milestones.length, 0);

    const budgetData = [
        {
            name: 'Distributed',
            value: proposals.reduce((sum, p) => sum + p.budget.distributed, 0)
        },
        {
            name: 'Remaining',
            value: proposals.reduce((sum, p) => sum + (p.budget.total - p.budget.distributed), 0)
        }
    ];

    const totalBudget = proposals.reduce((sum, p) => sum + p.budget.total, 0);

    return (
        <div className={styles.container}>
            <div className={styles.chartsGrid}>
                <div className={styles.chartSection}>
                    <DonutChart
                        title="Milestone Completion"
                        data={milestoneData}
                        total={totalMilestones}
                    />
                </div>
                <div className={styles.chartSection}>
                    <DonutChart
                        title="Budget Distribution"
                        data={budgetData}
                        total={totalBudget}
                    />
                </div>
                <div className={styles.chartSection}>
                    <VotesDonutChart proposals={proposals} />
                </div>
            </div>
        </div>
    );
};

export default Proposals; 