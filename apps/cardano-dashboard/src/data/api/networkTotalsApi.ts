import { BaseApi } from './baseApi';
import { NetworkTotals, NetworkTotalsResponse } from '../../types/network';

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
        const epochInfoPromises = epochNumbers.map(epochNo => this.fetchEpochInfo(epochNo));
        const epochInfoResults = await Promise.all(epochInfoPromises);
        const epochInfoMap = new Map<number, any>();

        epochInfoResults.flat().forEach(info => {
            epochInfoMap.set(info.epoch_no, info);
        });

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

    async fetchAndUpdate(): Promise<NetworkTotals[]> {
        console.log('NetworkTotalsApi - Starting fetchAndUpdate');
        // First, fetch all data from Supabase
        const supabaseData = await this.fetchFromSupabase();
        console.log('NetworkTotalsApi - Supabase data:', supabaseData);

        if (supabaseData.length === 0) {
            console.log('NetworkTotalsApi - No data in Supabase, fetching from Koios');
            // If no data in Supabase, fetch all from Koios
            const koiosData = await this.fetchFromKoios();
            console.log('NetworkTotalsApi - Fetched from Koios:', koiosData);
            const enrichedData = await this.enrichWithEpochInfo(koiosData);
            await this.upsertToSupabase(enrichedData);
            return enrichedData;
        }

        // Get the latest epoch from Supabase
        const latestEpoch = supabaseData[0].epoch_no;
        console.log('NetworkTotalsApi - Latest epoch from Supabase:', latestEpoch);

        // Fetch the last 5 epochs from Koios
        const epochsToCheck = Array.from({ length: 5 }, (_, i) => latestEpoch - i);
        const koiosDataPromises = epochsToCheck.map(epoch => this.fetchFromKoios(epoch));
        const koiosDataResults = await Promise.all(koiosDataPromises);
        const latestKoiosData = koiosDataResults.flat().filter(Boolean);
        console.log('NetworkTotalsApi - Last 5 epochs from Koios:', latestKoiosData);

        if (latestKoiosData.length === 0) {
            console.log('NetworkTotalsApi - No new data from Koios, returning Supabase data');
            return supabaseData;
        }

        // Check which epochs need updating
        const needsUpdate = latestKoiosData.some(koiosTotal => {
            const supabaseTotal = supabaseData.find(s => s.epoch_no === koiosTotal.epoch_no);
            if (!supabaseTotal) return true; // New epoch not in Supabase

            return Object.keys(koiosTotal).some(key => {
                if (key === 'epoch_no') return false;
                return Number(koiosTotal[key as keyof NetworkTotals]) !==
                    Number(supabaseTotal[key as keyof NetworkTotals]);
            });
        });

        console.log('NetworkTotalsApi - Needs update:', needsUpdate);

        if (needsUpdate) {
            console.log('NetworkTotalsApi - Updating Supabase with new data');
            const enrichedData = await this.enrichWithEpochInfo(latestKoiosData);
            await this.upsertToSupabase(enrichedData);

            // Merge the new data with existing Supabase data, removing duplicates
            const updatedData = [...enrichedData];
            supabaseData.forEach(supabaseTotal => {
                if (!updatedData.some(k => k.epoch_no === supabaseTotal.epoch_no)) {
                    updatedData.push(supabaseTotal);
                }
            });

            // Sort by epoch_no in descending order
            return updatedData.sort((a, b) => b.epoch_no - a.epoch_no);
        }

        // Even if no network totals update is needed, check if we should enrich with epoch info
        const lastFiveEpochs = supabaseData.slice(0, 5);
        if (this.shouldEnrichEpochs(lastFiveEpochs)) {
            console.log('NetworkTotalsApi - Enriching existing data with epoch info');
            const enrichedData = await this.enrichWithEpochInfo(lastFiveEpochs);
            await this.upsertToSupabase(enrichedData);

            // Update the enriched epochs in the full dataset
            const updatedData = [...supabaseData];
            enrichedData.forEach(enrichedTotal => {
                const index = updatedData.findIndex(t => t.epoch_no === enrichedTotal.epoch_no);
                if (index >= 0) {
                    updatedData[index] = enrichedTotal;
                }
            });

            return updatedData;
        }

        console.log('NetworkTotalsApi - No update needed, returning Supabase data');
        return supabaseData;
    }
} 