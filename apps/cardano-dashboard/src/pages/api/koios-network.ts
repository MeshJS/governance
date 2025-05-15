import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const KOIOS_API_KEY = process.env.KOIOS_API_KEY;
    const KOIOS_API_URL = 'https://api.koios.rest/api/v1';
    const epochNo = req.query._epoch_no;
    const url = `${KOIOS_API_URL}/totals${epochNo ? `?_epoch_no=${epochNo}` : ''}`;

    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    if (KOIOS_API_KEY) {
        headers['api-key'] = KOIOS_API_KEY;
    }

    try {
        const koiosRes = await fetch(url, { headers });
        const data = await koiosRes.json();
        if (!koiosRes.ok) {
            return res.status(koiosRes.status).json({ error: 'Failed to fetch from Koios', details: data });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error });
    }
} 