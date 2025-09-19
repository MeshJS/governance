import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import type { DataSignature } from '@meshsdk/core';
import { checkSignature } from '@meshsdk/core';
import { signAuthPayload } from '@/utils/authCookie';
import crypto from 'crypto';

// Nonce is already a hex string from the server

function setAuthCookie(res: NextApiResponse, address: string) {
    const value = signAuthPayload({ address, ts: Date.now() });
    if (!value) return;
    const isProd = process.env.NODE_ENV === 'production';
    const cookies: string[] = [];
    cookies.push(`cd_auth=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; ${isProd ? 'Secure; ' : ''}`);
    // Double-submit CSRF token cookie (readable by JS)
    const csrf = crypto.randomBytes(32).toString('base64url');
    cookies.push(`cd_csrf=${csrf}; Path=/; SameSite=Lax; Max-Age=2592000; ${isProd ? 'Secure; ' : ''}`);
    res.setHeader('Set-Cookie', cookies);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { address, signature } = req.body as {
        address?: string;
        signature?: DataSignature;
    };

    if (!address || !signature?.signature || !signature?.key) {
        res.status(400).json({ error: 'address and signature object are required' });
        return;
    }

    const supabase = getSupabaseServerClient();

    const { data: userRecord, error } = await supabase
        .from('wallet_users')
        .select('nonce, nonce_expires_at')
        .eq('address', address)
        .single();

    if (error || !userRecord) {
        res.status(400).json({ error: 'No nonce issued for this address' });
        return;
    }

    const { nonce, nonce_expires_at } = userRecord as { nonce: string; nonce_expires_at: string | null };
    if (!nonce) {
        res.status(400).json({ error: 'Missing nonce' });
        return;
    }

    if (nonce_expires_at && new Date(nonce_expires_at).getTime() < Date.now()) {
        res.status(400).json({ error: 'Nonce expired, request a new one' });
        return;
    }

    try {
        const isValid = checkSignature(nonce, signature, address);

        if (!isValid) {
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }

        await supabase
            .from('wallet_users')
            .update({ verified_at: new Date().toISOString(), nonce: null, nonce_expires_at: null, last_seen_at: new Date().toISOString() })
            .eq('address', address);

        setAuthCookie(res, address);
        res.status(200).json({ ok: true });
        return;
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Verification failed';
        res.status(500).json({ error: message });
        return;
    }
}


