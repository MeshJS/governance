import type { NextApiRequest, NextApiResponse } from 'next';
import { generateNonce } from '@meshsdk/core';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { isStakeAddress, resolveStakeAddress } from '@/utils/address';

function makeNonce(): string {
    // Human-readable message with embedded random nonce for UX clarity
    return generateNonce('Sign in to Cardano Dashboard: ');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { address, walletName, networkId, stakeAddress } = req.body as { address?: string; walletName?: string; networkId?: number; stakeAddress?: string };
    if (!address || typeof address !== 'string') {
        res.status(400).json({ error: 'address is required' });
        return;
    }

    const nonce = makeNonce();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    try {
        const supabase = getSupabaseServerClient();

        // Resolve stake address if possible
        let stake: string | null = null;
        if (typeof stakeAddress === 'string' && isStakeAddress(stakeAddress)) {
            stake = stakeAddress;
        } else {
            stake = await resolveStakeAddress(address);
        }
        const { error } = await supabase
            .from('wallet_users')
            .upsert({
                address,
                wallet_name: walletName ?? 'Unknown',
                network_id: typeof networkId === 'number' ? networkId : null,
                nonce,
                nonce_expires_at: expiresAt,
                last_seen_at: new Date().toISOString(),
                stake_address: stake,
            }, { onConflict: 'address' });

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        // Client will sign the nonce (as bytes) via CIP-30 signData
        res.status(200).json({ nonce });
        return;
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Server error';
        res.status(500).json({ error: message });
        return;
    }
}


