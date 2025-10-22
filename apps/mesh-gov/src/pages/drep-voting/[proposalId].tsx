import { useRouter } from 'next/router';
import { useData } from '../../contexts/DataContext';
import { useEffect, useState } from 'react';
import ProposalModal from '../../components/ProposalModal';
import styles from '../../styles/Voting.module.css';
import Link from 'next/link';

export default function ProposalDetail() {
  const router = useRouter();
  const { proposalId } = router.query;
  const { drepVotingData, isLoading, error } = useData();
  const [proposal, setProposal] = useState<any>(null);

  useEffect(() => {
    if (!proposalId || !drepVotingData?.votes) return;

    // Find the proposal with matching ID
    const foundProposal = drepVotingData.votes.find(vote => vote.proposalId === proposalId);
    
    if (foundProposal) {
      setProposal(foundProposal);
    } else {
      // If proposal not found, redirect to the main voting page
      router.replace('/drep-voting');
    }
  }, [proposalId, drepVotingData, router]);

  const handleClose = () => {
    router.push('/drep-voting');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading proposal details...</div>
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

  if (!proposal) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Proposal Not Found</h2>
          <p>The requested proposal could not be found.</p>
          <Link href="/drep-voting" className={styles.backLink}>
            Back to DRep Voting
          </Link>
        </div>
      </div>
    );
  }

  return <ProposalModal proposal={proposal} onClose={handleClose} />;
}
