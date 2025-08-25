import { useRouter } from 'next/router';
import { useData } from '../../contexts/DataContext';
import styles from '../../styles/ProposalDetail.module.css';
import PageHeader from '../../components/PageHeader';
import Image from 'next/image';
import { ProposalFullContentModal } from '../../components/ProposalFullContentModal';
import { useState } from 'react';

export default function NewWalletProposal() {
    const router = useRouter();
    const { isLoading, error } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
    const [isProposalModal, setIsProposalModal] = useState(false);

    // Updated proposal data with correct milestones and budget
    const proposalData = {
        id: 'new-wallet',
        title: "Mesh: Cross Chain production-ready wallet SDK",
        description: "Deliver a cross-chain wallet SDK with unified interfaces, Cardano & Bitcoin core modules, developer-friendly wallets, docs & packaging",
        fullDescription: `This comprehensive proposal aims to deliver a production-ready, cross-chain wallet SDK that simplifies and unifies wallet integration for developers. The process begins with developing standardized interfaces, including a multi-chain wallet interface, core Bitcoin and Cardano interfaces, a Bitcoin interface, and a CIP30 interface. These interfaces provide the foundation for consistency and usability across chains.

**Key Development Areas:**

**1. Standardized Wallet Interfaces**
We will develop comprehensive interfaces for multi-chain wallet functionality, including core Bitcoin and Cardano interfaces, Bitcoin interface, and CIP30 interface. These interfaces provide the foundation for consistency and usability across chains.

**2. Core Module Implementation**
Building on the interfaces, the project will implement and deploy core modules for both Cardano and Bitcoin. These modules will handle essential wallet logic such as secret phrase and key generation, address creation, syncing, signing, and verification, providing robust and reliable foundations for application development.

**3. Developer-Friendly Wallet Solutions**
To further improve usability, the SDK will deliver developer-friendly wallets, including a CIP30 headless wallet for Cardano with the latest features, and a Bitcoin headless wallet with standard endpoints. These headless wallets are tailored for developer testing and integration, making it easier to embed blockchain functionality into applications.

**4. Production-Ready Packaging**
The final stage of the project will focus on packaging, documentation, and reporting. The SDK will be packaged as a library, published to NPM, and fully documented within Mesh Playground. Developers will receive detailed guidance on implementation, while a close-out report and video will ensure transparency and accessibility for the community.

This step-by-step approach guarantees that the SDK will not only be cross-chain but also production-ready, consistent, and easy to adopt for developers building on Cardano and Bitcoin.`,
        category: "Cardano Open: Developers",
        budget: 100000,
        milestones: "5 Milestones",
        status: "Proposed" as const,
        fundRound: "Fund14",
        proposer: "MeshJS",
        submissionDate: "2024-01-15",
        votingDeadline: "2024-02-15",
        expectedDuration: "5 months",
        teamSize: "Mesh Contributors",
        githubRepo: "https://github.com/MeshJS/mesh",
        website: "https://meshjs.dev",
        milestoneDetails: [
            {
                id: 1,
                title: "Wallet Interfaces Development",
                description: "Develop standardized interfaces for multi-chain wallet functionality",
                budget: 20000,
                duration: "December 2025",
                outcomes: [
                    "Develop Multi-chain wallets interface",
                    "Develop Core bitcoin interface", 
                    "Develop Core cardano interface",
                    "Develop Bitcoin interface",
                    "Develop CIP30 interface",
                    "Post a twitter thread to inform the public"
                ],
                acceptanceCriteria: [
                    "Complete development for interfaces for all wallets",
                    "Completed development of the Multi-chain wallets interface",
                    "Completed development of the Core bitcoin interface",
                    "Completed development of the Core cardano interface", 
                    "Completed development of the Bitcoin interface",
                    "Completed development of the CIP30 interface",
                    "Post a twitter thread to inform the public"
                ],
                evidenceOfCompletion: [
                    "Public link to the developed code on Mesh GitHub",
                    "Public link to post on Twitter/X to inform the Public"
                ]
            },
            {
                id: 2,
                title: "Wallet Core Development",
                description: "Develop and deploy core modules for Cardano and Bitcoin wallets",
                budget: 20000,
                duration: "January 2026",
                outcomes: [
                    "Develop and deploy Cardano core module",
                    "Develop and display Bitcoin core module",
                    "Publish all code base updates on the respective github repository",
                    "Post a twitter thread to inform the public"
                ],
                acceptanceCriteria: [
                    "Completed development for wallet core module, including:",
                    "Implementation of base logic for wallet",
                    "Generation of secret phrase and all keys",
                    "Building all addresses, like payment, stake, DRep, script addresses",
                    "Sync wallet",
                    "Sign transactions", 
                    "Sign data and verify signatures",
                    "Post a twitter thread to inform the public"
                ],
                evidenceOfCompletion: [
                    "Public link to the developed code on Mesh GitHub",
                    "Public link to post on Twitter/X to inform the Public"
                ]
            },
            {
                id: 3,
                title: "Cardano Developer Friendly Wallets",
                description: "Develop and deploy a CIP30 headless wallet with latest features",
                budget: 20000,
                duration: "February 2026",
                outcomes: [
                    "Develop and deploy a CIP30 headless wallet",
                    "Publish all code base updates on the respective github repository",
                    "Post a twitter thread to inform the public"
                ],
                acceptanceCriteria: [
                    "Completed development of mesh wallet with all latest CIP30 features",
                    "Published code-base updates at the respective github repository",
                    "Published a twitter thread to inform the public"
                ],
                evidenceOfCompletion: [
                    "Public link to the developed code on Mesh GitHub",
                    "Public link to post on Twitter/X to inform the Public"
                ]
            },
            {
                id: 4,
                title: "Bitcoin Developer Friendly Wallets", 
                description: "Develop a Bitcoin standard headless wallet with all standard endpoints",
                budget: 20000,
                duration: "March 2026",
                outcomes: [
                    "Develop a Bitcoin \"standard\" headless wallet",
                    "Publish all code base updates on the respective github repository",
                    "Post a twitter thread to inform the public"
                ],
                acceptanceCriteria: [
                    "Completed development of bitcoin wallet with all the standard endpoints",
                    "Published code-base updates at the respective github repository", 
                    "Published a twitter thread to inform the public"
                ],
                evidenceOfCompletion: [
                    "Public link to the developed code on Mesh GitHub",
                    "Public link to post on Twitter/X to inform the Public"
                ]
            },
            {
                id: 5,
                title: "Packaging, Documentation & Reporting",
                description: "Complete packaging, documentation and project reporting",
                budget: 20000,
                duration: "April 2026",
                outcomes: [
                    "Add documentation to Mesh Playground",
                    "Package the wallet as a library",
                    "Publish to NPM",
                    "Close out Report",
                    "Close out Video",
                    "Publish all code base updates on the respective github repository",
                    "Post a twitter thread to inform the public"
                ],
                acceptanceCriteria: [
                    "Completed Packaging",
                    "Completed Docs for Developers",
                    "Completed Close Out Report", 
                    "Completed Close Out Video",
                    "Published code-base updates at the respective github repository",
                    "Published a twitter thread to inform the public"
                ],
                evidenceOfCompletion: [
                    "Public link to the developed code on Mesh GitHub",
                    "Public link to Documentation for developers",
                    "Public link to the Close Out Report",
                    "Public link to the Close Out Video",
                    "Public link to post on Twitter/X to inform the Public"
                ]
            }
        ]
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

    const formatBudget = (amount: number): string => {
        return `₳${amount.toLocaleString()}`;
    };

    const getStatusStyle = (status: string): string => {
        switch (status) {
            case 'Draft': return styles.statusDraft;
            case 'Under Review': return styles.statusUnderReview;
            case 'Voting': return styles.statusVoting;
            case 'Approved': return styles.statusApproved;
            case 'Rejected': return styles.statusRejected;
            case 'Proposed': return styles.statusProposed;
            default: return styles.statusDraft;
        }
    };

    return (
        <div className={styles.container}>
            <PageHeader
                title={<>Proposal <span>Details</span></>}
                subtitle="Detailed information about this Catalyst proposal"
            />

            <div className={styles.proposalHeader}>
                <div className={styles.headerTop}>
                    <div className={styles.badges}>
                        <span className={`${styles.status} ${getStatusStyle(proposalData.status)}`}>
                            {proposalData.status}
                        </span>
                        <span className={styles.fundRound}>
                            {proposalData.fundRound}
                        </span>
                    </div>
                    <button 
                        className={styles.backButton}
                        onClick={() => router.back()}
                    >
                        ← Back
                    </button>
                </div>
                <h1 className={styles.title}>{proposalData.title}</h1>
                <p className={styles.shortDescription}>{proposalData.description}</p>
            </div>

            <div className={styles.content}>
                <div className={styles.mainContent}>
                    <div className={styles.imageSection}>
                        <Image
                            src="/new-wallet.png"
                            alt="Mesh New Wallet SDK"
                            width={400}
                            height={250}
                            className={styles.proposalImage}
                        />
                    </div>




                </div>

                <div className={styles.sidebar}>
                    <div className={styles.infoCard}>
                        <h3>Proposal Information</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Project Catalyst</span>
                                <span className={styles.infoValue}>Fund 14</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Category</span>
                                <span className={styles.infoValue}>Cardano Open: Developers</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Proposal Budget</span>
                                <span className={styles.infoValue}>100k Ada</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Proposer</span>
                                <span className={styles.infoValue}>Mesh</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Duration</span>
                                <span className={styles.infoValue}>5 month</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.linksCard}>
                        <h3>Resources</h3>
                        <div className={styles.linksList}>
                            <button 
                                className={styles.readFullProposalButton}
                                onClick={() => {
                                    setIsProposalModal(true);
                                    setIsModalOpen(true);
                                }}
                            >
                                Read Full Proposal
                            </button>
                            <a href={proposalData.githubRepo} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                                GitHub Repository
                            </a>
                            <a href="https://meshjs.dev/apis/wallets" target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                                Project Website
                            </a>
                            <a href="https://projectcatalyst.io/funds/14/cardano-open-developers/mesh-cross-chain-production-ready-wallet-sdk" target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                                Proposal On Catalyst
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.keyFeaturesSection}>
                <div className={styles.sectionHeader}>
                    <h2>Key Development Areas</h2>
                </div>
                
                <div className={styles.featuresGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <div className={styles.interfaceIcon}></div>
                        </div>
                        <h3>Standardized Interfaces</h3>
                        <p>Multi-chain wallet interfaces for Bitcoin, Cardano, and CIP30 protocols</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <div className={styles.coreModuleIcon}></div>
                        </div>
                        <h3>Core Implementation</h3>
                        <p>Essential wallet logic with secure key management and transaction handling</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <div className={styles.developerIcon}></div>
                        </div>
                        <h3>Developer-Friendly Tools</h3>
                        <p>Headless wallets optimized for testing and seamless dApp integration</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <div className={styles.packageIcon}></div>
                        </div>
                        <h3>Production Ready</h3>
                        <p>Complete packaging with comprehensive docs and NPM publishing</p>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.mainContent}>
                    <div className={styles.milestonesSection}>
                        <h2>Proposal Milestones</h2>
                        <div className={styles.roadmapContainer}>
                            <div className={styles.roadmapTimeline}>
                                {proposalData.milestoneDetails.map((milestone, index) => {
                                    const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
                                    return (
                                        <div 
                                            key={milestone.id} 
                                            className={`${styles.roadmapItem} ${styles.clickableRoadmapItem}`}
                                            onClick={() => {
                                                setSelectedMilestone(milestone);
                                                setIsProposalModal(false);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <div className={styles.roadmapIcon}>
                                                <span className={styles.milestoneRoman}>{romanNumerals[index]}</span>
                                            </div>
                                            
                                            <div className={styles.roadmapContent}>
                                                <div className={styles.roadmapHeader}>
                                                    <h3>{milestone.title}</h3>
                                                    <div className={styles.roadmapMeta}>
                                                        <span className={styles.roadmapBudget}>{formatBudget(milestone.budget)}</span>
                                                        <span className={styles.roadmapDate}>{milestone.duration}</span>
                                                    </div>
                                                </div>
                                                
                                                <p className={styles.roadmapDescription}>{milestone.description}</p>
                                                
                                                <div className={styles.roadmapTags}>
                                                    {milestone.outcomes.slice(0, 3).map((outcome, idx) => (
                                                        <span key={idx} className={styles.roadmapTag}>
                                                            {outcome.replace('Develop and deploy', '').replace('Develop', '').trim()}
                                                        </span>
                                                    ))}
                                                    <span className={styles.clickHint}>Click for details →</span>
                                                </div>
                                            </div>
                                            
                                            {index < proposalData.milestoneDetails.length - 1 && (
                                                <div className={styles.roadmapConnector}></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ProposalFullContentModal 
                projectId={isProposalModal ? "new-wallet" : undefined}
                milestoneData={!isProposalModal ? selectedMilestone : undefined}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedMilestone(null);
                    setIsProposalModal(false);
                }}
            />
        </div>
    );
} 