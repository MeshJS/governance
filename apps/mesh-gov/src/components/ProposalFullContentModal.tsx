import { useEffect, useState, useMemo } from 'react';
import styles from './ProposalFullContentModal.module.css';
import { FaTimes } from 'react-icons/fa';

interface Props {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface Section {
    title: string;
    id: string;
}

export function ProposalFullContentModal({ projectId, isOpen, onClose }: Props) {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Extract sections from content
    const sections = useMemo(() => {
        if (!content) return [];
        // Updated regex to handle sections with spaces, slashes, and ampersands
        const sectionRegex = /\[([\w/ &]+)\]/;
        const uniqueSections = new Set<string>();
        const extractedSections: Section[] = [];

        content.split('\n').forEach(line => {
            const match = line.match(sectionRegex);
            if (match && !uniqueSections.has(match[1])) {
                uniqueSections.add(match[1]);
                extractedSections.push({
                    title: match[1],
                    // Create a safe ID by removing special characters and converting to lowercase
                    id: match[1].toLowerCase()
                        .replace(/[\/&]/g, '-and-')  // Replace / and & with -and-
                        .replace(/\s+/g, '-')        // Replace spaces with dashes
                        .replace(/-+/g, '-')         // Replace multiple dashes with single dash
                });
            }
        });

        return extractedSections;
    }, [content]);

    useEffect(() => {
        if (isOpen && projectId) {
            setIsLoading(true);
            setError(null);
            
            fetch(`/api/proposals/${projectId}/full-content`)
                .then(async response => {
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(data => {
                    setContent(data);
                    setIsLoading(false);
                    // Set first section as active by default
                    if (data) {
                        const firstSection = data.split('\n').find(line => line.startsWith('[') && line.endsWith(']'));
                        if (firstSection) {
                            setActiveSection(firstSection.slice(1, -1).toLowerCase().replace(/\s+/g, '-'));
                        }
                    }
                })
                .catch(err => {
                    console.error('Error fetching proposal content:', err);
                    setError(err.message || 'Failed to load proposal content');
                    setIsLoading(false);
                });
        }
    }, [projectId, isOpen]);

    const handleSectionClick = (sectionId: string) => {
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2>Full Proposal Content</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <div className={styles.modalBody}>
                    {isLoading ? (
                        <div className={styles.loading}>Loading proposal content...</div>
                    ) : error ? (
                        <div className={styles.error}>{error}</div>
                    ) : (
                        <>
                            <div className={styles.sectionSidebar}>
                                <div className={styles.sectionList}>
                                    {sections.map((section) => (
                                        <button
                                            key={section.id}
                                            className={`${styles.sectionLink} ${activeSection === section.id ? styles.active : ''}`}
                                            onClick={() => handleSectionClick(section.id)}
                                        >
                                            {section.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.modalContent}>
                                <div className={styles.proposalContent}>
                                    {content.split('\n').map((line, index) => {
                                        // Updated regex to match the same pattern as above
                                        const sectionMatch = line.match(/\[([\w/ &]+)\]/);
                                        if (sectionMatch) {
                                            const sectionId = sectionMatch[1].toLowerCase()
                                                .replace(/[\/&]/g, '-and-')
                                                .replace(/\s+/g, '-')
                                                .replace(/-+/g, '-');
                                            return (
                                                <h3 
                                                    key={index} 
                                                    id={sectionId}
                                                    className={styles.sectionHeader}
                                                >
                                                    {line}
                                                </h3>
                                            );
                                        }
                                        // Return regular paragraph if not empty
                                        return line.trim() ? <p key={index}>{line}</p> : null;
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
} 