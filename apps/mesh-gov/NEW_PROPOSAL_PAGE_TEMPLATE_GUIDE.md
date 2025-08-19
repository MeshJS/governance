# New Proposal Page Template Guide

This guide documents the development pattern for creating detailed proposal pages in the mesh-gov application, using the `/proposal/new-wallet` page as the reference template.

## 📁 File Structure

### Required Files
```
apps/mesh-gov/src/pages/proposal/[proposal-name].tsx
apps/mesh-gov/src/styles/ProposalDetail.module.css (shared)
apps/mesh-gov/src/pages/api/proposals/[proposal-name]/full-content.ts
funding/catalyst-fund14/[proposal-name]/main.md
funding/catalyst-fund14/[proposal-name]/[proposal-name]-milestones.md
public/[proposal-name].png (proposal image)
```

## 🏗️ Page Structure Template

### 1. Basic Page Setup

```typescript
import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { PageHeader } from '../../components/PageHeader';
import { useData } from '../../contexts/DataContext';
import { ProposalFullContentModal } from '../../components/ProposalFullContentModal';
import styles from '../../styles/ProposalDetail.module.css';

export default function [ProposalName]Proposal() {
    const router = useRouter();
    const { isLoading, error } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
    const [isProposalModal, setIsProposalModal] = useState(false);

    // Proposal data structure (see Data Structure section)
    const proposalData = { /* ... */ };

    // Helper functions (see Helper Functions section)
    const formatBudget = (amount: number): string => { /* ... */ };
    const getStatusStyle = (status: string): string => { /* ... */ };

    return (
        <div className={styles.container}>
            {/* Page content structure */}
        </div>
    );
}
```

### 2. Data Structure Template

```typescript
const proposalData = {
    // Basic Information
    title: "Proposal Title",
    description: "Brief description of the proposal",
    category: "Category Name",
    budget: 100000, // in ADA
    proposer: "Proposer Name",
    status: "Proposed", // Draft | Under Review | Voting | Approved | Rejected | Proposed
    fundRound: "Fund XX",
    expectedDuration: "X months",
    
    // Additional Details
    fullDescription: "Detailed description...",
    githubRepo: "https://github.com/...",
    website: "https://...",
    
    // Milestones Array
    milestoneDetails: [
        {
            id: 1,
            title: "Milestone Title",
            description: "Milestone description",
            budget: 20000,
            duration: "Month 1",
            outcomes: ["Outcome 1", "Outcome 2", "..."],
            acceptanceCriteria: ["Criteria 1", "Criteria 2", "..."],
            evidenceOfCompletion: ["Evidence 1", "Evidence 2", "..."]
        },
        // ... more milestones
    ]
};
```

### 3. Helper Functions Template

```typescript
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
```

## 🎨 Layout Structure

### Page Layout Hierarchy
```jsx
<div className={styles.container}>
    {/* 1. Page Header */}
    <PageHeader 
        title={<>Proposal <span>Details</span></>}
        subtitle="Detailed information about this Catalyst proposal"
    />

    {/* 2. Proposal Header Section */}
    <div className={styles.proposalHeader}>
        {/* Status badges, back button, title, description */}
    </div>

    {/* 3. Main Content Grid */}
    <div className={styles.content}>
        <div className={styles.mainContent}>
            {/* Image section (no background styling) */}
        </div>
        <div className={styles.sidebar}>
            {/* Proposal Information & Resources */}
        </div>
    </div>

    {/* 4. Key Development Areas (full width, no background) */}
    <div className={styles.keyFeaturesSection}>
        {/* Feature cards grid */}
    </div>

    {/* 5. Proposal Milestones (full width) */}
    <div className={styles.content}>
        <div className={styles.mainContent}>
            <div className={styles.milestonesSection}>
                {/* Timeline with Roman numerals */}
            </div>
        </div>
    </div>

    {/* 6. Modal Component */}
    <ProposalFullContentModal />
</div>
```

## 🎯 Key Components

### 1. Proposal Header
```jsx
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
```

### 2. Image Section (No Background Styling)
```jsx
<div className={styles.imageSection}>
    <Image
        src="/[proposal-name].png"
        alt="Proposal Image"
        width={400}
        height={250}
        className={styles.proposalImage}
    />
</div>
```

