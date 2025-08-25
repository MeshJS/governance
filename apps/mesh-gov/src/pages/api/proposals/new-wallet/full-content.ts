import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get the absolute path to the main.md file for the new-wallet proposal
        const filePath = path.join(process.cwd(), '..', '..', 'funding', 'catalyst-fund14', 'mesh-new-wallet', 'main.md');
        
        console.log(`Looking for new-wallet proposal file at: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            console.log(`New-wallet proposal file not found: ${filePath}`);
            return res.status(404).json({ error: 'Proposal content not found' });
        }

        console.log(`Found new-wallet proposal file: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Set content type to plain text
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(content);
        
    } catch (error) {
        console.error('Error reading new-wallet proposal file:', error);
        res.status(500).json({ error: 'Failed to read proposal content' });
    }
} 