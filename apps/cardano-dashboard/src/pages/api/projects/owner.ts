import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const supabase = getSupabaseServerClient();
    const { address } = getAuthContext(req);
    if (!address) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    const { project_id, new_owner_address } = req.body as { project_id?: string; new_owner_address?: string };

    const isUuid = (v: unknown) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v);
    const normAddr = (v: unknown): string | null => {
        if (typeof v !== 'string') return null;
        const s = v.trim();
        if (s.length < 10 || s.length > 200) return null;
        if (!(s.startsWith('addr') || s.startsWith('stake'))) return null;
        return s;
    };

    if (!isUuid(project_id)) {
        res.status(400).json({ error: 'Invalid project_id' });
        return;
    }
    const nextOwner = normAddr(new_owner_address);
    if (!nextOwner) {
        res.status(400).json({ error: 'Invalid new_owner_address' });
        return;
    }

    // Verify caller is current owner (legacy single owner or owner_wallets array contains caller)
    const { data: proj, error: projErr } = await supabase
        .from('cardano_projects')
        .select('owner_wallets')
        .eq('id', project_id!)
        .single();
    if (projErr || !proj) {
        res.status(404).json({ error: 'Project not found' });
        return;
    }
    const wallets = (proj as { owner_wallets?: string[] | null }).owner_wallets ?? [];
    const isArrayOwner = Array.isArray(wallets) && wallets.includes(address);
    if (!isArrayOwner) {
        res.status(403).json({ error: 'Only owner can transfer ownership' });
        return;
    }

    if (address === nextOwner) {
        res.status(400).json({ error: 'New owner is the same as current owner' });
        return;
    }

    // Update owner by appending to owner_wallets (do not drop legacy column yet)
    const { data, error } = await supabase
        .from('cardano_projects')
        .update({ owner_wallets: (wallets || []).concat([nextOwner]) })
        .eq('id', project_id!)
        .select('id, owner_wallets')
        .single();

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(200).json({ project: data });
    return;
}