### 3. Sidebar Information
```jsx
<div className={styles.sidebar}>
    <div className={styles.infoCard}>
        <h3>Proposal Information</h3>
        <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Project Catalyst</span>
                <span className={styles.infoValue}>Fund XX</span>
            </div>
            <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Category</span>
                <span className={styles.infoValue}>Category Name</span>
            </div>
            <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Proposal Budget</span>
                <span className={styles.infoValue}>XXXk Ada</span>
            </div>
            <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Proposer</span>
                <span className={styles.infoValue}>Proposer Name</span>
            </div>
            <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Duration</span>
                <span className={styles.infoValue}>X months</span>
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
            <a href="github-repo-url" target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                GitHub Repository
            </a>
            <a href="project-website-url" target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                Project Website
            </a>
        </div>
    </div>
</div>
```

### 4. Key Development Areas (No Background Styling)
```jsx
<div className={styles.keyFeaturesSection}>
    <div className={styles.sectionHeader}>
        <h2>Key Development Areas</h2>
    </div>
    
    <div className={styles.featuresGrid}>
        {/* 4 feature cards in a row with golden ratio (1 / 1.618) */}
        <div className={styles.featureCard}>
            <h3>Feature Title</h3>
            <p>Feature description</p>
            <div className={styles.featureList}>
                <span>Tag 1</span>
                <span>Tag 2</span>
                <span>Tag 3</span>
            </div>
        </div>
        {/* Repeat for 4 cards total */}
    </div>
</div>
```

### 5. Milestone Timeline with Roman Numerals
```jsx
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
```

### 6. Modal Integration
```jsx
<ProposalFullContentModal 
    projectId={isProposalModal ? "[proposal-name]" : undefined}
    milestoneData={!isProposalModal ? selectedMilestone : undefined}
    isOpen={isModalOpen}
    onClose={() => {
        setIsModalOpen(false);
        setSelectedMilestone(null);
        setIsProposalModal(false);
    }}
/>
```

## 🎨 CSS Styling Patterns

### Key Styling Classes

#### Sections with Background (Glassmorphism)
```css
.proposalHeader,
.infoCard,
.linksCard,
.milestonesSection {
    background: linear-gradient(165deg, 
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 255, 255, 0.02) 100%
    );
    backdrop-filter: blur(20px) saturate(180%);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 2rem;
}
```

#### Sections without Background (Seamless)
```css
.imageSection,
.keyFeaturesSection {
    padding: 2rem;
    margin-bottom: 2rem;
    /* No background, border, or backdrop-filter */
}
```

#### Feature Cards (Golden Ratio)
```css
.featureCard {
    background: rgba(12, 242, 180, 0.03);
    border: 1px solid rgba(12, 242, 180, 0.08);
    border-radius: 12px;
    padding: 1.75rem;
    aspect-ratio: 1 / 1.618; /* Golden ratio vertical */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 280px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Roman Numeral Milestones
```css
.milestoneRoman {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, rgba(12, 242, 180, 0.15), rgba(12, 242, 180, 0.05));
    border: 2px solid rgba(12, 242, 180, 0.25);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    font-weight: 600;
    color: rgba(12, 242, 180, 0.95);
    font-family: 'Times New Roman', serif;
    letter-spacing: 1px;
}
```

## 🔧 API Integration

### Full Content API Endpoint
Create: `apps/mesh-gov/src/pages/api/proposals/[proposal-name]/full-content.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const filePath = path.join(process.cwd(), 'funding/catalyst-fund14/[proposal-name]/main.md');
        const content = fs.readFileSync(filePath, 'utf8');
        res.status(200).send(content);
    } catch (error) {
        console.error('Error reading proposal file:', error);
        res.status(404).json({ error: 'Proposal content not found' });
    }
}
```

## 📄 Markdown File Structure

### Main Proposal File (`main.md`)
```markdown
# Proposal Title

## Problem Statement
Description of the problem this proposal solves...

## Solution Overview
High-level description of the proposed solution...

## Technical Approach
Detailed technical implementation plan...

## Expected Impact
Description of expected outcomes and benefits...

## Team and Experience
Information about the proposing team...

## Budget Breakdown
Detailed budget allocation and justification...

## Timeline and Milestones
High-level timeline overview...

## Success Metrics
How success will be measured...

## Risk Assessment
Potential risks and mitigation strategies...
```

### Milestones File (`[proposal-name]-milestones.md`)
```markdown
# Detailed Milestones for [Proposal Name]

## Milestone 1: [Title]
**Budget:** ₳XX,XXX
**Timeline:** Month X

**Description:**
Detailed description of what will be accomplished...

**Outcomes:**
- Specific outcome 1
- Specific outcome 2
- Specific outcome 3

**Acceptance Criteria:**
- Measurable criteria 1
- Measurable criteria 2
- Measurable criteria 3

**Evidence of Completion:**
- Evidence item 1
- Evidence item 2
- Evidence item 3

