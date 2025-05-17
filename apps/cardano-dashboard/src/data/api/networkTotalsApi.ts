import { BaseApi } from './baseApi';
import { NetworkTotals, NetworkTotalsResponse } from '../../types/network';

class RateLimiter {
    private calls: number[] = [];
    private readonly maxCalls: number;
    private readonly timeWindow: number;

    constructor(maxCalls: number, timeWindow: number) {
        this.maxCalls = maxCalls;
        this.timeWindow = timeWindow;
    }

    async waitForSlot(): Promise<void> {
        const now = Date.now();
        this.calls = this.calls.filter(time => now - time < this.timeWindow);

        if (this.calls.length >= this.maxCalls) {
            const oldestCall = this.calls[0];
            const waitTime = this.timeWindow - (now - oldestCall);
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            this.calls = this.calls.filter(time => Date.now() - time < this.timeWindow);
        }

        this.calls.push(Date.now());
    }
}

// CoinGecko API allows 30 calls per minute
const exchangeRateLimiter = new RateLimiter(20, 60000); // 20 calls per minute to be safe

export class NetworkTotalsApi extends BaseApi<NetworkTotals> {
    constructor() {
        super({
            tableName: 'network_totals',
            primaryKey: 'epoch_no',
            orderBy: {
                column: 'epoch_no',
                ascending: false
            }
        });
    }

    async fetchFromKoios(epochNo?: number): Promise<NetworkTotalsResponse> {
        const url = `/api/koios-network${epochNo ? `?_epoch_no=${epochNo}` : ''}`;
        console.log('NetworkTotalsApi - Fetching from Koios:', url);
        const data = await this.fetchFromExternalApi(url);
        console.log('NetworkTotalsApi - Koios response:', data);
        return data;
    }

    async fetchEpochInfo(epochNo?: number): Promise<any[]> {
        const url = `/api/koios-epoch-info${epochNo ? `?_epoch_no=${epochNo}&_include_next_epoch=false` : ''}`;
        console.log('NetworkTotalsApi - Fetching epoch info from Koios:', url);
        const data = await this.fetchFromExternalApi(url);
        console.log('NetworkTotalsApi - Epoch info response:', data);
        return data;
    }

    private async enrichWithEpochInfo(networkTotals: NetworkTotals[]): Promise<NetworkTotals[]> {
        console.log('NetworkTotalsApi - Enriching with epoch info');
        const epochNumbers = networkTotals.map(total => total.epoch_no);
        const BATCH_SIZE = 5;
        const epochInfoMap = new Map<number, any>();

        // Process epochs in batches
        for (let i = 0; i < epochNumbers.length; i += BATCH_SIZE) {
            const batchEpochs = epochNumbers.slice(i, i + BATCH_SIZE);
            const epochInfoPromises = batchEpochs.map(epochNo => this.fetchEpochInfo(epochNo));
            const batchResults = await Promise.all(epochInfoPromises);

            batchResults.flat().forEach(info => {
                if (info) {
                    epochInfoMap.set(info.epoch_no, info);
                }
            });

            // Add delay between batches if not the last batch
            if (i + BATCH_SIZE < epochNumbers.length) {
                await this.delay(1000); // 1 second delay between batches
            }
        }

        return networkTotals.map(total => {
            const epochInfo = epochInfoMap.get(total.epoch_no);
            if (!epochInfo) return total;

            return {
                ...total,
                out_sum: epochInfo.out_sum,
                tx_count: epochInfo.tx_count,
                blk_count: epochInfo.blk_count,
                start_time: epochInfo.start_time,
                end_time: epochInfo.end_time,
                first_block_time: epochInfo.first_block_time,
                last_block_time: epochInfo.last_block_time,
                active_stake: epochInfo.active_stake,
                total_rewards: epochInfo.total_rewards,
                avg_blk_reward: epochInfo.avg_blk_reward
            };
        });
    }

