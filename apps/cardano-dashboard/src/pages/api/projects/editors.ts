import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';

type EditorRow = { project_id: string; editor_address: string; added_by_address: string; created_at: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = getSupabaseServerClient();
    const { address } = getAuthContext(req);
    if (!address) return res.status(401).json({ error: 'Authentication required' });

    const isUuid = (v: unknown) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v);
    const normAddr = (v: unknown): string | null => {
        if (typeof v !== 'string') return null;
        const s = v.trim();
        if (s.length < 10 || s.length > 200) return null;
        if (!(s.startsWith('addr') || s.startsWith('stake'))) return null;
        return s;
    };

    if (req.method === 'GET') {
        const { project_id } = req.query as { project_id?: string };
        if (!project_id || !isUuid(project_id)) return res.status(400).json({ error: 'Invalid project_id' });

        // Only owner can view editors list
        const { data: proj, error: projErr } = await supabase
            .from('cardano_projects')
            .select('owner_address')
            .eq('id', project_id)
            .single();
        if (projErr || !proj) return res.status(404).json({ error: 'Project not found' });
        if ((proj as { owner_address: string | null }).owner_address !== address) {
            return res.status(403).json({ error: 'Only owner can view editors' });
        }

        const { data, error } = await supabase
            .from('cardano_project_editors')
            .select('*')
            .eq('project_id', project_id) as unknown as { data: EditorRow[] | null; error: { message: string } | null };
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ editors: data ?? [] });
    }

    if (req.method === 'POST') {
        const body = req.body as { project_id?: string; editor_address?: string };
        const project_id = body?.project_id;
        const editor_address = normAddr(body?.editor_address);
        if (!project_id || !isUuid(project_id) || !editor_address) return res.status(400).json({ error: 'Invalid project_id or editor_address' });

        // Only owner can add editor
        const { data: proj, error: projErr } = await supabase
            .from('cardano_projects')
            .select('owner_address')
            .eq('id', project_id)
            .single();
        if (projErr || !proj) return res.status(404).json({ error: 'Project not found' });
        if ((proj as { owner_address: string | null }).owner_address !== address) {
            return res.status(403).json({ error: 'Only owner can add editors' });
        }

        // Limit editors per project to prevent abuse (e.g., 50)
        const { data: existingEditors } = await supabase
            .from('cardano_project_editors')
            .select('editor_address', { count: 'exact', head: true })
            .eq('project_id', project_id);
        const currentCount = (existingEditors as unknown as { length?: number })?.length ?? 0;
        if (currentCount >= 50) return res.status(400).json({ error: 'Too many editors on this project' });

        const { data, error } = await supabase
            .from('cardano_project_editors')
            .upsert({ project_id, editor_address, added_by_address: address })
            .select('*')
            .single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json({ editor: data });
    }

    if (req.method === 'DELETE') {
        const { project_id, editor_address: rawAddr } = req.query as { project_id?: string; editor_address?: string };
        const editor_address = normAddr(rawAddr);
        if (!project_id || !isUuid(project_id) || !editor_address) return res.status(400).json({ error: 'Invalid project_id or editor_address' });

        // Only owner can remove editor
        const { data: proj, error: projErr } = await supabase
            .from('cardano_projects')
            .select('owner_address')
            .eq('id', project_id)
            .single();
        if (projErr || !proj) return res.status(404).json({ error: 'Project not found' });
        if ((proj as { owner_address: string | null }).owner_address !== address) {
            return res.status(403).json({ error: 'Only owner can remove editors' });
        }

        const { error } = await supabase
            .from('cardano_project_editors')
            .delete()
            .eq('project_id', project_id)
            .eq('editor_address', editor_address);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
}