[Repeat for each milestone]
```

## 🎨 Visual Design Patterns

### Color Scheme
- **Primary Teal:** `rgba(12, 242, 180, x)` for accents and highlights
- **Status Colors:** Different colors for proposal status badges
- **Text Colors:** `var(--text-color)` and `var(--text-secondary)`

### Layout Principles
1. **Full-width sections:** Header, Key Development Areas, Milestones
2. **Grid layout:** Image + sidebar for focused content
3. **No background styling:** Image and Key Development Areas blend seamlessly
4. **Glassmorphism:** Used for important info cards and milestone timeline
5. **Golden ratio:** Applied to feature cards (1 / 1.618)

### Interactive Elements
- **Hover effects:** Smooth transitions with `cubic-bezier(0.4, 0, 0.2, 1)`
- **Clickable milestones:** Transform and glow on hover
- **Modal integration:** Unified modal for both proposal and milestone content

## 🔄 Modal Integration Pattern

### State Management
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
const [isProposalModal, setIsProposalModal] = useState(false);
```

### Modal Usage
```typescript
// For full proposal content
onClick={() => {
    setIsProposalModal(true);
    setIsModalOpen(true);
}}

// For milestone details
onClick={() => {
    setSelectedMilestone(milestone);
    setIsProposalModal(false);
    setIsModalOpen(true);
}}

// Modal component
<ProposalFullContentModal 
    projectId={isProposalModal ? "[proposal-name]" : undefined}
    milestoneData={!isProposalModal ? selectedMilestone : undefined}
    isOpen={isModalOpen}
    onClose={() => {
        setIsModalOpen(false);
        setSelectedMilestone(null);
        setIsProposalModal(false);
    }}
/>
```

## 📱 Responsive Design

### Breakpoints
- **Desktop (>1024px):** 4 feature cards in a row
- **Tablet (769-1024px):** 2 feature cards per row
- **Mobile (<768px):** Single column layout

### Mobile Adaptations
```css
@media (max-width: 768px) {
    .featuresGrid {
        grid-template-columns: 1fr;
    }
    
    .featureCard {
        aspect-ratio: auto;
        min-height: auto;
    }
    
    .roadmapItem {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    
    .roadmapConnector {
        display: none;
    }
}
```

## 🚀 Implementation Checklist

### For Each New Proposal Page:

#### 1. Setup Files
- [ ] Create `/pages/proposal/[proposal-name].tsx`
- [ ] Create API endpoint `/api/proposals/[proposal-name]/full-content.ts`
- [ ] Create `funding/catalyst-fund14/[proposal-name]/main.md`
- [ ] Create `funding/catalyst-fund14/[proposal-name]/[proposal-name]-milestones.md`
- [ ] Add proposal image to `/public/[proposal-name].png`

#### 2. Update Proposal Data
- [ ] Update `proposalData` object with specific proposal details
- [ ] Customize feature cards for the specific proposal
- [ ] Update milestone data with actual project milestones
- [ ] Set correct URLs for GitHub repo and project website

#### 3. Customize Content
- [ ] Update proposal title and description
- [ ] Customize the 4 key development areas
- [ ] Adjust milestone count and Roman numerals array if needed
- [ ] Update status and fund round information

#### 4. Test Functionality
- [ ] Verify "Read Full Proposal" modal works
- [ ] Test milestone click functionality
- [ ] Check responsive design on different screen sizes
- [ ] Validate all links and navigation

## 💡 Best Practices

### Content Strategy
1. **Keep feature cards concise** - focus on key benefits
2. **Use action-oriented language** in milestones
3. **Provide clear, measurable outcomes**
4. **Include relevant tags** that summarize deliverables

### Visual Hierarchy
1. **Use consistent spacing** (2rem for sections, 1.5rem for cards)
2. **Maintain color consistency** with the teal theme
3. **Apply golden ratio** for harmonious proportions
4. **Keep interactive elements discoverable** with hover states

### Performance
1. **Optimize images** (400x250px recommended)
2. **Keep milestone data in component** for fast loading
3. **Use API endpoints** only for large content (full proposals)
4. **Implement proper error handling** for missing content

## 🎯 Customization Points

When creating a new proposal page, customize these key areas:

1. **Proposal Data:** Update all fields in `proposalData` object
2. **Feature Cards:** Adapt the 4 development areas to match the proposal
3. **Milestone Content:** Update outcomes, criteria, and evidence
4. **Resource Links:** Set correct GitHub and website URLs
5. **Image:** Replace with proposal-specific image
6. **API Endpoint:** Update the proposal name in the API path

This template provides a complete, tested pattern for creating engaging, interactive proposal detail pages that maintain consistency with the mesh-gov design system while being highly customizable for different proposals. 