    private shouldEnrichEpochs(networkTotals: NetworkTotals[]): boolean {
        // Check if any of the last 5 epochs are missing epoch info
        const hasMissingEpochInfo = networkTotals.some(total =>
            !total.start_time || !total.end_time || !total.tx_count
        );

        if (hasMissingEpochInfo) {
            console.log('NetworkTotalsApi - Found epochs missing epoch info, will enrich');
            return true;
        }

        // Check if any of the last 5 epochs are still in progress or recently completed
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const EPOCH_UPDATE_THRESHOLD = 24 * 60 * 60; // 24 hours in seconds

        const needsUpdate = networkTotals.some(total => {
            if (!total.end_time) return true;

            // If epoch ended less than 24 hours ago, we should update it
            const timeSinceEpochEnd = now - total.end_time;
            return timeSinceEpochEnd < EPOCH_UPDATE_THRESHOLD;
        });

        if (needsUpdate) {
            console.log('NetworkTotalsApi - Found recent epochs that need updating');
        } else {
            console.log('NetworkTotalsApi - All epochs are up to date');
        }

        return needsUpdate;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private formatDate(timestamp: number): string {
        const date = new Date(timestamp * 1000);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // If the timestamp is in the future, use today's date instead
        if (date > today) {
            date.setTime(today.getTime());
        }

        const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        console.log('NetworkTotalsApi - Formatted date:', formattedDate, 'from timestamp:', timestamp);
        return formattedDate;
    }

    private async fetchExchangeRate(date: string, retryCount = 0): Promise<number | null> {
        try {
            await exchangeRateLimiter.waitForSlot();
            const url = `/api/exchange-rate?date=${date}`;
            console.log('NetworkTotalsApi - Fetching exchange rate for date:', date);
            const response = await fetch(url);

            if (response.status === 429) {
                const maxRetries = 3;
                if (retryCount >= maxRetries) {
                    console.error('NetworkTotalsApi - Max retries reached for exchange rate fetch');
                    return null;
                }

                const errorData = await response.json();
                const retryAfter = errorData.retryAfter ? parseInt(errorData.retryAfter) * 1000 : Math.pow(2, retryCount) * 60000;
                const backoffTime = Math.min(retryAfter, 300000); // Max 5 minutes

                console.warn(`NetworkTotalsApi - Rate limit hit, waiting ${backoffTime / 60000} minutes before retry ${retryCount + 1}/${maxRetries}`);
                await this.delay(backoffTime);
                return this.fetchExchangeRate(date, retryCount + 1);
            }

            if (response.status === 404) {
                console.warn('NetworkTotalsApi - No price data available for date:', date);
                return null;
            }

            if (response.status === 400) {
                const errorData = await response.json();
                console.warn('NetworkTotalsApi - Invalid date request:', errorData);
                return null;
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error('NetworkTotalsApi - Exchange rate fetch error:', errorData);
                return null;
            }

            const data = await response.json();
            const price = data.market_data?.current_price?.usd;

            if (!price) {
                console.warn('NetworkTotalsApi - No price data found in response for date:', date);
                return null;
            }

            console.log('NetworkTotalsApi - Fetched exchange rate:', price, 'for date:', date);
            return price;
        } catch (error) {
            console.error('NetworkTotalsApi - Exchange rate fetch error:', error);
            return null;
        }
    }

    private async updateExchangeRates(networkTotals: NetworkTotals[]): Promise<NetworkTotals[]> {
        console.log('NetworkTotalsApi - Starting exchange rate update for', networkTotals.length, 'totals');
        const BATCH_SIZE = 3; // Reduced batch size to be more conservative
        const updatedTotals = [...networkTotals];
        let updatedCount = 0;

        // Process in batches to avoid rate limits
        for (let i = 0; i < updatedTotals.length; i += BATCH_SIZE) {
            const batch = updatedTotals.slice(i, i + BATCH_SIZE);
            console.log('NetworkTotalsApi - Processing batch', Math.floor(i / BATCH_SIZE) + 1, 'of', Math.ceil(updatedTotals.length / BATCH_SIZE));

            // Process batch sequentially instead of in parallel to better control rate limits
            for (const total of batch) {
                if (total.exchange_rate !== null) {
                    console.log('NetworkTotalsApi - Skipping epoch', total.epoch_no, 'as it already has exchange rate:', total.exchange_rate);
                    continue;
                }

                const date = this.formatDate(total.last_block_time);
                console.log('NetworkTotalsApi - Fetching exchange rate for epoch', total.epoch_no, 'with date', date);
                const exchangeRate = await this.fetchExchangeRate(date);

                if (exchangeRate !== null) {
                    updatedCount++;
                    const index = updatedTotals.findIndex(t => t.epoch_no === total.epoch_no);
                    if (index !== -1) {
                        updatedTotals[index] = {
                            ...total,
                            exchange_rate: exchangeRate
                        };
                    }
                }

                // Add a small delay between individual requests
                await this.delay(2000); // 2 second delay between requests
            }

            // Add longer delay between batches
            if (i + BATCH_SIZE < updatedTotals.length) {
                console.log('NetworkTotalsApi - Adding delay between batches');
                await this.delay(5000); // 5 second delay between batches
            }
        }

        console.log('NetworkTotalsApi - Completed exchange rate update. Updated', updatedCount, 'out of', networkTotals.length, 'totals');
        return updatedTotals;
    }

    private async updateAllMissingExchangeRates(): Promise<void> {
        console.log('NetworkTotalsApi - Starting update of all missing exchange rates');

        // Fetch all data from Supabase
        const allData = await this.fetchFromSupabase();
        console.log('NetworkTotalsApi - Fetched', allData.length, 'records from Supabase');

        // Filter records with missing exchange rates
        const recordsWithMissingRates = allData.filter(total => total.exchange_rate === null);
        console.log('NetworkTotalsApi - Found', recordsWithMissingRates.length, 'records with missing exchange rates');

        if (recordsWithMissingRates.length === 0) {
            console.log('NetworkTotalsApi - No missing exchange rates found');
            return;
        }

        // Update exchange rates in batches
        const BATCH_SIZE = 5;
        for (let i = 0; i < recordsWithMissingRates.length; i += BATCH_SIZE) {
            const batch = recordsWithMissingRates.slice(i, i + BATCH_SIZE);
            console.log('NetworkTotalsApi - Processing batch', Math.floor(i / BATCH_SIZE) + 1, 'of', Math.ceil(recordsWithMissingRates.length / BATCH_SIZE));

            const updatedBatch = await this.updateExchangeRates(batch);
            await this.upsertToSupabase(updatedBatch);

            // Add delay between batches if not the last batch
            if (i + BATCH_SIZE < recordsWithMissingRates.length) {
                console.log('NetworkTotalsApi - Adding delay between batches');
                await this.delay(1000); // 1 second delay between batches
            }
        }

        console.log('NetworkTotalsApi - Completed updating all missing exchange rates');
    }

    async fetchAndUpdate(): Promise<NetworkTotals[]> {
        console.log('NetworkTotalsApi - Starting fetchAndUpdate');
        // First, fetch all data from Supabase
        const supabaseData = await this.fetchFromSupabase();
        console.log('NetworkTotalsApi - Supabase data:', supabaseData);

        if (supabaseData.length === 0) {
            console.log('NetworkTotalsApi - No data in Supabase, fetching from Koios in batches');
            // If no data in Supabase, fetch in batches of 10 epochs
            const BATCH_SIZE = 10;
            const MAX_EPOCHS = 355; // Limit the initial fetch to prevent rate limiting
            const allData: NetworkTotals[] = [];

            // Start from the latest epoch and work backwards
            const latestEpoch = await this.fetchFromKoios(0).then(data => data[0]?.epoch_no || 0);

            for (let i = 0; i < MAX_EPOCHS; i += BATCH_SIZE) {
                const batchPromises = Array.from({ length: BATCH_SIZE }, (_, j) => {
                    const epochNo = latestEpoch - i - j;
                    if (epochNo < 0) return null;
                    return this.fetchFromKoios(epochNo);
                }).filter(Boolean);

                const batchResults = await Promise.all(batchPromises);
                const batchData = batchResults.flat().filter((data): data is NetworkTotals => data !== null);
                allData.push(...batchData);

                // Add a delay between batches to prevent rate limiting
                if (i + BATCH_SIZE < MAX_EPOCHS) {
                    await this.delay(1000); // 1 second delay between batches
                }
            }

            console.log('NetworkTotalsApi - Fetched from Koios in batches:', allData);
            const enrichedData = await this.enrichWithEpochInfo(allData);
            const dataWithExchangeRates = await this.updateExchangeRates(enrichedData);
            await this.upsertToSupabase(dataWithExchangeRates);
            return dataWithExchangeRates;
        }

        // Get the latest epoch from Supabase
        const latestEpoch = supabaseData[0].epoch_no;
        console.log('NetworkTotalsApi - Latest epoch from Supabase:', latestEpoch);

        // Fetch the last 5 epochs from Koios
        const epochsToCheck = Array.from({ length: 5 }, (_, i) => latestEpoch - i);
        const koiosDataPromises = epochsToCheck.map(epoch => this.fetchFromKoios(epoch));
        const koiosDataResults = await Promise.all(koiosDataPromises);
        const latestKoiosData = koiosDataResults.flat().filter((data): data is NetworkTotals => data !== null);
        console.log('NetworkTotalsApi - Last 5 epochs from Koios:', latestKoiosData);

        if (latestKoiosData.length === 0) {
            console.log('NetworkTotalsApi - No new data from Koios');
        } else {
            // Check which epochs need updating
            const needsUpdate = latestKoiosData.some(koiosTotal => {
                const supabaseTotal = supabaseData.find(s => s.epoch_no === koiosTotal.epoch_no);
                if (!supabaseTotal) return true; // New epoch not in Supabase

                return Object.keys(koiosTotal).some(key => {
                    if (key === 'epoch_no' || key === 'exchange_rate') return false;
                    return Number(koiosTotal[key as keyof NetworkTotals]) !==
                        Number(supabaseTotal[key as keyof NetworkTotals]);
                });
            });

            console.log('NetworkTotalsApi - Needs update:', needsUpdate);

            if (needsUpdate) {
                console.log('NetworkTotalsApi - Updating Supabase with new data');
                const enrichedData = await this.enrichWithEpochInfo(latestKoiosData);
                const dataWithExchangeRates = await this.updateExchangeRates(enrichedData);
                await this.upsertToSupabase(dataWithExchangeRates);

                // Merge the new data with existing Supabase data, removing duplicates
                const updatedData = [...dataWithExchangeRates];
                supabaseData.forEach(supabaseTotal => {
                    if (!updatedData.some(k => k.epoch_no === supabaseTotal.epoch_no)) {
                        updatedData.push(supabaseTotal);
                    }
                });

                // Sort by epoch_no in descending order
                supabaseData.splice(0, supabaseData.length, ...updatedData.sort((a, b) => b.epoch_no - a.epoch_no));
            }
        }

        // Always check for missing exchange rates in ALL records
        console.log('NetworkTotalsApi - Checking for missing exchange rates in all records');
        await this.updateAllMissingExchangeRates();

        // Return fresh data from Supabase
        return await this.fetchFromSupabase();
    }
} 