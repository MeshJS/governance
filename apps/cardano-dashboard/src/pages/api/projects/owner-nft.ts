import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';
import { resolveStakeAddress } from '@/utils/address';
import { requireCsrf } from '@/utils/csrf';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    if (!requireCsrf(req, res)) return;

    const supabase = getSupabaseServerClient();
    const { address } = getAuthContext(req);
    if (!address) { res.status(401).json({ error: 'Authentication required' }); return; }

    const isUuid = (v: unknown) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v);
    // txhash validation removed (not stored)
    const normUnit = (v: unknown): string | null => {
        if (typeof v !== 'string') return null;
        const s = v.trim().toLowerCase();
        return /^[0-9a-f]{58,200}$/.test(s) ? s : null;
    };

    // Authorization helper: only existing owner can create owner NFT entries
    const assertOwner = async (project_id: string): Promise<true | string> => {
        const stake = await resolveStakeAddress(address).catch(() => null);
        let q = supabase
            .from('cardano_project_roles')
            .select('project_id')
            .eq('project_id', project_id)
            .eq('role', 'owner')
            .eq('principal_type', 'wallet');
        q = stake
            ? q.or(`wallet_payment_address.eq.${address},stake_address.eq.${stake}`)
            : q.eq('wallet_payment_address', address);
        const { data, error } = await q.limit(1).maybeSingle();
        if (!error && data) return true;
        return 'Only owner can manage owner NFTs';
    };

    const { project_id, unit: providedUnit } = (req.body || {}) as { project_id?: string; unit?: string };
    if (!project_id || !isUuid(project_id)) { res.status(400).json({ error: 'Invalid project_id' }); return; }

    const own = await assertOwner(project_id);
    if (own !== true) { res.status(403).json({ error: own }); return; }

    const unit = normUnit(providedUnit);
    if (!unit) { res.status(400).json({ error: 'Missing or invalid unit' }); return; }
    // Insert owner role with nft_unit principal
    const { data, error } = await supabase
        .from('cardano_project_roles')
        .upsert({ project_id, role: 'owner', principal_type: 'nft_unit', unit, added_by_address: address })
        .select('id, project_id, role, principal_type, unit')
        .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ role: data });
}



