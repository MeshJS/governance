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
        try {
            const PAGE_SIZE = 1000;
            let allData: SPOData[] = [];
            let page = 0;
            let hasMore = true;

            while (hasMore) {
                let query = this.supabase
                    .from(this.config.tableName)
                    .select('*', { count: 'exact' })
                    .or('pool_status.eq.registered,pool_status.eq.retiring')
                    .not('active_stake', 'is', null)
                    .gt('active_stake', 0)
                    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

                if (this.config.orderBy) {
                    query = query.order(this.config.orderBy.column, {
                        ascending: this.config.orderBy.ascending
                    });
                }

                const { data, error, count } = await query;

                if (error) {
                    console.error(`Error fetching from ${this.config.tableName}:`, error);
                    throw error;
                }

                if (!data || data.length === 0) {
                    hasMore = false;
                    break;
                }

                const typedData = (data as unknown) as SPOData[];
                allData = [...allData, ...typedData];
                console.log(`Fetched ${typedData.length} SPO records, total: ${allData.length}, total count: ${count}`);

                if (count !== null && allData.length >= count) {
                    hasMore = false;
                } else if (data.length < PAGE_SIZE) {
                    hasMore = false;
                } else {
                    page++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            return allData;
        } catch (error) {
            console.error(`Failed to fetch from ${this.config.tableName}:`, error);
            throw error;
        }
    }
} 