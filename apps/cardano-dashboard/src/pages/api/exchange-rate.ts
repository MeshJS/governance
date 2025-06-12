import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Validate date format and check if it's in the future
    const [day, month, year] = date.split('-').map(Number);
    const requestDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(requestDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use DD-MM-YYYY' });
    }

    if (requestDate > today) {
        return res.status(400).json({ error: 'Cannot fetch prices for future dates' });
    }

    // Convert date to timestamp for Binance API
    const timestamp = Math.floor(requestDate.getTime());

    // Try Binance first
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=ADAUSDT&interval=1d&startTime=${timestamp}&endTime=${timestamp + 86400000}&limit=1`;
    console.log('Binance API - Request URL:', binanceUrl);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(binanceUrl, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Log the response status and headers for debugging
        console.log('Binance API - Response status:', response.status);
        console.log('Binance API - Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            // If Binance fails, try CoinGecko as fallback
            console.log('Binance API failed, trying CoinGecko as fallback');
            return await fetchFromCoinGecko(date, res);
        }

        const data = await response.json();
        console.log('Binance API - Response data:', JSON.stringify(data, null, 2));

        if (!Array.isArray(data) || data.length === 0) {
            console.log('No Binance data found, trying CoinGecko as fallback');
            return await fetchFromCoinGecko(date, res);
        }

        // Binance returns data in format: [timestamp, open, high, low, close, ...]
        const price = parseFloat(data[0][4]); // Using closing price
        console.log('Binance API - Extracted price:', price);

        res.status(200).json({
            market_data: {
                current_price: {
                    usd: price
                }
            }
        });
    } catch (error) {
        console.error('Binance API - Internal error:', error);
        // If Binance fails, try CoinGecko as fallback
        return await fetchFromCoinGecko(date, res);
    }
}

async function fetchFromCoinGecko(date: string, res: NextApiResponse) {
    const url = `https://api.coingecko.com/api/v3/coins/cardano/history?date=${date}&localization=false`;
    console.log('CoinGecko API - Request URL:', url);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('CoinGecko API - Response status:', response.status);
        console.log('CoinGecko API - Response headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log('CoinGecko API - Response data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            if (response.status === 429) {
                console.error('CoinGecko API - Rate limit exceeded');
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    details: data,
                    retryAfter: response.headers.get('Retry-After')
                });
            }

            if (response.status === 404) {
                console.error('CoinGecko API - Data not found for date:', date);
                return res.status(404).json({
                    error: 'Price data not found for this date',
                    details: data
                });
            }

            console.error('CoinGecko API error:', data);
            return res.status(response.status).json({
                error: 'Failed to fetch from CoinGecko',
                details: data,
                status: response.status
            });
        }

        const price = data.market_data?.current_price?.usd;
        if (!price) {
            console.error('CoinGecko API - No price data found in response');
            return res.status(404).json({
                error: 'No price data found in response',
                details: data
            });
        }

        console.log('CoinGecko API - Extracted price:', price);
        res.status(200).json(data);
    } catch (error) {
        console.error('CoinGecko API - Internal error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
} 