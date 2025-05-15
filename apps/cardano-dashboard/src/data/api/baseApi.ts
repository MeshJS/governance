import { supabase } from '../../contexts/supabaseClient';

export interface BaseData {
    id?: string | number;
    created_at?: string;
    updated_at?: string;
}

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

        const { error } = await supabase
            .from(this.config.tableName)
            .upsert(items, {
                onConflict: this.config.primaryKey as string
            });

        if (error) {
            console.error(`Error upserting to ${this.config.tableName}:`, error);
            throw error;
        }
    }

    protected async fetchFromExternalApi(url: string): Promise<any> {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch from ${url}`);
        return res.json();
    }
} 