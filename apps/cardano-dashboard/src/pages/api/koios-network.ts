import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const KOIOS_API_KEY = process.env.KOIOS_API_KEY;
    const KOIOS_API_URL = 'https://api.koios.rest/api/v1';
    const epochNo = req.query._epoch_no;
    const url = `${KOIOS_API_URL}/totals${epochNo ? `?_epoch_no=${epochNo}` : ''}`;

    if (!KOIOS_API_KEY) {
        console.error('Koios Network API - Missing API key');
        return res.status(500).json({
            error: 'Missing Koios API key',
            details: 'Please set the KOIOS_API_KEY environment variable'
        });
    }

    console.log('Koios Network API - Request URL:', url);

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'api-key': KOIOS_API_KEY
    };

    try {
        const koiosRes = await fetch(url, { headers });
        const data = await koiosRes.json();
        console.log('Koios Network API - Response status:', koiosRes.status);

        if (!koiosRes.ok) {
            console.error('Koios Network API - Error response:', data);
            return res.status(koiosRes.status).json({
                error: 'Failed to fetch from Koios',
                details: data
            });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Koios Network API - Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 