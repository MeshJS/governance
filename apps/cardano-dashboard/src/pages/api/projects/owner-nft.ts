import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';
import { resolveStakeAddress } from '@/utils/address';

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
    // txhash validation removed (not stored)
    const normUnit = (v: unknown): string | null => {
        if (typeof v !== 'string') return null;
        const s = v.trim().toLowerCase();
        return /^[0-9a-f]{58,200}$/.test(s) ? s : null;
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

    const { project_id, unit: providedUnit } = (req.body || {}) as { project_id?: string; unit?: string };
    if (!project_id || !isUuid(project_id)) { res.status(400).json({ error: 'Invalid project_id' }); return; }

    const own = await assertOwner(project_id);
    if (own !== true) { res.status(403).json({ error: own }); return; }

    // txhash currently unused
    const unit = normUnit(providedUnit);
    if (!unit) { res.status(400).json({ error: 'Missing or invalid unit' }); return; }

    // Append unit to project.owner_nft_units (dedup)
    const { data: projRow, error: projErr2 } = await supabase
        .from('cardano_projects')
        .select('owner_nft_units')
        .eq('id', project_id)
        .single();
    if (projErr2 || !projRow) { res.status(404).json({ error: 'Project not found' }); return; }
    const existing = ((projRow as { owner_nft_units?: string[] | null }).owner_nft_units ?? []) as string[];
    const set = new Set<string>(existing.map((s) => (typeof s === 'string' ? s.toLowerCase() : s)).filter(Boolean) as string[]);
    set.add(unit);
    const next = Array.from(set);

    const { data: updated, error: upErr } = await supabase
        .from('cardano_projects')
        .update({ owner_nft_units: next })
        .eq('id', project_id)
        .select('id, owner_nft_units')
        .single();
    if (upErr) { res.status(500).json({ error: upErr.message }); return; }

    res.status(201).json({ owner_nft_units: (updated as { owner_nft_units?: string[] | null })?.owner_nft_units ?? [] });
}



