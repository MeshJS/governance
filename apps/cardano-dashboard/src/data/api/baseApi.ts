import { supabase } from '../../contexts/supabaseClient';
import { BaseData } from '../../types/base';

export interface ApiConfig<T extends BaseData> {
    tableName: string;
    primaryKey: keyof T;
    orderBy?: {
        column: keyof T;
        ascending: boolean;
    };
}

export class BaseApi<T extends BaseData> {
    protected config: ApiConfig<T>;

    constructor(config: ApiConfig<T>) {
        this.config = config;
    }

    async fetchFromSupabase(): Promise<T[]> {
        const { data, error } = await supabase
            .from(this.config.tableName)
            .select('*')
            .order(this.config.orderBy?.column as string, {
                ascending: this.config.orderBy?.ascending ?? false
            });

        if (error) {
            console.error(`Error fetching from ${this.config.tableName}:`, error);
            throw error;
        }

        return data || [];
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