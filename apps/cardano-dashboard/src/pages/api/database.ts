import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize Supabase with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, tableName, data, primaryKey } = req.body;

    if (action !== 'upsert') {
        return res.status(400).json({ error: 'Invalid action' });
    }

    try {
        const { error: upsertError } = await supabase
            .from(tableName)
            .upsert(data, {
                onConflict: primaryKey
            });

        if (upsertError) throw upsertError;
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Database operation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 