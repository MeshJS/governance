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
        try {
            const PAGE_SIZE = 1000;
            let allData: DRepDetailedData[] = [];
            let page = 0;
            let hasMore = true;

            while (hasMore) {
                let query = this.supabase
                    .from(this.config.tableName)
                    .select('*', { count: 'exact' })
                    .eq('active', true)
                    .eq('registered', true)
                    //.eq('meta_json->body->doNotList', false)
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

                const typedData = (data as unknown) as DRepDetailedData[];
                allData = [...allData, ...typedData];
                console.log(`Fetched ${typedData.length} DRep records, total: ${allData.length}, total count: ${count}`);

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