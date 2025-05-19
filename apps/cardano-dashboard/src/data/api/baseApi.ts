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
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    protected async fetchFromSupabase(): Promise<T[]> {
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
    }

    async fetchAndUpdate(): Promise<T[]> {
        return this.fetchFromSupabase();
    }

    async upsertToSupabase(items: T[]): Promise<void> {
        if (!items.length) return;

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
    }

    protected async fetchFromExternalApi(url: string): Promise<any> {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch from ${url}`);
        return res.json();
    }
} 