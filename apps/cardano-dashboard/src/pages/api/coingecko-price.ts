import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter is required' });
    }

    const url = `https://api.coingecko.com/api/v3/coins/cardano/history?date=${date}&localization=false`;
    console.log('CoinGecko API - Request URL:', url);

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('CoinGecko API - Response status:', response.status);
        console.log('CoinGecko API - Response data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('CoinGecko error:', data);
            return res.status(response.status).json({ error: 'Failed to fetch from CoinGecko', details: data });
        }

        // Extract and log the price specifically
        const price = data.market_data?.current_price?.usd;
        console.log('CoinGecko API - Extracted price:', price);

        res.status(200).json(data);
    } catch (error) {
        console.error('Internal error:', error);
        res.status(500).json({ error: 'Internal server error', details: error });
    }
} 