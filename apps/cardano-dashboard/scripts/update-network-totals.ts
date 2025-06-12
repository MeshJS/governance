import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const koiosApiKey = process.env.KOIOS_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ChainTip {
    hash: string;
    epoch_no: number;
    abs_slot: number;
    epoch_slot: number;
    block_time: number;
}

async function fetchChainTip(): Promise<ChainTip> {
    const url = 'https://api.koios.rest/api/v1/tip';
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${koiosApiKey}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch chain tip');
    const data = await response.json() as ChainTip[];
    return data[0];
}

interface KoiosTotal {
    epoch_no: number;
    circulation: string;
    treasury: string;
    reward: string;
    reserves: string;
    supply: string;
    utxo: string;
    stake: string;
}

interface KoiosEpochInfo {
    epoch_no: number;
    out_sum: string;
    fees: string;
    tx_count: number;
    blk_count: number;
    start_time: number;
    end_time: number;
    first_block_time: number;
    last_block_time: number;
    active_stake: string;
    total_rewards: string;
    avg_blk_reward: string;
}

type BinanceKline = [
    number, // Open time
    string, // Open
    string, // High
    string, // Low
    string, // Close
    string, // Volume
    number, // Close time
    string, // Quote asset volume
    number, // Number of trades
    string, // Taker buy base asset volume
    string, // Taker buy quote asset volume
    string  // Ignore
];

async function fetchFromKoios(epochNo?: number): Promise<KoiosTotal[]> {
    const url = `https://api.koios.rest/api/v1/totals${epochNo ? `?_epoch_no=${epochNo}` : ''}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${koiosApiKey}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch from Koios');
    const data = await response.json() as KoiosTotal[];
    return data;
}

async function fetchEpochInfo(epochNo?: number): Promise<KoiosEpochInfo[]> {
    const url = `https://api.koios.rest/api/v1/epoch_info${epochNo ? `?_epoch_no=${epochNo}&_include_next_epoch=false` : ''}`;
    try {
        console.log(`Fetching epoch info from: ${url}`);
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${koiosApiKey}`,
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Koios API error: Status ${response.status}`, errorText);
            throw new Error(`Failed to fetch epoch info: ${response.status} ${errorText}`);
        }

        const data = await response.json() as KoiosEpochInfo[];
        if (!data || data.length === 0) {
            console.warn(`No epoch info returned for epoch ${epochNo}`);
            return [];
        }

        console.log(`Successfully fetched epoch info for epoch ${epochNo}`);
        return data;
    } catch (error) {
        console.error('Error in fetchEpochInfo:', error);
        throw error;
    }
}

interface CoinGeckoHistoryResponse {
    market_data: {
        current_price: {
            usd: number;
            [currency: string]: number;
        }
    }
}

interface KrakenOHLCResponse {
    error: string[];
    result: {
        [pair: string]: [
            number, // time
            string, // open
            string, // high
            string, // low
            string, // close
            string, // vwap
            string, // volume
            number  // count
        ][];
    } & {
        last: number;
    };
}

async function fetchKrakenHistoricalPrice(date: string): Promise<number> {
    // Convert date from DD-MM-YYYY to timestamp
    const [day, month, year] = date.split('-').map(Number);
    const timestamp = Math.floor(new Date(year, month - 1, day).getTime() / 1000);

    const url = `https://api.kraken.com/0/public/OHLC?pair=ADAUSD&interval=1440&since=${timestamp}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Kraken API error: ${response.status}`);
        }

        const data = await response.json() as KrakenOHLCResponse;
        if (data.error && data.error.length > 0) {
            throw new Error(`Kraken API error: ${data.error.join(', ')}`);
        }

        const ohlcData = data.result.ADAUSD;
        if (!ohlcData || ohlcData.length === 0) {
            throw new Error('No historical data available from Kraken');
        }

        // Get the closest price to our target date
        const closestPrice = ohlcData[0][4]; // Using close price
        return Number(closestPrice);
    } catch (error) {
        console.error('Error fetching from Kraken:', error);
        throw error;
    }
}

