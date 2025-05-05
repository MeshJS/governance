import DRepVotingList from '../components/DRepVotingList';
import { useData } from '../contexts/DataContext';
import styles from '../styles/Voting.module.css';
import PageHeader from '../components/PageHeader';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import VotingDonutChart from '../components/VotingDonutChart';
import DelegationGrowthChart from '../components/DelegationGrowthChart';
import VotingTypeDonut from '../components/VotingTypeDonut';
import VotingParticipationDonut from '../components/VotingParticipationDonut';
import { CopyIcon } from '../components/Icons';

interface VoteData {
    proposalId: string;
    proposalTxHash: string;
    proposalIndex: number;
    voteTxHash: string;
    blockTime: string;
    vote: 'Yes' | 'No' | 'Abstain';
    metaUrl: string | null;
    metaHash: string | null;
    proposalTitle: string;
    proposalType: string;
    proposedEpoch: number;
    expirationEpoch: number;
    rationale: string;
}

export default function DRepVoting() {
    const { drepVotingData, isLoading, error } = useData();
    const router = useRouter();
    const [lastNavigationTime, setLastNavigationTime] = useState(0);

    const votes = drepVotingData?.votes || [];

    // Process delegation data for the growth chart
    const delegationTimelineData = useMemo(() => {
        // console.log('Raw delegation data:', drepVotingData?.delegationData?.timeline);

        if (!drepVotingData?.delegationData?.timeline?.epochs) {
            // console.log('No epochs data found');
            return [];
        }

        const currentEpoch = drepVotingData?.delegationData?.timeline?.current_epoch;
        if (!currentEpoch) {
            // console.log('No current epoch found');
            return [];
        }

        // console.log('Current epoch:', currentEpoch);
        // console.log('Available epochs:', Object.keys(drepVotingData.delegationData.timeline.epochs));

        const EPOCH_LENGTH_DAYS = 5;
        const MS_PER_DAY = 24 * 60 * 60 * 1000;

        try {
            // Convert the timeline data into the format needed for the chart
            const timelineData = Object.entries(drepVotingData.delegationData.timeline.epochs)
                .map(([epochStr, data]) => {
                    // console.log(`Processing epoch ${epochStr}:`, {
                    //     rawVotingPower: data.voting_power_lovelace,
                    //     rawDelegators: data.total_delegators,
                    //     votingPowerInAda: parseFloat(data.voting_power_lovelace) / 1_000_000
                    // });

                    const epochNumber = parseInt(epochStr);
                    if (isNaN(epochNumber)) {
                        // console.log(`Invalid epoch number: ${epochStr}`);
                        return null;
                    }

                    // Calculate date based on epoch difference
                    const epochDiff = currentEpoch - epochNumber;
                    const date = new Date(Date.now() - (epochDiff * EPOCH_LENGTH_DAYS * MS_PER_DAY));

                    // Parse voting power with error handling
                    let totalAdaDelegated = 0;
                    try {
                        totalAdaDelegated = parseFloat(data.voting_power_lovelace) / 1_000_000; // Convert lovelace to ADA
                    } catch (e) {
                        console.error(`Error parsing voting power for epoch ${epochStr}:`, e);
                    }

                    const result = {
                        date,
                        totalAdaDelegated,
                        totalDelegators: data.total_delegators || 0
                    };
                    // console.log(`Processed data point for epoch ${epochStr}:`, result);
                    return result;
                })
                .filter((item): item is NonNullable<typeof item> => item !== null)
                .sort((a, b) => a.date.getTime() - b.date.getTime());

            // console.log('Final timeline data (sorted by date):', timelineData.map(d => ({
            //     date: d.date.toISOString(),
            //     totalAdaDelegated: d.totalAdaDelegated.toLocaleString(),
            //     totalDelegators: d.totalDelegators
            // })));
            return timelineData;
        } catch (error) {
            console.error('Error processing delegation timeline data:', error);
            return [];
        }
    }, [drepVotingData?.delegationData]);

    // Stats calculated from the complete dataset
    const voteStats = useMemo(() => ({
        total: votes.length,
        yes: votes.filter(v => v.vote === 'Yes').length,
        no: votes.filter(v => v.vote === 'No').length,
        abstain: votes.filter(v => v.vote === 'Abstain').length,
    }), [votes]);

    const typeStats = useMemo(() => votes.reduce((acc, vote) => {
        acc[vote.proposalType] = (acc[vote.proposalType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [votes]);

    // Handle row click
    const handleRowClick = (proposalId: string) => {
        const now = Date.now();
        if (now - lastNavigationTime < 1000) return; // Prevent clicks within 1 second

        router.push(`/drep-voting/${proposalId}`);
        setLastNavigationTime(now);
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading voting data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <PageHeader
                title="Mesh DRep Dashboard"
                subtitle="Overview and Insights on Mesh DRep voting activities at Cardano onchain Governance"
            />

            <div className={styles.bioSection}>
                <h2 className={styles.bioTitle}>About Mesh DRep</h2>
                <p className={styles.bioContent}>
                    Mesh is an open-source project focused on building quality developer tools for Web3 builders at the Cardano Ecosystem. The Mesh DRep is operated collectively by core Mesh contributors. Our votes are submitted and signed onchain via a Multisignature account.
                </p>
                <div className={styles.drepId} onClick={() => {
                    navigator.clipboard.writeText('drep1yv4uesaj92wk8ljlsh4p7jzndnzrflchaz5fzug3zxg4naqkpeas3');
                }}>
                    drep1yv4uesaj92wk8ljlsh4p7jzndnzrflchaz5fzug3zxg4naqkpeas3
                    <CopyIcon className={styles.copyIcon} />
                </div>
            </div>

            <div className={styles.infoCardsSection}>
                <div className={styles.infoCard}>
                    <h3 className={styles.infoCardTitle}>Objectives</h3>
                    <p className={styles.infoCardContent}>
                        We are a no-drama, no-politics DRep. We dont engage in public disputes nor do we take side with any political entities or parties. We prefer writing code over tweeting, and contributing over disrupting
                    </p>
                </div>
                <div className={styles.infoCard}>
                    <h3 className={styles.infoCardTitle}>Motivation</h3>
                    <p className={styles.infoCardContent}>
                        The biggest threat to Governance is apathy, or worse, uninformed engagement. As long-time Cardano builders, we see it as our responsibility to participate meaningfully in Cardanos governance. It matters to us because we build on it every day
                    </p>
                </div>
                <div className={styles.infoCard}>
                    <h3 className={styles.infoCardTitle}>Qualification</h3>
                    <p className={styles.infoCardContent}>
                        We have been building non-stop on Cardano for years. We are experienced developers with a deep personal and professional stake in the ecosystem. Governance affects our work and our future, so we are here to help guide it with integrity and care
                    </p>
                </div>
            </div>

            {delegationTimelineData.length > 0 && (
                <DelegationGrowthChart data={delegationTimelineData} />
            )}

            <div className={styles.votingProgress}>
                <h2 className={styles.sectionTitle}>Mesh DRep votes and rationales</h2>
                <div className={styles.chartsGrid}>
                    <div className={styles.donutChartWrapper}>
                        <VotingDonutChart voteStats={voteStats} />
                    </div>
                    <div className={styles.donutChartWrapper}>
                        <VotingTypeDonut typeStats={typeStats} />
                    </div>
                    <div className={styles.donutChartWrapper}>
                        <VotingParticipationDonut totalProposals={votes.length} votedProposals={votes.length} />
                    </div>
                </div>
            </div>

            <DRepVotingList votes={votes} onRowClick={handleRowClick} />
        </div>
    );
} 