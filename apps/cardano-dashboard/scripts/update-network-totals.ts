import { createClient } from '@supabase/supabase-js';
import { NetworkTotals } from '../src/types/network';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const koiosApiKey = process.env.KOIOS_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ChainTip {
    epoch_no: number;
    hash: string;
    block_time: number;
    block_height: number;
    slot_no: number;
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
    start_time: number;
    end_time: number;
    first_block_time: number;
    last_block_time: number;
    first_block_height: number;
    last_block_height: number;
    tx_count: number;
    output: string;
    fees: string;
    active_stake: string;
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
    const url = `https://api.koios.rest/api/v1/epoch/info${epochNo ? `?_epoch_no=${epochNo}&_include_next_epoch=false` : ''}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${koiosApiKey}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch epoch info');
    const data = await response.json() as KoiosEpochInfo[];
    return data;
}

async function fetchExchangeRate(date: string): Promise<number> {
    // Convert date from DD-MM-YYYY to YYYY-MM-DD for Binance
    const [day, month, year] = date.split('-');
    const formattedDate = `${year}-${month}-${day}`;

    // Get timestamp for the start of the day in milliseconds
    const timestamp = new Date(formattedDate).getTime();

    // Fetch 1-day klines/candlestick data from Binance
    const url = `https://api.binance.com/api/v3/klines?symbol=ADAUSDT&interval=1d&startTime=${timestamp}&limit=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch exchange rate from Binance');

    const data = await response.json() as BinanceKline[];
    if (!data || data.length === 0) {
        throw new Error('No price data available for the specified date');
    }

    // Binance klines data format: [timestamp, open, high, low, close, ...]
    // We'll use the closing price
    return parseFloat(data[0][4]);
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

        // If we're up to date, exit early
        if (latestStoredEpoch >= currentEpoch) {
            console.log('Already up to date with the latest epoch');
            return;
        }

        // Fetch only the missing epochs from Koios
        const missingEpochs: KoiosTotal[] = [];
        for (let epoch = latestStoredEpoch + 1; epoch <= currentEpoch; epoch++) {
            const epochData = await fetchFromKoios(epoch);
            if (epochData && epochData.length > 0) {
                missingEpochs.push(epochData[0]);
            }
        }

        if (missingEpochs.length === 0) {
            console.log('No new epochs to update');
            return;
        }

        // Enrich with epoch info
        const enrichedTotals = await Promise.all(
            missingEpochs.map(async (total: KoiosTotal) => {
                const epochInfo = await fetchEpochInfo(total.epoch_no);
                if (!epochInfo?.[0]) return total;

                const date = formatDate(epochInfo[0].end_time);
                const exchangeRate = await fetchExchangeRate(date);

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
        console.log(`Successfully updated ${enrichedTotals.length} new epochs`);
    } catch (error) {
        console.error('Error updating network totals:', error);
        process.exit(1);
    }
}

updateNetworkTotals(); 