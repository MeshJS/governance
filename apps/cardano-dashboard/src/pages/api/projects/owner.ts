import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabase = getSupabaseServerClient();
    const { address } = getAuthContext(req);
    if (!address) return res.status(401).json({ error: 'Authentication required' });

    const { project_id, new_owner_address } = req.body as { project_id?: string; new_owner_address?: string };

    const isUuid = (v: unknown) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v);
    const normAddr = (v: unknown): string | null => {
        if (typeof v !== 'string') return null;
        const s = v.trim();
        if (s.length < 10 || s.length > 200) return null;
        if (!(s.startsWith('addr') || s.startsWith('stake'))) return null;
        return s;
    };

    if (!isUuid(project_id)) return res.status(400).json({ error: 'Invalid project_id' });
    const nextOwner = normAddr(new_owner_address);
    if (!nextOwner) return res.status(400).json({ error: 'Invalid new_owner_address' });

    // Verify caller is current owner
    const { data: proj, error: projErr } = await supabase
        .from('cardano_projects')
        .select('owner_address')
        .eq('id', project_id!)
        .single();
    if (projErr || !proj) return res.status(404).json({ error: 'Project not found' });
    if ((proj as { owner_address: string | null }).owner_address !== address) {
        return res.status(403).json({ error: 'Only owner can transfer ownership' });
    }

    if (address === nextOwner) {
        return res.status(400).json({ error: 'New owner is the same as current owner' });
    }

    // Update owner
    const { data, error } = await supabase
        .from('cardano_projects')
        .update({ owner_address: nextOwner })
        .eq('id', project_id!)
        .select('id, owner_address')
        .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ project: data });
}


