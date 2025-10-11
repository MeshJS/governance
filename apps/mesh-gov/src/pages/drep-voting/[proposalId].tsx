import { useRouter } from 'next/router';
import { useData } from '../../contexts/DataContext';
import styles from '../../styles/ProposalDetail.module.css';
import PageHeader from '../../components/PageHeader';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function ProposalDetail() {
  const router = useRouter();
  const { proposalId } = router.query;
  const { drepVotingData, isLoading, error } = useData();
  const [proposal, setProposal] = useState<VoteData | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const votes = drepVotingData?.votes || [];

  useEffect(() => {
    if (proposalId && votes.length > 0) {
      const foundProposal = votes.find(vote => vote.proposalId === proposalId);
      setProposal(foundProposal || null);
    }
  }, [proposalId, votes]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const truncateHash = (hash: string) => {
    if (!isSmallScreen) return hash;
    return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
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
        <PageHeader
          title="Proposal Not Found"
          subtitle="The requested proposal could not be found"
        />
        <div className={styles.notFound}>
          <p>The proposal with ID "{proposalId}" was not found.</p>
          <Link href="/drep-voting" className={styles.backLink}>
            ← Back to DRep Voting
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/drep-voting" className={styles.breadcrumbLink}>
          DRep Voting
        </Link>
        <span className={styles.breadcrumbSeparator}>›</span>
        <span className={styles.breadcrumbCurrent}>Proposal {proposal.proposalId}</span>
      </div>

      <PageHeader
        title={proposal.proposalTitle}
        subtitle={`${proposal.proposalType} • Proposed in Epoch ${proposal.proposedEpoch}`}
      />

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Proposal Details</h3>
            <div className={styles.metadata}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Type</span>
                <span className={styles.metaValue}>{proposal.proposalType}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Proposal ID</span>
                <span className={styles.metaValue}>{proposal.proposalId}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Epochs</span>
                <div className={styles.epochsWrapper}>
                  <div className={styles.epoch}>
                    <span className={styles.epochLabel}>Proposed</span>
                    <span className={styles.epochValue}>{proposal.proposedEpoch}</span>
                  </div>
                  <div className={styles.epoch}>
                    <span className={styles.epochLabel}>Expires</span>
                    <span className={styles.epochValue}>{proposal.expirationEpoch}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Mesh DRep Vote Rationale</h3>
            <div className={styles.rationaleContent}>
              <p className={styles.rationale}>{proposal.rationale}</p>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Transaction Details</h3>
            <div className={styles.txDetails}>
              <div className={styles.txItem}>
                <span className={styles.txLabel}>Proposal Tx</span>
                <div className={styles.txCopyWrapper}>
                  <code className={styles.txHash}>{truncateHash(proposal.proposalTxHash)}</code>
                  <button
                    className={styles.copyButton}
                    onClick={() => handleCopy(proposal.proposalTxHash)}
                    title="Copy transaction hash"
                  >
                    {copiedHash === proposal.proposalTxHash ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M13.5 4.5l-7 7L3 8"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                      >
                        <rect x="4" y="4" width="8" height="8" strokeWidth="1.5" />
                        <path d="M11 4V3H5v1M11 13v1H5v-1" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className={styles.txItem}>
                <span className={styles.txLabel}>Vote Tx</span>
                <div className={styles.txCopyWrapper}>
                  <code className={styles.txHash}>{truncateHash(proposal.voteTxHash)}</code>
                  <button
                    className={styles.copyButton}
                    onClick={() => handleCopy(proposal.voteTxHash)}
                    title="Copy transaction hash"
                  >
                    {copiedHash === proposal.voteTxHash ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M13.5 4.5l-7 7L3 8"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                      >
                        <rect x="4" y="4" width="8" height="8" strokeWidth="1.5" />
                        <path d="M11 4V3H5v1M11 13v1H5v-1" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {proposal.metaUrl && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Additional Resources</h3>
              <a
                href={proposal.metaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.resourceLink}
              >
                View Proposal Details
              </a>
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.voteCard}>
            <h3 className={styles.voteCardTitle}>Mesh DRep Vote</h3>
            <div className={`${styles.vote} ${styles[proposal.vote.toLowerCase()]}`}>
              {proposal.vote}
            </div>
          </div>

          <div className={styles.actionsCard}>
            <h3 className={styles.actionsTitle}>External Links</h3>
            <div className={styles.actions}>
              <a
                href={`https://adastat.net/governances/${proposal.proposalTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                View Proposal
              </a>
              <a
                href={`https://adastat.net/transactions/${proposal.voteTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                View Vote
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
