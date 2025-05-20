import { BaseApi } from './baseApi';
import { NetworkTotals } from '../../../types/network';

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

    async fetchAndUpdate(): Promise<NetworkTotals[]> {
        try {
            return await this.fetchFromSupabase();
        } catch (error) {
            console.error('Error in NetworkTotalsApi.fetchAndUpdate:', error);
            throw error;
        }
    }
} 