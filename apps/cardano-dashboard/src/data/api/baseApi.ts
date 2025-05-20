import { createClient } from '@supabase/supabase-js';

export interface BaseApiConfig {
    tableName: string;
    primaryKey: string;
    orderBy?: {
        column: string;
        ascending: boolean;
    };
}

export class BaseApi<T> {
    protected supabase;
    protected config: BaseApiConfig;

    constructor(config: BaseApiConfig) {
        this.config = config;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase environment variables');
            throw new Error('Missing Supabase environment variables');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    protected async fetchFromSupabase(): Promise<T[]> {
        try {
            let query = this.supabase
                .from(this.config.tableName)
                .select('*');

            if (this.config.orderBy) {
                query = query.order(this.config.orderBy.column, {
                    ascending: this.config.orderBy.ascending
                });
            }

            const { data, error } = await query;

            if (error) {
                console.error(`Error fetching from ${this.config.tableName}:`, error);
                throw error;
            }

            return data || [];
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