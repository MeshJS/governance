import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const KOIOS_API_KEY = process.env.KOIOS_API_KEY;
    const KOIOS_API_URL = 'https://api.koios.rest/api/v1';
    const epochNo = req.query._epoch_no;
    const includeNextEpoch = req.query._include_next_epoch === 'true';
    const url = `${KOIOS_API_URL}/epoch_info${epochNo ? `?_epoch_no=${epochNo}` : ''}${includeNextEpoch ? '&_include_next_epoch=true' : ''}`;

    console.log('Koios Epoch Info API - Request URL:', url);
    console.log('Koios Epoch Info API - API Key present:', !!KOIOS_API_KEY);

    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    if (KOIOS_API_KEY) {
        headers['api-key'] = KOIOS_API_KEY;
    }

    try {
        const koiosRes = await fetch(url, { headers });
        const data = await koiosRes.json();
        console.log('Koios Epoch Info API - Response status:', koiosRes.status);
        console.log('Koios Epoch Info API - Response data:', data);

        if (!koiosRes.ok) {
            return res.status(koiosRes.status).json({ error: 'Failed to fetch from Koios', details: data });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error('Koios Epoch Info API - Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error });
    }
} 