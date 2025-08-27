import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import type { DataSignature } from '@meshsdk/core';
import { checkSignature } from '@meshsdk/core';
import { signAuthPayload } from '@/utils/authCookie';

// Nonce is already a hex string from the server

function setAuthCookie(res: NextApiResponse, address: string) {
    const value = signAuthPayload({ address, ts: Date.now() });
    if (!value) return;
    const isProd = process.env.NODE_ENV === 'production';
    // In dev, allow reading cookie in DevTools by omitting HttpOnly
    const httpOnly = isProd ? 'HttpOnly; ' : '';
    res.setHeader('Set-Cookie', `cd_auth=${value}; Path=/; ${httpOnly}SameSite=Lax; Max-Age=2592000; ${isProd ? 'Secure; ' : ''}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { address, signature } = req.body as {
        address?: string;
        signature?: DataSignature;
    };

    if (!address || !signature?.signature || !signature?.key) {
        return res.status(400).json({ error: 'address and signature object are required' });
    }

    const supabase = getSupabaseServerClient();

    const { data: userRecord, error } = await supabase
        .from('wallet_users')
        .select('nonce, nonce_expires_at')
        .eq('address', address)
        .single();

    if (error || !userRecord) {
        return res.status(400).json({ error: 'No nonce issued for this address' });
    }

    const { nonce, nonce_expires_at } = userRecord as { nonce: string; nonce_expires_at: string | null };
    if (!nonce) {
        return res.status(400).json({ error: 'Missing nonce' });
    }

    if (nonce_expires_at && new Date(nonce_expires_at).getTime() < Date.now()) {
        return res.status(400).json({ error: 'Nonce expired, request a new one' });
    }

    try {
        const isValid = checkSignature(nonce, signature, address);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        await supabase
            .from('wallet_users')
            .update({ verified_at: new Date().toISOString(), nonce: null, nonce_expires_at: null, last_seen_at: new Date().toISOString() })
            .eq('address', address);

        setAuthCookie(res, address);
        return res.status(200).json({ ok: true });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Verification failed';
        return res.status(500).json({ error: message });
    }
}


