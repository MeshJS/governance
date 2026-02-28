import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

function getStatsFilePath(): string {
  const possiblePaths = [
    path.join(process.cwd(), '..', '..', 'community-config-registry', 'nomos-guild', 'github-stats.json'),
    path.join(process.cwd(), '..', 'community-config-registry', 'nomos-guild', 'github-stats.json'),
    path.join(process.cwd(), 'community-config-registry', 'nomos-guild', 'github-stats.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error('Nomos stats file not found');
}

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const filePath = getStatsFilePath();
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error reading nomos stats:', error.message);
    return res.status(500).json({ error: 'Failed to load Nomos stats' });
  }
}
