import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filePath = path.join(
      process.cwd(),
      '../../funding/catalyst-fund14/mesh-midnight-tooling/main.md'
    );
    const content = fs.readFileSync(filePath, 'utf8');
    res.status(200).send(content);
  } catch (error) {
    console.error('Error reading midnight proposal file:', error);
    res.status(404).json({ error: 'Midnight proposal content not found' });
  }
}
