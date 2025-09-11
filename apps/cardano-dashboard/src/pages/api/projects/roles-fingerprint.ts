import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';
import { isStakeAddress, resolveStakeAddress, resolveFirstPaymentAddress, getKoiosBase } from '@/utils/address';

type RoleRow = {
    id: string;
    project_id: string;
    role: 'admin' | 'editor';
    principal_type: 'wallet' | 'nft_policy' | 'nft_fingerprint';
    wallet_payment_address: string | null;
    stake_address: string | null;
    policy_id: string | null;
    fingerprint: string | null;
    txhash: string | null;
    added_by_address: string;
    created_at: string;
};

type KoiosTxInfo = Array<{
    tx_hash: string;
    outputs?: Array<{
        asset_list?: Array<{ fingerprint?: string; quantity?: string | number }>;
        payment_addr?: { bech32?: string } | null;
    }>;
    assets_minted?: Array<{ fingerprint?: string; quantity?: string | number }>;
}>;

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const supabase = getSupabaseServerClient();
    const { address: sessionAddress } = getAuthContext(req);
    if (!sessionAddress) { res.status(401).json({ error: 'Authentication required' }); return; }

    const body = (req.body || {}) as { wallet_address?: string | null };
    const providedAddress = typeof body.wallet_address === 'string' && body.wallet_address.trim().length > 0
        ? body.wallet_address.trim()
        : sessionAddress;

    // Normalize to both payment and stake where possible for matching
    let paymentAddress: string | null = providedAddress;
    let stakeAddress: string | null = null;
    try {
        if (isStakeAddress(providedAddress)) {
            stakeAddress = providedAddress;
            paymentAddress = await resolveFirstPaymentAddress(providedAddress);
        } else {
            stakeAddress = await resolveStakeAddress(providedAddress);
        }
    } catch {
        // proceed with what we have
    }

    // Find roles for this wallet missing fingerprint but having txhash
    let query = supabase
        .from('cardano_project_roles')
        .select('id, project_id, role, principal_type, wallet_payment_address, stake_address, fingerprint, txhash')
        .eq('principal_type', 'wallet')
        .or('fingerprint.is.null,fingerprint.eq.')
        .not('txhash', 'is', null);

    // Match by payment or stake address (whichever are available)
    if (paymentAddress && stakeAddress) {
        query = query.or(`wallet_payment_address.eq.${paymentAddress},stake_address.eq.${stakeAddress}`);
    } else if (paymentAddress) {
        query = query.eq('wallet_payment_address', paymentAddress);
    } else if (stakeAddress) {
        query = query.eq('stake_address', stakeAddress);
    }

    const { data: roles, error: rolesErr } = await query as unknown as { data: RoleRow[] | null; error: { message: string } | null };
    if (rolesErr) { res.status(500).json({ error: rolesErr.message }); return; }
    const targetRoles = (roles ?? []).filter(r => typeof r.txhash === 'string' && r.txhash.length === 64);
    if (targetRoles.length === 0) { res.status(200).json({ updated: 0 }); return; }

    const txHashes = Array.from(new Set(targetRoles.map(r => (r.txhash as string).toLowerCase())));

    // Query Koios for tx_info with assets
    let txInfo: KoiosTxInfo | null = null;
    try {
        const base = getKoiosBase(paymentAddress || stakeAddress || sessionAddress);
        const koiosResp = await fetch(`${base}/tx_info`, {
            method: 'POST',
            headers: { 'accept': 'application/json', 'content-type': 'application/json' },
            body: JSON.stringify({
                _tx_hashes: txHashes,
                _inputs: false,
                _metadata: false,
                _assets: true,
                _withdrawals: false,
                _certs: false,
                _scripts: false,
                _bytecode: false,
            }),
        });
        if (!koiosResp.ok) throw new Error(`Koios error ${koiosResp.status}`);
        txInfo = await koiosResp.json();
    } catch (e) {
        res.status(502).json({ error: e instanceof Error ? e.message : 'Failed to fetch transaction info' });
        return;
    }

    let updated = 0;
    const debug: Array<{ id: string; txhash: string; picked?: string; outputs?: number; minted?: number; matched_output?: boolean; error?: string }>
        = [];
    for (const role of targetRoles) {
        const txh = (role.txhash as string).toLowerCase();
        const tx = (txInfo ?? []).find(t => (t.tx_hash || '').toLowerCase() === txh);
        if (!tx) continue;
        let fp: string | undefined;
        // Prefer fingerprint on the output sent to the wallet_payment_address
        if (role.wallet_payment_address && Array.isArray(tx.outputs)) {
            const outForWallet = tx.outputs.find(o => (o?.payment_addr?.bech32 || '') === role.wallet_payment_address);
            const assets = outForWallet && Array.isArray(outForWallet.asset_list) ? outForWallet.asset_list : [];
            fp = assets.find(a => typeof a?.fingerprint === 'string')?.fingerprint;
        }
        // Fallback to minted assets list
        if (!fp && Array.isArray(tx.assets_minted)) {
            fp = tx.assets_minted.find(a => typeof a?.fingerprint === 'string')?.fingerprint;
        }
        // Fallback to any output asset fingerprint
        if (!fp && Array.isArray(tx.outputs)) {
            for (const out of tx.outputs) {
                const assets = Array.isArray(out.asset_list) ? out.asset_list : [];
                const found = assets.find(a => typeof a?.fingerprint === 'string');
                if (found?.fingerprint) { fp = found.fingerprint; break; }
            }
        }
        if (!fp || !/^asset1[0-9a-z]{10,}$/.test(fp)) continue;
        const { data: upd, error: upErr } = await supabase
            .from('cardano_project_roles')
            .update({
                principal_type: 'nft_fingerprint',
                fingerprint: fp,
                wallet_payment_address: null,
                stake_address: null,
                policy_id: null,
            })
            .eq('id', role.id)
            .select('id');
        if (!upErr) updated += (Array.isArray(upd) ? upd.length : 0);
        debug.push({ id: role.id, txhash: txh, picked: fp, outputs: Array.isArray(tx.outputs) ? tx.outputs.length : undefined, minted: Array.isArray(tx.assets_minted) ? tx.assets_minted.length : undefined, error: upErr?.message });
    }

    res.status(200).json({ updated, debug });
}


