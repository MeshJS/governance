import { NextApiRequest, NextApiResponse } from 'next';

const KOIOS_API_URL ='https://api.koios.rest/api/v1';
const REQUEST_TIMEOUT_MS = 5000;

type CachedPayload = {
    data: unknown;
    timestamp: number;
};

let lastSuccessful: CachedPayload | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(
            `${KOIOS_API_URL}/tip`,
            {
                headers: {
                    'Accept': 'application/json',
                },
                signal: abortController.signal,
            }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Koios API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Cache only valid array payloads with at least one item to satisfy downstream consumers
        if (Array.isArray(data) && data.length > 0) {
            lastSuccessful = { data, timestamp: Date.now() };
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).json(data);
        }

        // If payload is unexpected, fall back to cache if available
        if (lastSuccessful) {
            res.setHeader('x-data-stale', 'true');
            res.setHeader('x-last-updated', new Date(lastSuccessful.timestamp).toISOString());
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).json(lastSuccessful.data);
        }

        return res.status(502).json({ error: 'Invalid payload from Koios' });
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error fetching chain tip:', error);

        if (lastSuccessful) {
            res.setHeader('x-data-stale', 'true');
            res.setHeader('x-last-updated', new Date(lastSuccessful.timestamp).toISOString());
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).json(lastSuccessful.data);
        }

        return res.status(503).json({ error: 'Chain tip temporarily unavailable' });
    }
}