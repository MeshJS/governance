import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface ProposalDetails {
    projectId: string;
    name: string;
    link: string;
    milestonesLink: string;
    fundingCategory: string;
    proposalBudget: string;
    status: string;
    milestonesCompleted: string;
    fundsDistributed: string;
    fundingProgress: string;
    finished?: string;
    description?: string;
}

function parseProposalFromReadme(content: string, targetProjectId: string): ProposalDetails | null {
    // Split the content into sections by double newlines
    const sections = content.split('\n\n');
    
    // Find the section that contains our project ID
    const projectSection = sections.find(section => 
        section.includes(`**Project ID** | ${targetProjectId}`)
    );

    if (!projectSection) return null;

    // Parse the table format
    const lines = projectSection.split('\n');
    const details: Partial<ProposalDetails> = {
        projectId: targetProjectId
    };

    for (const line of lines) {
        if (line.includes('**Name** |')) {
            details.name = line.split('|')[1].trim();
        } else if (line.includes('**Link** |')) {
            const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (match) {
                details.link = match[2];
            }
        } else if (line.includes('**Milestones** |')) {
            const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (match) {
                details.milestonesLink = match[2];
            }
        } else if (line.includes('**Funding Category** |')) {
            details.fundingCategory = line.split('|')[1].trim();
        } else if (line.includes('**Proposal Budget** |')) {
            details.proposalBudget = line.split('|')[1].trim();
        } else if (line.includes('**Status** |')) {
            details.status = line.split('|')[1].trim();
        } else if (line.includes('**Milestones completed** |')) {
            details.milestonesCompleted = line.split('|')[1].trim();
        } else if (line.includes('**Funds distributed** |')) {
            details.fundsDistributed = line.split('|')[1].trim();
        } else if (line.includes('**Funding Progress** |')) {
            details.fundingProgress = line.split('|')[1].trim();
        } else if (line.includes('**Finished** |')) {
            details.finished = line.split('|')[1].trim();
        }
    }

    return details as ProposalDetails;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }

    const { projectId } = req.query;
    if (!projectId || Array.isArray(projectId)) {
        res.status(400).json({ error: 'Invalid project ID' });
        return;
    }

    try {
        const readmePath = path.join(process.cwd(), '../../funding/README.md');
        const content = fs.readFileSync(readmePath, 'utf-8');
        
        const proposalDetails = parseProposalFromReadme(content, projectId);
        
        if (!proposalDetails) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        res.status(200).json(proposalDetails);
    } catch (error) {
        console.error('Error reading proposal details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 