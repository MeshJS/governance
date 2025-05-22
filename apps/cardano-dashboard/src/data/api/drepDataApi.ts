import { BaseApi } from './baseApi';
import { DRepDetailedData } from '../../../types/drep';

export class DRepDataApi extends BaseApi<DRepDetailedData> {
    constructor() {
        super({
            tableName: 'drep_data',
            primaryKey: 'drep_id',
            orderBy: {
                column: 'amount',
                ascending: false
            }
        });
    }

    async fetchAndUpdate(): Promise<DRepDetailedData[]> {
        return this.fetchFromSupabase();
    }
} 