async function fetchExchangeRate(date: string, isCurrentEpoch: boolean): Promise<number | null> {
    const maxRetries = 3;
    const baseDelay = 5000; // 5 seconds base delay
    let lastError: Error | null = null;

    // Try CoinGecko first
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const url = `https://api.coingecko.com/api/v3/coins/cardano/history` +
                `?date=${date}&localization=false`;
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });

            if (res.status === 429) {
                // Rate limit hit - wait longer
                const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`Rate limit hit, waiting ${delay}ms before retry...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`History API ${res.status}: ${text}`);
            }

            const data = (await res.json()) as CoinGeckoHistoryResponse;
            const usd = data.market_data?.current_price?.usd;
            if (typeof usd !== 'number') {
                throw new Error('No USD price available for ' + date);
            }
            return Number(usd.toFixed(4));
        } catch (err: any) {
            lastError = err;
            console.warn(`CoinGecko attempt ${attempt} failed: ${err.message}`);
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.log(`Waiting ${delay}ms before next attempt...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    // Try Kraken as first fallback
    console.log('Falling back to Kraken historical data');
    try {
        const krakenPrice = await fetchKrakenHistoricalPrice(date);
        return Number(krakenPrice.toFixed(4));
    } catch (krakenError) {
        console.warn('Kraken fallback failed:', krakenError);
    }

    // Only use current price fallback for current epoch
    if (isCurrentEpoch) {
        console.log('Falling back to current price from CoinGecko for current epoch');
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const fallbackRes = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd',
                    {
                        headers: { 'Accept': 'application/json' }
                    }
                );

                if (fallbackRes.status === 429) {
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    console.log(`Fallback rate limit hit, waiting ${delay}ms before retry...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }

                if (!fallbackRes.ok) {
                    throw new Error(`Fallback API ${fallbackRes.status}`);
                }

                const fallbackData = await fallbackRes.json() as { cardano: { usd: number } };
                const usd = fallbackData.cardano?.usd;
                if (typeof usd !== 'number') {
                    throw new Error('No USD price in fallback response');
                }
                return Number(usd.toFixed(4));
            } catch (err: any) {
                console.warn(`Fallback attempt ${attempt} failed: ${err.message}`);
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    console.log(`Waiting ${delay}ms before next fallback attempt...`);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }
    } else {
        console.log('Skipping current price fallback for historical epoch');
    }

    return null;
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
        date.setTime(today.getTime());
    }

    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
}

function getCurrentDate(): string {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
}

async function updateNetworkTotals() {
    try {
        // Fetch last 5 epochs from Supabase
        const { data: existingTotals, error: fetchError } = await supabase
            .from('network_totals')
            .select('epoch_no')
            .order('epoch_no', { ascending: false })
            .limit(5);

        if (fetchError) throw fetchError;

        // Get the latest epoch number from Supabase
        const latestStoredEpoch = existingTotals?.[0]?.epoch_no || 0;

        // Get current chain tip
        const chainTip = await fetchChainTip();
        const currentEpoch = chainTip.epoch_no;

        // Calculate the range of epochs to update
        // Start from the oldest of the last 5 stored epochs
        const oldestStoredEpoch = existingTotals?.[existingTotals.length - 1]?.epoch_no || latestStoredEpoch;
        const startEpoch = Math.max(oldestStoredEpoch, 0);

        // Create array of epochs to update from oldest stored up to current
        const epochsToUpdate = Array.from(
            { length: currentEpoch - startEpoch + 1 },
            (_, i) => startEpoch + i
        );

        console.log(`Updating epochs from ${startEpoch} to ${currentEpoch}: ${epochsToUpdate.join(', ')}`);

        // Fetch data for all epochs in the range
        const allEpochData: KoiosTotal[] = [];
        for (const epoch of epochsToUpdate) {
            const epochData = await fetchFromKoios(epoch);
            if (epochData && epochData.length > 0) {
                allEpochData.push(epochData[0]);
            }
        }

        if (allEpochData.length === 0) {
            console.log('No epoch data to update');
            return;
        }

        // Enrich with epoch info
        const enrichedTotals = await Promise.all(
            allEpochData.map(async (total: KoiosTotal) => {
                const epochInfo = await fetchEpochInfo(total.epoch_no);
                if (!epochInfo?.[0]) return total;

                let exchangeRate: number | null;
                const currentEpoch = (await fetchChainTip()).epoch_no;
                const isCurrentEpoch = total.epoch_no === currentEpoch;

                console.log(`Processing epoch ${total.epoch_no} (current epoch: ${currentEpoch})`);

                if (isCurrentEpoch) {
                    // For current epoch, use current date instead of start_time
                    const currentDate = getCurrentDate();
                    console.log(`Current epoch - using current date: ${currentDate}`);
                    exchangeRate = await fetchExchangeRate(currentDate, true);
                } else if (total.epoch_no === currentEpoch - 1) {
                    // For previous epoch, use end_time to get final price
                    const endDate = formatDate(epochInfo[0].end_time);
                    console.log(`Previous epoch - using end_time: ${endDate}`);
                    exchangeRate = await fetchExchangeRate(endDate, false);
                } else {
                    // For older epochs, use end_time
                    const endDate = formatDate(epochInfo[0].end_time);
                    console.log(`Older epoch - using end_time: ${endDate}`);
                    exchangeRate = await fetchExchangeRate(endDate, false);
                }

                return {
                    ...total,
                    ...epochInfo[0],
                    exchange_rate: exchangeRate
                };
            })
        );

        // Update Supabase
        const { error } = await supabase
            .from('network_totals')
            .upsert(enrichedTotals, { onConflict: 'epoch_no' });

        if (error) throw error;
        console.log(`Successfully updated ${enrichedTotals.length} epochs`);
    } catch (error) {
        console.error('Error updating network totals:', error);
        process.exit(1);
    }
}

updateNetworkTotals(); 