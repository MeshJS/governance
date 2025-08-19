import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import PageHeader from '../../components/PageHeader';
import { useData } from '../../contexts/DataContext';
import { ProposalFullContentModal } from '../../components/ProposalFullContentModal';
import styles from '../../styles/ProposalDetail.module.css';

export default function NewTxClassProposal() {
    const router = useRouter();
    const { isLoading, error } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
    const [isProposalModal, setIsProposalModal] = useState(false);

    // Proposal data structure
    const proposalData = {
        // Basic Information
        title: "Mesh: New Tx Class for Mesh SDK",
        description: "Unify and refactor Mesh's fragmented transaction building components into a consistent, developer-friendly framework with a new Tx class",
        category: "Cardano Open: Developers",
        budget: 100000, // in ADA
        proposer: "Mesh",
        status: "Proposed",
        fundRound: "Fund 14",
        expectedDuration: "2-12 months",
        
        // Additional Details
        fullDescription: "Mesh transaction building is fragmented, inconsistent, and lacks clear principles, making it harder for developers to build, extend, and maintain dApps efficiently. This proposal will unify and refactor our TxBuilder with clear design principles, adds a new Tx class, and provides updated documentation for developers.",
        githubRepo: "https://github.com/MeshJS/mesh",
        website: "https://meshjs.dev",
        
        // Milestones Array
        milestoneDetails: [
            {
                id: 1,
                title: "Research & Design Principles",
                description: "Research existing libraries and patterns, gather developer feedback, and define solid design principles for the new transaction building framework",
                budget: 10000,
                duration: "Month 1",
                outcomes: [
                    "Research on existing libraries and patterns",
                    "Developer feedback collection on current pain points", 
                    "Clear design principles definition"
                ],
                acceptanceCriteria: [
                    "Completed feedback and research principles",
                    "Published feedback & research on mesh github",
                    "Published tweet to inform the public of the research outcomes"
                ],
                evidenceOfCompletion: [
                    "Public link to research principles outcomes as a markdown file on Mesh github repository",
                    "Public link to post on Twitter/X to inform the Public"
                ]
            },
            {
                id: 2,
                title: "Refactor Whisky TxBuilder",
                description: "Implement the updated tx-builder at Whisky as groundwork for the new tx class, including adaptor updates if needed",
                budget: 20000,
                duration: "Month 2-3",
                outcomes: [
                    "Implement updated tx-builder as ground work of new tx class",
                    "Update adaptor if needed",
                    "Complete refactoring of Whisky tx-builder"
                ],
                acceptanceCriteria: [
                    "Completed the refactoring of updated tx-builder at Whisky",
                    "Completed updated adaptor (only if required)",
                    "Completed updates on Github",
                    "Published tweet to inform the public"
                ],
                evidenceOfCompletion: [
                    "Public link to the developed code on SIDAN Lab Github",
                    "Public link to post on Twitter/X to inform the Public"
                ]
            },
            {
                id: 3,
                title: "Refactor Core-CST TxBuilder", 
                description: "Implement equivalent refactoring from core-csl at core-cst to eliminate fragmentation between transaction building components",
                budget: 20000,
                duration: "Month 4-5",
                outcomes: [
                    "Implement equivalent refactoring from core-csl at core-cst",
                    "Eliminate fragmentation between tx-builders",
                    "Align core-cst with core-csl patterns"
                ],
                acceptanceCriteria: [
                    "Completed the refactoring from core-csl at core-cst",
                    "Completed updates on Github", 
                    "Published tweet to inform the public"
                ],
                evidenceOfCompletion: [
                    "Public link to the developed code on Mesh Github",
                    "Public link to post on Twitter/X to inform the Public"
                ]
            },
            {
                id: 4,
                title: "Update Mesh TxBuilder",
                description: "Update Mesh's own TxBuilder to align with the new design principles and provide updated documentation for developers",
                budget: 20000,
                duration: "Month 6-8",
                outcomes: [
                    "Update Mesh TxBuilder with new design principles",
                    "Update documentation for developers",
                    "Ensure consistency across all tx-builders"
                ],
                acceptanceCriteria: [
                    "Completed the updated Mesh TxBuilder",
                    "Completed updates on Github",
                    "Published tweet to inform the public"
                ],
                evidenceOfCompletion: [
                    "Public link to the developed code on Mesh Github", 
                    "Public link to post on Twitter/X to inform the Public"
                ]
            },
            {
                id: 5,
                title: "New Tx Class & Documentation",
                description: "Implement the new Tx class design, create comprehensive developer documentation, and deliver close-out report and video",
                budget: 30000,
                duration: "Month 9-12",
                outcomes: [
                    "Implement new Tx class design & implementation",
                    "Create comprehensive developer documentation",
                    "Create & submit close out report",
                    "Create & submit close out video"
                ],
                acceptanceCriteria: [
                    "Completed new Tx class design & implementation",
                    "Completed Documentation for developers",
                    "Completed Close Out Report",
                    "Completed Close Out Video",
                    "Published tweet to inform the public"
                ],
                evidenceOfCompletion: [
                    "Public link to the developed code on Mesh & SIDAN Lab Github",
                    "Public link to the Docs",
                    "Public link to the respective repository open source licences",
                    "Public link to the final Close Out Report", 
                    "Public link to the final Close Out Video",
                    "Public link to post on Twitter/X to inform the Public"
                ]
            }
        ]
    };

    // Helper functions
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
            {/* Page Header */}
            <PageHeader 
                title={<>Proposal <span>Details</span></>}
                subtitle="Detailed information about this Catalyst proposal"
            />

            {/* Proposal Header Section */}
            <div className={styles.proposalHeader}>
                <div className={styles.headerTop}>
                    <div className={styles.badges}>
                        <span className={getStatusStyle(proposalData.status)}>
                            {proposalData.status}
                        </span>
                        <span className={styles.fundRound}>{proposalData.fundRound}</span>
                    </div>
                    <button className={styles.backButton} onClick={() => router.back()}>
                        ← Back
                    </button>
                </div>
                <h1 className={styles.title}>{proposalData.title}</h1>
                <p className={styles.shortDescription}>{proposalData.description}</p>
            </div>

            {/* Main Content Grid */}
            <div className={styles.content}>
                <div className={styles.mainContent}>
                    {/* Image section (no background styling) */}
                    <div className={styles.imageSection}>
                        <Image
                            src="/new-tx-class.png"
                            alt="New Tx Class Proposal"
                            width={400}
                            height={250}
                            className={styles.proposalImage}
                        />
                    </div>
                </div>
                <div className={styles.sidebar}>
                    {/* Proposal Information */}
                    <div className={styles.infoCard}>
                        <h3>Proposal Information</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Project Catalyst</span>
                                <span className={styles.infoValue}>{proposalData.fundRound}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Category</span>
                                <span className={styles.infoValue}>{proposalData.category}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Proposal Budget</span>
                                <span className={styles.infoValue}>{formatBudget(proposalData.budget)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Proposer</span>
                                <span className={styles.infoValue}>{proposalData.proposer}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Duration</span>
                                <span className={styles.infoValue}>{proposalData.expectedDuration}</span>
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
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
                            <a href={proposalData.website} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                                Project Website
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Development Areas (full width, no background) */}
            <div className={styles.keyFeaturesSection}>
                <div className={styles.sectionHeader}>
                    <h2>Key Development Areas</h2>
                </div>
                
                <div className={styles.featuresGrid}>
                    <div className={styles.featureCard}>
                        <h3>Unified Transaction Building</h3>
                        <p>Consolidate fragmented tx-builders across Whisky, core-csl, and core-cst into a single, coherent framework with consistent APIs and patterns.</p>
                        <div className={styles.featureList}>
                            <span>Whisky Integration</span>
                            <span>Core-CSL Alignment</span>
                            <span>Core-CST Refactoring</span>
                        </div>
                    </div>

                    <div className={styles.featureCard}>
                        <h3>New Tx Class Design</h3>
                        <p>Implement a modular, extensible Tx class built on solid design principles that makes transaction building intuitive and maintainable for developers.</p>
                        <div className={styles.featureList}>
                            <span>Modular Architecture</span>
                            <span>Clear Design Principles</span>
                            <span>Developer-Friendly APIs</span>
                        </div>
                    </div>

                    <div className={styles.featureCard}>
                        <h3>Enhanced Documentation</h3>
                        <p>Create comprehensive, AI-optimized documentation that serves both human developers and AI models, accelerating adoption and reducing learning curves.</p>
                        <div className={styles.featureList}>
                            <span>Human-Readable Docs</span>
                            <span>AI Model Optimization</span>
                            <span>Interactive Examples</span>
                        </div>
                    </div>

                    <div className={styles.featureCard}>
                        <h3>Developer Experience</h3>
                        <p>Eliminate duplication, reduce complexity, and provide consistent patterns that make extending and maintaining transaction logic straightforward.</p>
                        <div className={styles.featureList}>
                            <span>Reduced Complexity</span>
                            <span>Consistent Patterns</span>
                            <span>Better Maintainability</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Proposal Milestones (full width) */}
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
                                                            {outcome.replace('Implement', '').replace('Create', '').replace('Update', '').trim()}
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

            {/* Modal Component */}
            <ProposalFullContentModal 
                projectId={isProposalModal ? "new-tx-class" : undefined}
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