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

        // Fetch only the latest epoch from Koios to check if we need to update
        const latestKoiosData = await this.fetchFromKoios(latestEpoch);
        console.log('NetworkTotalsApi - Latest epoch from Koios:', latestKoiosData);

        if (latestKoiosData.length === 0) {
            console.log('NetworkTotalsApi - No new data from Koios, returning Supabase data');
            return supabaseData;
        }

        const latestKoiosTotal = latestKoiosData[0];

        // Check if we need to update the latest epoch
        const needsUpdate = Object.keys(latestKoiosTotal).some(key => {
            if (key === 'epoch_no') return false;
            return Number(latestKoiosTotal[key as keyof NetworkTotals]) !==
                Number(supabaseData[0][key as keyof NetworkTotals]);
        });

        console.log('NetworkTotalsApi - Needs update:', needsUpdate);

        if (needsUpdate) {
            console.log('NetworkTotalsApi - Updating Supabase with new data');
            await this.upsertToSupabase(latestKoiosData);
            return [latestKoiosTotal, ...supabaseData.slice(1)];
        }

        console.log('NetworkTotalsApi - No update needed, returning Supabase data');
        return supabaseData;
    }
} 