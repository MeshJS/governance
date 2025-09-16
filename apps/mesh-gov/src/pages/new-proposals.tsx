import { useData } from '../contexts/DataContext';
import styles from '../styles/Proposals.module.css';
import PageHeader from '../components/PageHeader';
import NewProposalCard from '../components/NewProposalCard';
import { useRouter } from 'next/router';

// YouTube Video Component
const YouTubeEmbed = ({ videoId }: { videoId: string }) => {
  return (
    <div className={styles.videoContainer}>
      <div className={styles.videoWrapper}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className={styles.videoIframe}
        />
      </div>
    </div>
  );
};

export default function NewProposals() {
  const { isLoading, error } = useData();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
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

  // Proposal data for demonstration
  const proposals = [
    {
      id: 1,
      title: 'Mesh: Cross Chain production-ready wallet SDK',
      description:
        'Deliver a cross-chain wallet SDK with unified interfaces, Cardano & Bitcoin core modules, developer-friendly wallets, docs & packaging',
      category: 'Cardano Open: Developers',
      budget: 100000,
      milestones: '5',
      status: 'Proposed' as const,
      fundRound: 'Fund14',
      image: 'new-wallet.png',
      route: '/proposal/new-wallet',
    },
    {
      id: 2,
      title: 'Mesh: New Tx Class for Mesh SDK',
      description:
        "Unify and refactor Mesh's fragmented transaction building components into a consistent, developer-friendly framework with a new Tx class",
      category: 'Cardano Open: Developers',
      budget: 100000,
      milestones: '5',
      status: 'Proposed' as const,
      fundRound: 'Fund14',
      image: 'new-tx-class.png',
      route: '/proposal/new-tx-class',
    },
    {
      id: 3,
      title: 'Mesh UTXOS x Mercuryo (MasterCard) x Checkpoint',
      description:
        'UTXOS provides wallet-as-a-service, transaction sponsorship, and fiat on-ramp, enabling seamless onboarding and adoption for Cardano and Bitcoin apps',
      category: 'Cardano Use Cases: Products & Partnerships',
      budget: 490000,
      milestones: '5',
      status: 'Proposed' as const,
      fundRound: 'Fund14',
      image: 'utxos.png',
      route: '/proposal/utxos',
    },
    {
      id: 4,
      title: 'Mesh: Tools & Docs for AI Models/Workflows',
      description:
        'Build solutions to optimize and upgrade open source tools and docs for AI models, ensuring AI provides more accurate quality code when building on Cardano',
      category: 'Cardano Use Cases: Concept',
      budget: 100000,
      milestones: '5 Milestones',
      status: 'Proposed' as const,
      fundRound: 'Fund14',
      image: 'mimir.png',
      route: '/proposal/mimir',
    },
    {
      id: 5,
      title: 'Mesh: Privacy-Enabled Smart Contracts and UI for Midnight',
      description:
        'Build and deliver modular smart contracts and UI templates, supported by a reusable framework, enabling developers to deploy privacy-enabled apps and reuse them across real-world cases',
      category: 'Cardano Open: Developers',
      budget: 65000,
      milestones: '4',
      status: 'Proposed' as const,
      fundRound: 'Fund14',
      image: 'midnight.png',
      route: '/proposal/midnight',
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title={
          <>
            New <span>Proposals</span>
          </>
        }
        subtitle="Our proposals for Project Catalyst Fund14, doing our part to make the Cardano ecosystem grow."
      />

      {/* YouTube Video Embed */}
      <YouTubeEmbed videoId="4dFVI35ta0s" />

      <div className={styles.list}>
        {proposals.map(proposal => (
          <NewProposalCard
            key={proposal.id}
            title={proposal.title}
            description={proposal.description}
            category={proposal.category}
            budget={proposal.budget}
            milestones={proposal.milestones}
            status={proposal.status}
            fundRound={proposal.fundRound}
            image={proposal.image}
            onClick={() => router.push(proposal.route)}
          />
        ))}
      </div>
    </div>
  );
}
