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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.query;

  if (!projectId || Array.isArray(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'proposals', `${projectId}.md`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    const details: ProposalDetails = {
      projectId: '',
      name: '',
      link: '',
      milestonesLink: '',
      fundingCategory: '',
      proposalBudget: '',
      status: '',
      milestonesCompleted: '',
      fundsDistributed: '',
      fundingProgress: '',
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
      } else if (line.includes('**Milestones Completed** |')) {
        details.milestonesCompleted = line.split('|')[1].trim();
      } else if (line.includes('**Funds Distributed** |')) {
        details.fundsDistributed = line.split('|')[1].trim();
      } else if (line.includes('**Funding Progress** |')) {
        details.fundingProgress = line.split('|')[1].trim();
      } else if (line.includes('**Finished** |')) {
        details.finished = line.split('|')[1].trim();
      }
    }

    // Extract description from markdown content
    const descriptionMatch = fileContent.match(/## Description\s+([\s\S]+?)(?=##|$)/);
    if (descriptionMatch) {
      details.description = descriptionMatch[1].trim();
    }

    res.status(200).json(details);
  } catch (error) {
    console.error('Error reading proposal file:', error);
    res.status(500).json({ error: 'Failed to read proposal details' });
  }
}
