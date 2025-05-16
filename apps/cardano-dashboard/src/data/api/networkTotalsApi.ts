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
            await this.upsertToSupabase(koiosData);
            return koiosData;
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
            await this.upsertToSupabase(latestKoiosData);

            // Merge the new data with existing Supabase data, removing duplicates
            const updatedData = [...latestKoiosData];
            supabaseData.forEach(supabaseTotal => {
                if (!updatedData.some(k => k.epoch_no === supabaseTotal.epoch_no)) {
                    updatedData.push(supabaseTotal);
                }
            });

            // Sort by epoch_no in descending order
            return updatedData.sort((a, b) => b.epoch_no - a.epoch_no);
        }

        console.log('NetworkTotalsApi - No update needed, returning Supabase data');
        return supabaseData;
    }
} 