import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.query;

  if (!projectId || Array.isArray(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    // Search for the -main.md file in all fund directories
    const fundDirs = ['catalyst-fund10', 'catalyst-fund11', 'catalyst-fund12', 'catalyst-fund13'];
    let content = null;

    // Get the absolute path to the funding directory
    const fundingBasePath = path.join(process.cwd(), '..', '..', 'funding');

    for (const fundDir of fundDirs) {
      // Search in all subdirectories of the fund directory
      const fundPath = path.join(fundingBasePath, fundDir);

      if (!fs.existsSync(fundPath)) {
        console.log(`Fund directory not found: ${fundPath}`);
        continue;
      }

      const subDirs = fs
        .readdirSync(fundPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const subDir of subDirs) {
        const filePath = path.join(fundPath, subDir, `${projectId}-main.md`);
        console.log(`Checking file path: ${filePath}`);

        if (fs.existsSync(filePath)) {
          console.log(`Found proposal file: ${filePath}`);
          content = fs.readFileSync(filePath, 'utf8');
          break;
        }
      }

      if (content) break;
    }

    if (!content) {
      console.log(`No proposal file found for project ID: ${projectId}`);
      return res.status(404).json({ error: 'Proposal content not found' });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(content);
  } catch (error) {
    console.error('Error reading proposal content:', error);
    res.status(500).json({ error: 'Failed to read proposal content' });
  }
}
