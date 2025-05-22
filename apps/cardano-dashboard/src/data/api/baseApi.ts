import { createClient } from '@supabase/supabase-js';

export interface BaseApiConfig {
    tableName: string;
    primaryKey: string;
    orderBy?: {
        column: string;
        ascending: boolean;
    };
}

// Singleton Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
    if (!supabaseInstance) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase environment variables');
            throw new Error('Missing Supabase environment variables');
        }

        supabaseInstance = createClient(supabaseUrl, supabaseKey);
    }
    return supabaseInstance;
}

export class BaseApi<T> {
    protected supabase;
    protected config: BaseApiConfig;

    constructor(config: BaseApiConfig) {
        this.config = config;
        this.supabase = getSupabaseClient();
    }

    protected async fetchFromSupabase(): Promise<T[]> {
        try {
            const PAGE_SIZE = 1000;
            let allData: T[] = [];
            let page = 0;
            let hasMore = true;

            while (hasMore) {
                let query = this.supabase
                    .from(this.config.tableName)
                    .select('*', { count: 'exact' })
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

                // Cast the data to the correct type
                const typedData = data as T[];
                allData = [...allData, ...typedData];
                console.log(`Fetched ${typedData.length} records from ${this.config.tableName}, total: ${allData.length}, total count: ${count}`);

                // Check if we've received all records
                if (count !== null && allData.length >= count) {
                    hasMore = false;
                } else if (data.length < PAGE_SIZE) {
                    hasMore = false;
                } else {
                    page++;
                    // Add a small delay between requests to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            return allData;
        } catch (error) {
            console.error(`Failed to fetch from ${this.config.tableName}:`, error);
            throw error;
        }
    }

    async fetchAndUpdate(): Promise<T[]> {
        return this.fetchFromSupabase();
    }

    async upsertToSupabase(items: T[]): Promise<void> {
        if (!items.length) return;

        try {
            const response = await fetch('/api/database', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'upsert',
                    tableName: this.config.tableName,
                    data: items,
                    primaryKey: this.config.primaryKey
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error(`Error upserting to ${this.config.tableName}:`, error);
                throw new Error(error.message || 'Failed to upsert data');
            }
        } catch (error) {
            console.error(`Failed to upsert to ${this.config.tableName}:`, error);
            throw error;
        }
    }

    protected async fetchFromExternalApi<R>(url: string): Promise<R> {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch from ${url}`);
            return res.json();
        } catch (error) {
            console.error(`Failed to fetch from external API ${url}:`, error);
            throw error;
        }
    }
} 