import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { verifyAuthCookie } from '@/utils/authCookie';
import { requireCsrf } from '@/utils/csrf';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    if (!requireCsrf(req, res)) return;

    const cookie = req.cookies['cd_auth'];
    const auth = verifyAuthCookie(cookie);
    if (!auth?.address) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    const { address, walletName, networkId, lastSeenAt } = req.body as {
        address?: string;
        walletName?: string;
        networkId?: number | null;
        lastSeenAt?: string | null;
    };

    if (!address || typeof address !== 'string') {
        res.status(400).json({ error: 'address is required' });
        return;
    }

    // Only allow user to write their own address record
    if (address !== auth.address) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }

    try {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('wallet_users')
            .upsert({
                address,
                wallet_name: walletName ?? 'Unknown',
                network_id: typeof networkId === 'number' ? networkId : null,
                last_seen_at: lastSeenAt ?? new Date().toISOString(),
            }, { onConflict: 'address' });

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json({ ok: true });
        return;
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Server error';
        res.status(500).json({ error: message });
        return;
    }
}


