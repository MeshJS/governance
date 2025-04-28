import React, { useState, useEffect } from 'react';
import styles from '../styles/Proposals.module.css';
import DonutChart from '../components/DonutChart';
import VotesDonutChart from '../components/VotesDonutChart';
import { CatalystProject } from '../types';

interface Proposal {
    projectDetails: {
        id: number;
        title: string;
        budget: number;
        milestones_qty: number;
        funds_distributed: number;
        project_id: number;
        name: string;
        category: string;
        url: string;
        status: 'In Progress' | 'Completed';
        finished: string;
        voting: {
            proposalId: number;
            yes_votes_count: number;
            no_votes_count: number | null;
            abstain_votes_count: number | null;
            unique_wallets: number;
        };
    };
    milestonesCompleted: number;
}

const Proposals: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const response = await fetch('https://raw.githubusercontent.com/Signius/mesh-automations/main/mesh-gov-updates/catalyst-proposals/catalyst-data.json');
                const data = await response.json();
                setProposals(data.projects);
            } catch (err) {
                setError('Failed to fetch proposals');
                console.error('Error fetching proposals:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProposals();
    }, []);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    const budgetData = proposals.map(proposal => ({
        name: proposal.projectDetails.title,
        value: proposal.projectDetails.budget
    }));

    const totalBudget = proposals.reduce((sum, proposal) => sum + proposal.projectDetails.budget, 0);

    return (
        <div className={styles.container}>
            <div className={styles.chartsContainer}>
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