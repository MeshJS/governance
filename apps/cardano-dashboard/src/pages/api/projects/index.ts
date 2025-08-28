import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';

type ProjectRecord = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    url: string;
    icon_url: string | null;
    category: string | null;
    is_active: boolean;
    owner_address?: string | null;
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

    const MAX_CONFIG_BYTES = 64_000; // ~64 KB limit
    const MAX_STR = 256;
    const isValidSlug = (slug: unknown): slug is string => typeof slug === 'string' && /^[a-z0-9-]{1,64}$/.test(slug);
    const isValidUrl = (url: unknown): url is string => {
        if (typeof url !== 'string' || url.length > 2048) return false;
        try {
            const u = new URL(url);
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
            return false;
        }
    };
    const within = (s: unknown, max: number) => typeof s === 'string' && s.length <= max;
    const configSizeOk = (cfg: unknown) => {
        try {
            const str = JSON.stringify(cfg ?? {});
            return Buffer.byteLength(str, 'utf8') <= MAX_CONFIG_BYTES;
        } catch {
            return false;
        }
    };

    if (req.method === 'GET') {
        const { include_inactive } = req.query as { include_inactive?: string };
        const query = supabase
            .from('cardano_projects')
            .select('*')
            .order('created_at', { ascending: false });

        // Only allow inactive listing for authenticated sessions
        const { address } = getAuthContext(req);
        if (include_inactive !== 'true' || !address) {
            query.eq('is_active', true);
        }

        const { data, error } = await query as unknown as { data: ProjectRecord[] | null; error: { message: string } | null };
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ projects: data ?? [] });
    }

    if (req.method === 'POST') {
        const { slug, name, description, url, icon_url, category, is_active, config } = req.body as Partial<ProjectRecord> & { config?: unknown };
        const { address } = getAuthContext(req);
        if (!address) return res.status(401).json({ error: 'Authentication required' });
        if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });
        if (!within(name, MAX_STR)) return res.status(400).json({ error: 'Invalid name' });
        if (description !== undefined && !within(description ?? '', 4000)) return res.status(400).json({ error: 'Invalid description' });
        if (!isValidUrl(url)) return res.status(400).json({ error: 'Invalid url' });
        if (icon_url !== undefined && icon_url !== null && icon_url !== '' && !isValidUrl(icon_url)) return res.status(400).json({ error: 'Invalid icon_url' });
        if (category !== undefined && !within(category ?? '', MAX_STR)) return res.status(400).json({ error: 'Invalid category' });
        if (!configSizeOk(config)) return res.status(400).json({ error: 'Config too large' });

        const normalizedConfig: JsonObject = normalizeJson(config);
        const { data, error } = await supabase
            .from('cardano_projects')
            .insert({ slug, name, description: description ?? null, url, icon_url: icon_url ?? null, category: category ?? null, is_active: is_active ?? true, config: normalizedConfig, owner_address: address })
            .select('*')
            .single();
        if (error) {
            const msg = (error as unknown as { message?: string }).message || '';
            if (/duplicate key/i.test(msg) && /slug/i.test(msg)) {
                return res.status(409).json({ error: 'Slug already exists' });
            }
            return res.status(500).json({ error: msg || 'Insert failed' });
        }
        return res.status(201).json({ project: data });
    }

    if (req.method === 'PUT') {
        const { id, ...rest } = req.body as Partial<ProjectRecord> & { id?: string } & { config?: unknown };
        if (!id) return res.status(400).json({ error: 'id is required' });
        const { address } = getAuthContext(req);
        if (!address) return res.status(401).json({ error: 'Authentication required' });

        // Authorization: owner or listed editor can update
        const { data: ownerRow, error: ownerErr } = await supabase
            .from('cardano_projects')
            .select('owner_address')
            .eq('id', id)
            .single();
        if (ownerErr || !ownerRow) return res.status(404).json({ error: 'Project not found' });
        const isOwner = (ownerRow as { owner_address: string | null }).owner_address === address;
        let isEditor = false;
        if (!isOwner) {
            const { data: ed, error: edErr } = await supabase
                .from('cardano_project_editors')
                .select('editor_address')
                .eq('project_id', id)
                .eq('editor_address', address)
                .maybeSingle();
            if (!edErr && ed) isEditor = true;
        }
        if (!isOwner && !isEditor) return res.status(403).json({ error: 'Not authorized to edit this project' });

        type UpdatableKeys = 'slug' | 'name' | 'description' | 'url' | 'icon_url' | 'category' | 'is_active' | 'config';
        const update: Partial<Record<UpdatableKeys, unknown>> = {};
        const allowed: UpdatableKeys[] = ['slug', 'name', 'description', 'url', 'icon_url', 'category', 'is_active', 'config'];
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(rest, key)) {
                const val = (rest as Record<string, unknown>)[key];
                if (key === 'slug') {
                    if (!isValidSlug(val)) return res.status(400).json({ error: 'Invalid slug' });
                } else if (key === 'name') {
                    if (!within(val, MAX_STR)) return res.status(400).json({ error: 'Invalid name' });
                } else if (key === 'description') {
                    if (val !== undefined && !within((val as string) ?? '', 4000)) return res.status(400).json({ error: 'Invalid description' });
                } else if (key === 'url') {
                    if (!isValidUrl(val)) return res.status(400).json({ error: 'Invalid url' });
                } else if (key === 'icon_url') {
                    if (val !== undefined && val !== null && val !== '' && !isValidUrl(val)) return res.status(400).json({ error: 'Invalid icon_url' });
                } else if (key === 'category') {
                    if (val !== undefined && !within((val as string) ?? '', MAX_STR)) return res.status(400).json({ error: 'Invalid category' });
                } else if (key === 'config') {
                    if (!configSizeOk(val)) return res.status(400).json({ error: 'Config too large' });
                    update[key] = normalizeJson(val);
                    continue;
                }
                update[key] = val as unknown;
            }
        }

        const { data, error } = await supabase
            .from('cardano_projects')
            .update(update)
            .eq('id', id)
            .select('*')
            .single();
        if (error) {
            const msg = (error as unknown as { message?: string }).message || '';
            if (/duplicate key/i.test(msg) && /slug/i.test(msg)) {
                return res.status(409).json({ error: 'Slug already exists' });
            }
            return res.status(500).json({ error: msg || 'Update failed' });
        }
        return res.status(200).json({ project: data });
    }

    if (req.method === 'DELETE') {
        const { id } = req.query as { id?: string };
        if (!id) return res.status(400).json({ error: 'id is required' });
        const { address } = getAuthContext(req);
        if (!address) return res.status(401).json({ error: 'Authentication required' });

        const { data: ownerRow, error: ownerErr } = await supabase
            .from('cardano_projects')
            .select('owner_address')
            .eq('id', id)
            .single();
        if (ownerErr || !ownerRow) return res.status(404).json({ error: 'Project not found' });
        const isOwner = (ownerRow as { owner_address: string | null }).owner_address === address;
        if (!isOwner) return res.status(403).json({ error: 'Only owner can delete the project' });

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


