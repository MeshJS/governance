import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { MilestoneData } from '../../../utils/milestones';

function getFundingDir() {
    // Try multiple possible locations for the funding directory
    const possiblePaths = [
        path.join(process.cwd(), '..', '..', 'funding'),
        path.join(process.cwd(), '..', 'funding'),
        path.join(process.cwd(), 'funding'),
        path.join(process.cwd(), '..', '..', '..', 'funding'),
    ];

    for (const fundingPath of possiblePaths) {
        if (fs.existsSync(fundingPath)) {
            return fundingPath;
        }
    }

    throw new Error('Funding directory not found');
}

function findAllMilestoneFiles(fundingDir: string): string[] {
    const allFiles: string[] = [];
    
    try {
        const entries = fs.readdirSync(fundingDir, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const fundDir = path.join(fundingDir, entry.name);
                
                try {
                    const fundEntries = fs.readdirSync(fundDir, { withFileTypes: true });
                    
                    for (const fundEntry of fundEntries) {
                        if (fundEntry.isDirectory()) {
                            const projectDir = path.join(fundDir, fundEntry.name);
                            
                            try {
                                const projectFiles = fs.readdirSync(projectDir);
                                
                                for (const file of projectFiles) {
                                    if (file.endsWith('.md') && 
                                        (file.includes('milestone') || file.includes('close-out'))) {
                                        allFiles.push(path.join(projectDir, file));
                                    }
                                }
                            } catch (err) {
                                console.error(`Error accessing project directory ${projectDir}:`, err);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Error accessing fund directory ${fundDir}:`, err);
                }
            }
        }
    } catch (err) {
        console.error('Error accessing funding directory:', err);
        throw err;
    }

    return allFiles;
}

function extractContent(content: string): string {
    try {
        // Split by any heading that contains "Report" (with any number of #)
        const parts = content.split(/^#{1,6}\s+.*Report.*$/m);
        
        if (parts.length > 1) {
            // Take everything after the first "Report" heading
            return parts.slice(1).join('\n').trim();
        }

        // Fallback: try splitting by any heading
        const fallbackParts = content.split(/^#{1,6}\s+/m);
        if (fallbackParts.length > 1) {
            // Take everything after the first heading
            return fallbackParts.slice(1).join('\n').trim();
        }

        // If no headings found, return everything after the metadata table
        const tableEndIndex = content.indexOf('\n\n');
        if (tableEndIndex !== -1) {
            return content.slice(tableEndIndex).trim();
        }

        return content.trim();
    } catch (err) {
        console.error('Error extracting content:', err);
        return '';
    }
}

function parseMilestoneFile(content: string, fileName: string): Omit<MilestoneData, 'number'> | null {
    try {
        // Try different patterns for project ID, including nested markdown links
        const projectIdMatch = content.match(/\|Project ID\|(\d+)\|/) || 
                            content.match(/\| Project ID \|(\d+)\|/) ||
                            content.match(/\|ProjectID\|(\d+)\|/) ||
                            content.match(/\| ProjectID \|(\d+)\|/);

        // Try different patterns for budget
        const budgetMatch = content.match(/\|Milestone Budget\|(.*?)\|/) || 
                        content.match(/\| Milestone Budget \|(.*?)\|/) ||
                        content.match(/\|Budget\|(.*?)\|/) ||
                        content.match(/\| Budget \|(.*?)\|/);

        // Try different patterns for delivery date
        const deliveredMatch = content.match(/\|Delivered\|(.*?)\|/) || 
                            content.match(/\| Delivered \|(.*?)\|/) ||
                            content.match(/\|Milestone Delivered\|(.*?)\|/) ||
                            content.match(/\| Milestone Delivered \|(.*?)\|/) ||
                            content.match(/\|Due Date\|(.*?)\|/) ||
                            content.match(/\| Due Date \|(.*?)\|/);

        // Try different patterns for links, including nested markdown links
        const linkMatch = content.match(/\|(?:Milestone|Milestones|Link)\|\[(.*?)\](?:\((.*?)\)(?:\]\((.*?)\))?)\|/);

        // Try different patterns for challenge
        const challengeMatch = content.match(/\|Challenge\|(.*?)\|/) ||
                            content.match(/\| Challenge \|(.*?)\|/);

        if (!projectIdMatch) {
            console.log(`No project ID found in file ${fileName}`);
            return null;
        }

        const mainContent = extractContent(content);

        // Extract the actual link from nested markdown links
        let link = '';
        if (linkMatch) {
            // If there's a nested link, take the last URL
            const urls = linkMatch[0].match(/\(([^)]+)\)/g);
            if (urls) {
                link = urls[urls.length - 1].slice(1, -1);
            }
        }

        return {
            projectId: projectIdMatch[1],
            budget: budgetMatch?.[1]?.trim() || '',
            delivered: deliveredMatch?.[1]?.trim() || '',
            link: link,
            challenge: challengeMatch?.[1]?.trim() || '',
            content: mainContent,
            isCloseOut: fileName.includes('close-out')
        };
    } catch (err) {
        console.error(`Error parsing milestone file ${fileName}:`, err);
        return null;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MilestoneData[] | { error: string }>
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        return;
    }

    try {
        console.log('Starting milestone search for all projects');
        
        let fundingDir;
        try {
            fundingDir = getFundingDir();
        } catch (err) {
            console.error('Error finding funding directory:', err);
            res.status(500).json({ error: 'Funding directory not found' });
            return;
        }
        
        const milestoneFiles = findAllMilestoneFiles(fundingDir);
        console.log('Found milestone files:', milestoneFiles.length);

        if (milestoneFiles.length === 0) {
            console.log('No milestone files found');
            res.status(200).json([]);
            return;
        }

        const milestones: MilestoneData[] = [];

        for (const filePath of milestoneFiles) {
            const fileName = path.basename(filePath);
            
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const milestone = parseMilestoneFile(content, fileName);
                
                if (milestone) {
                    if (fileName.includes('close-out')) {
                        milestones.push({
                            ...milestone,
                            number: 9999 // Put close-out report at the end
                        });
                    } else {
                        const numberMatch = fileName.match(/milestone(\d+)/);
                        if (numberMatch) {
                            milestones.push({
                                ...milestone,
                                number: parseInt(numberMatch[1])
                            });
                        }
                    }
                }
            } catch (err) {
                console.error(`Error processing file ${fileName}:`, err);
            }
        }

        console.log(`Found ${milestones.length} milestones from all projects`);
        
        // Sort milestones by project ID and number
        const sortedMilestones = milestones.sort((a, b) => {
            if (a.projectId !== b.projectId) {
                return a.projectId.localeCompare(b.projectId);
            }
            if (a.isCloseOut) return 1;
            if (b.isCloseOut) return -1;
            return a.number - b.number;
        });

        res.status(200).json(sortedMilestones);
    } catch (error) {
        console.error('Error reading all milestones:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 