import { BaseApi } from './baseApi';
import { SPOData } from '../../../types/spo';

export class SPODataApi extends BaseApi<SPOData> {
    constructor() {
        super({
            tableName: 'spo_data',
            primaryKey: 'pool_id_bech32',
            orderBy: {
                column: 'active_stake',
                ascending: false
            }
        });
    }

    async fetchAndUpdate(): Promise<SPOData[]> {
        return this.fetchFromSupabase();
    }
} 