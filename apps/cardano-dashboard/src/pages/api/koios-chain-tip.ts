import { NextApiRequest, NextApiResponse } from 'next';

const KOIOS_API_URL = 'https://api.koios.rest/api/v1';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await fetch(
            `${KOIOS_API_URL}/tip`,
            {
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Koios API responded with status: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching chain tip:', error);
        res.status(500).json({ error: 'Failed to fetch chain tip' });
    }
} 