import { NextApiRequest, NextApiResponse } from 'next';
import { DiscordAPI } from '../../../../lib/discord';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { guildId } = req.query;

    if (!guildId || typeof guildId !== 'string') {
        return res.status(400).json({ error: 'Guild ID is required' });
    }

    try {
        const data = await DiscordAPI.getGuildStats(guildId);

        if (!data) {
            return res.status(404).json({ error: 'Guild stats not found' });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 