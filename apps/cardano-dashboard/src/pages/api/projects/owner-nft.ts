import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';
import { isStakeAddress, resolveStakeAddress, resolveFirstPaymentAddress, getKoiosBase } from '@/utils/address';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const supabase = getSupabaseServerClient();
    const { address } = getAuthContext(req);
    if (!address) { res.status(401).json({ error: 'Authentication required' }); return; }

    const isUuid = (v: unknown) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v);
    const normAddr = (v: unknown): string | null => {
        if (typeof v !== 'string') return null;
        const s = v.trim();
        if (s.length < 10 || s.length > 200) return null;
        if (!(s.startsWith('addr') || s.startsWith('stake'))) return null;
        return s;
    };
    const normFingerprint = (v: unknown): string | null => {
        if (typeof v !== 'string') return null;
        const s = v.trim().toLowerCase();
        return /^asset1[0-9a-z]{10,}$/.test(s) ? s : null;
    };
    const normTxHash = (v: unknown): string | null => {
        if (typeof v !== 'string') return null;
        const s = v.trim().toLowerCase();
        return /^[0-9a-f]{64}$/.test(s) ? s : null;
    };

    // Authorization helper: only owner can manage owner NFTs
    const assertOwner = async (project_id: string): Promise<true | string> => {
        const { data: proj, error: projErr } = await supabase
            .from('cardano_projects')
            .select('owner_wallets')
            .eq('id', project_id)
            .single();
        if (projErr || !proj) return 'Project not found';
        const wallets = ((proj as { owner_wallets?: string[] | null }).owner_wallets ?? []) as string[];
        if (Array.isArray(wallets) && wallets.length > 0) {
            let stake: string | null = null;
            try { stake = await resolveStakeAddress(address); } catch { stake = null; }
            if (wallets.includes(address) || (stake && wallets.includes(stake))) return true;
        }
        return 'Only owner can manage owner NFTs';
    };

    const { project_id, wallet_address, fingerprint: providedFp, txhash: providedTx } = (req.body || {}) as { project_id?: string; wallet_address?: string; fingerprint?: string; txhash?: string };
    if (!project_id || !isUuid(project_id)) { res.status(400).json({ error: 'Invalid project_id' }); return; }

    const own = await assertOwner(project_id);
    if (own !== true) { res.status(403).json({ error: own }); return; }

    let fingerprint = normFingerprint(providedFp);
    const txhash = normTxHash(providedTx);
    const walletAddr = normAddr(wallet_address);

    // Derive fingerprint from txhash if not provided
    if (!fingerprint && txhash) {
        // Normalize wallet for output matching
        let paymentAddress: string | null = walletAddr || null;
        let stakeAddress: string | null = null;
        try {
            if (paymentAddress && isStakeAddress(paymentAddress)) {
                stakeAddress = paymentAddress;
                paymentAddress = await resolveFirstPaymentAddress(paymentAddress);
            } else if (paymentAddress) {
                stakeAddress = await resolveStakeAddress(paymentAddress);
            }
        } catch { /* ignore */ }

        try {
            const base = getKoiosBase(paymentAddress || stakeAddress || address);
            const koiosResp = await fetch(`${base}/tx_info`, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'content-type': 'application/json' },
                body: JSON.stringify({
                    _tx_hashes: [txhash],
                    _inputs: false,
                    _metadata: false,
                    _assets: true,
                    _withdrawals: false,
                    _certs: false,
                    _scripts: false,
                    _bytecode: false,
                }),
            });
            if (!koiosResp.ok) { res.status(502).json({ error: `Koios error ${koiosResp.status}` }); return; }
            const info = await koiosResp.json() as Array<{
                tx_hash?: string;
                outputs?: Array<{ asset_list?: Array<{ fingerprint?: string }>; payment_addr?: { bech32?: string } | null }>;
                assets_minted?: Array<{ fingerprint?: string }>;
            }>;
            const tx = Array.isArray(info) ? info.find(t => (t?.tx_hash || '').toLowerCase() === txhash) : null;
            if (tx) {
                if (paymentAddress && Array.isArray(tx.outputs)) {
                    const out = tx.outputs.find(o => (o?.payment_addr?.bech32 || '') === paymentAddress);
                    const assets = out && Array.isArray(out.asset_list) ? out.asset_list : [];
                    fingerprint = assets.find(a => typeof a?.fingerprint === 'string')?.fingerprint?.toLowerCase() || null;
                }
                if (!fingerprint && Array.isArray(tx.assets_minted)) {
                    fingerprint = tx.assets_minted.find(a => typeof a?.fingerprint === 'string')?.fingerprint?.toLowerCase() || null;
                }
                if (!fingerprint && Array.isArray(tx.outputs)) {
                    for (const out of tx.outputs) {
                        const assets = Array.isArray(out.asset_list) ? out.asset_list : [];
                        const f = assets.find(a => typeof a?.fingerprint === 'string')?.fingerprint;
                        if (f) { fingerprint = f.toLowerCase(); break; }
                    }
                }
            }
        } catch (e) {
            res.status(502).json({ error: e instanceof Error ? e.message : 'Failed to fetch transaction info' });
            return;
        }
    }

    if (!fingerprint) { res.status(400).json({ error: 'Missing or invalid fingerprint/txhash' }); return; }

    // Append fingerprint to project.owner_nft_fingerprints (dedup)
    const { data: projRow, error: projErr2 } = await supabase
        .from('cardano_projects')
        .select('owner_nft_fingerprints')
        .eq('id', project_id)
        .single();
    if (projErr2 || !projRow) { res.status(404).json({ error: 'Project not found' }); return; }
    const existing = ((projRow as { owner_nft_fingerprints?: string[] | null }).owner_nft_fingerprints ?? []) as string[];
    const set = new Set<string>(existing.map((s) => (typeof s === 'string' ? s.toLowerCase() : s)).filter(Boolean) as string[]);
    set.add(fingerprint);
    const next = Array.from(set);

    const { data: updated, error: upErr } = await supabase
        .from('cardano_projects')
        .update({ owner_nft_fingerprints: next })
        .eq('id', project_id)
        .select('id, owner_nft_fingerprints')
        .single();
    if (upErr) { res.status(500).json({ error: upErr.message }); return; }

    res.status(201).json({ owner_nft_fingerprints: (updated as { owner_nft_fingerprints?: string[] | null })?.owner_nft_fingerprints ?? [] });
}



