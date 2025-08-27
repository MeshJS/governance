import type { NextApiRequest, NextApiResponse } from 'next';
import { generateNonce } from '@meshsdk/core';
import { getSupabaseServerClient } from '@/utils/supabaseServer';

function makeNonce(): string {
    // Human-readable message with embedded random nonce for UX clarity
    return generateNonce('Sign in to Cardano Dashboard: ');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { address, walletName, networkId } = req.body as { address?: string; walletName?: string; networkId?: number };
    if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'address is required' });
    }

    const nonce = makeNonce();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    try {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('wallet_users')
            .upsert({
                address,
                wallet_name: walletName ?? 'Unknown',
                network_id: typeof networkId === 'number' ? networkId : null,
                nonce,
                nonce_expires_at: expiresAt,
                last_seen_at: new Date().toISOString(),
            }, { onConflict: 'address' });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Client will sign the nonce (as bytes) via CIP-30 signData
        return res.status(200).json({ nonce });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Server error';
        return res.status(500).json({ error: message });
    }
}


