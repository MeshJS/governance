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
        return this.fetchFromSupabase();
    }
} 