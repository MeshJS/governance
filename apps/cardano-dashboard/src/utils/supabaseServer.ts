import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
    if (cachedClient) return cachedClient;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

    if (!url || !serviceRoleKey) {
        throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    cachedClient = createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    });
    return cachedClient;
}


