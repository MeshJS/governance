import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';

type ProjectRecord = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    url: string;
    icon_url: string | null;
    category: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    config?: unknown;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = getSupabaseServerClient();

    type JsonObject = Record<string, unknown>;

    const normalizeJson = (value: unknown): JsonObject => {
        try {
            return JSON.parse(JSON.stringify(value ?? {}));
        } catch {
            return {} as JsonObject;
        }
    };

    if (req.method === 'GET') {
        const { include_inactive } = req.query as { include_inactive?: string };
        const query = supabase
            .from('cardano_projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (include_inactive !== 'true') {
            query.eq('is_active', true);
        }

        const { data, error } = await query as unknown as { data: ProjectRecord[] | null; error: { message: string } | null };
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ projects: data ?? [] });
    }

    if (req.method === 'POST') {
        const { slug, name, description, url, icon_url, category, is_active, config } = req.body as Partial<ProjectRecord> & { config?: unknown };
        if (!slug || !name || !url) {
            return res.status(400).json({ error: 'slug, name, and url are required' });
        }

        const normalizedConfig: JsonObject = normalizeJson(config);
        const { data, error } = await supabase
            .from('cardano_projects')
            .insert({ slug, name, description: description ?? null, url, icon_url: icon_url ?? null, category: category ?? null, is_active: is_active ?? true, config: normalizedConfig })
            .select('*')
            .single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json({ project: data });
    }

    if (req.method === 'PUT') {
        const { id, ...rest } = req.body as Partial<ProjectRecord> & { id?: string } & { config?: unknown };
        if (!id) return res.status(400).json({ error: 'id is required' });

        type UpdatableKeys = 'slug' | 'name' | 'description' | 'url' | 'icon_url' | 'category' | 'is_active' | 'config';
        const update: Partial<Record<UpdatableKeys, unknown>> = {};
        const allowed: UpdatableKeys[] = ['slug', 'name', 'description', 'url', 'icon_url', 'category', 'is_active', 'config'];
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(rest, key)) {
                update[key] = key === 'config' ? normalizeJson((rest as Record<string, unknown>)[key]) : (rest as Record<string, unknown>)[key];
            }
        }

        const { data, error } = await supabase
            .from('cardano_projects')
            .update(update)
            .eq('id', id)
            .select('*')
            .single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ project: data });
    }

    if (req.method === 'DELETE') {
        const { id } = req.query as { id?: string };
        if (!id) return res.status(400).json({ error: 'id is required' });

        const { error } = await supabase
            .from('cardano_projects')
            .delete()
            .eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
}


