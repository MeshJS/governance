import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const KOIOS_API_KEY = process.env.KOIOS_API_KEY;
    const KOIOS_API_URL = process.env.KOIOS_API_URL || 'https://api.koios.rest/api/v1';

    // First get current epoch
    const tipUrl = `${KOIOS_API_URL}/tip`;
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    if (KOIOS_API_KEY) {
        headers['api-key'] = KOIOS_API_KEY;
    }

    try {
        // Get current epoch
        console.log('Requesting tip:', tipUrl);
        const tipRes = await fetch(tipUrl, { headers });
        const tipData = await tipRes.json();

        if (!tipRes.ok) {
            console.error('Koios tip error:', tipData);
            return res.status(tipRes.status).json({ error: 'Failed to fetch tip from Koios', details: tipData });
        }

        const currentEpoch = tipData[0].epoch_no;
        const minRetiringEpoch = currentEpoch - 5;

        // Now get filtered pool list
        const poolListUrl = `${KOIOS_API_URL}/pool_list?or=(pool_status.eq.registered,and(pool_status.eq.retired,retiring_epoch.gte.${minRetiringEpoch}))&limit=1000&order=pool_status.desc,retiring_epoch.desc`;
        console.log('Requesting pool list:', poolListUrl);

        const poolListRes = await fetch(poolListUrl, { headers });
        const poolData = await poolListRes.json();

        if (!poolListRes.ok) {
            console.error('Koios pool list error:', poolData);
            return res.status(poolListRes.status).json({ error: 'Failed to fetch pool list from Koios', details: poolData });
        }

        // Return both current epoch info and pool data
        res.status(200).json({
            currentEpoch,
            minRetiringEpoch,
            pools: poolData
        });
    } catch (error) {
        console.error('Internal error:', error);
        res.status(500).json({ error: 'Internal server error', details: error });
    }
}
