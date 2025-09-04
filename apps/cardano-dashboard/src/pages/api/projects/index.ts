import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';
import { resolveStakeAddress } from '@/utils/address';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
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
        const { include_inactive, only_editable, nft_fingerprints } = req.query as { include_inactive?: string; only_editable?: string; nft_fingerprints?: string };
        const { address } = getAuthContext(req);


        // If requesting only projects the current wallet can edit, require auth and merge owner + editor projects
        if (only_editable === 'true') {
            if (!address) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const activeFilter = include_inactive === 'true' ? undefined : true;

            // Parse provided NFT fingerprints from client (lowercase, dedup)
            const providedFingerprints = (nft_fingerprints ?? '')
                .split(',')
                .map((p) => p.trim().toLowerCase())
                .filter((p) => /^asset1[0-9a-z]{10,}$/.test(p));
            const uniqueFingerprints = Array.from(new Set(providedFingerprints));

            // Resolve stake address for stake-aware editor matching (fallback to wallet_users table)
            let stake = await resolveStakeAddress(address);
            if (!stake) {
                const { data: wu } = await supabase
                    .from('wallet_users')
                    .select('stake_address')
                    .eq('address', address)
                    .maybeSingle();
                stake = (wu as { stake_address?: string | null } | null)?.stake_address ?? null;
            }


            // Roles: wallet-based admin/editor
            let rolesWalletQuery = supabase
                .from('cardano_project_roles')
                .select('project_id')
                .eq('principal_type', 'wallet')
                .in('role', ['admin', 'editor']);
            rolesWalletQuery = stake
                ? rolesWalletQuery.or(`wallet_payment_address.eq.${address},stake_address.eq.${stake}`)
                : rolesWalletQuery.eq('wallet_payment_address', address);
            const { data: roleWalletRows, error: roleWalletErr } = await rolesWalletQuery;
            if (roleWalletErr) { res.status(500).json({ error: roleWalletErr.message }); return; }
            const roleWalletIds = (roleWalletRows ?? []).map((r: { project_id: string }) => r.project_id);

            // Roles: NFT fingerprint-based admin/editor
            let roleFingerprintIds: string[] = [];
            if (uniqueFingerprints.length > 0) {
                const { data: roleFpRows, error: roleFpErr } = await supabase
                    .from('cardano_project_roles')
                    .select('project_id')
                    .eq('principal_type', 'nft_fingerprint')
                    .in('role', ['admin', 'editor'])
                    .in('fingerprint', uniqueFingerprints);
                if (roleFpErr) { res.status(500).json({ error: roleFpErr.message }); return; }
                roleFingerprintIds = (roleFpRows ?? []).map((r: { project_id: string }) => r.project_id);
            }

            // Owner by address (legacy) or owner_wallets array contains address
            let ownerQuery = supabase
                .from('cardano_projects')
                .select('*')
                .or(`owner_address.eq.${address},owner_wallets.cs.{${address}}`);
            if (activeFilter !== undefined) ownerQuery = ownerQuery.eq('is_active', activeFilter);
            const { data: ownerProjects, error: ownerErr } = await ownerQuery as unknown as { data: ProjectRecord[] | null; error: { message: string } | null };
            if (ownerErr) { res.status(500).json({ error: ownerErr.message }); return; }

            // Owner by NFT fingerprint
            let ownerNftProjects: ProjectRecord[] = [];
            if (uniqueFingerprints.length > 0) {
                let ownerNftQuery = supabase
                    .from('cardano_projects')
                    .select('*')
                    .overlaps('owner_nft_fingerprints', uniqueFingerprints);
                if (activeFilter !== undefined) ownerNftQuery = ownerNftQuery.eq('is_active', activeFilter);
                const { data: ownerByNft, error: ownerNftErr } = await ownerNftQuery as unknown as { data: ProjectRecord[] | null; error: { message: string } | null };
                if (ownerNftErr) { res.status(500).json({ error: ownerNftErr.message }); return; }
                ownerNftProjects = ownerByNft ?? [];
            }
            // Role projects
            const editableProjectIds = Array.from(new Set([...roleWalletIds, ...roleFingerprintIds]));
            let roleProjects: ProjectRecord[] = [];
            if (editableProjectIds.length > 0) {
                let rolesQuery = supabase
                    .from('cardano_projects')
                    .select('*')
                    .in('id', editableProjectIds);
                if (activeFilter !== undefined) rolesQuery = rolesQuery.eq('is_active', activeFilter);
                const { data: roleProjectsData, error: rolesErr } = await rolesQuery as unknown as { data: ProjectRecord[] | null; error: { message: string } | null };
                if (rolesErr) { res.status(500).json({ error: rolesErr.message }); return; }
                roleProjects = roleProjectsData ?? [];
            }

            // Merge + dedupe by id and sort by created_at desc
            const map = new Map<string, ProjectRecord>();
            for (const p of [...(ownerProjects ?? []), ...ownerNftProjects, ...roleProjects]) {
                map.set(p.id, p);
            }
            const merged = Array.from(map.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
            res.status(200).json({ projects: merged });
            return;
        }

        // Otherwise, list projects (optionally including inactive if authenticated)
        const query = supabase
            .from('cardano_projects')
            .select('*')
            .order('created_at', { ascending: false });

        // Only allow inactive listing for authenticated sessions
        if (include_inactive !== 'true' || !address) {
            query.eq('is_active', true);
        }

        const { data, error } = await query as unknown as { data: ProjectRecord[] | null; error: { message: string } | null };
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.status(200).json({ projects: data ?? [] });
        return;
    }

    if (req.method === 'POST') {
        const { slug, name, description, url, icon_url, category, is_active, config } = req.body as Partial<ProjectRecord> & { config?: unknown };
        const { address } = getAuthContext(req);
        if (!address) { res.status(401).json({ error: 'Authentication required' }); return; }
        if (!isValidSlug(slug)) { res.status(400).json({ error: 'Invalid slug' }); return; }
        if (!within(name, MAX_STR)) { res.status(400).json({ error: 'Invalid name' }); return; }
        if (description !== undefined && !within(description ?? '', 4000)) { res.status(400).json({ error: 'Invalid description' }); return; }
        if (!isValidUrl(url)) { res.status(400).json({ error: 'Invalid url' }); return; }
        if (icon_url !== undefined && icon_url !== null && icon_url !== '' && !isValidUrl(icon_url)) { res.status(400).json({ error: 'Invalid icon_url' }); return; }
        if (category !== undefined && !within(category ?? '', MAX_STR)) { res.status(400).json({ error: 'Invalid category' }); return; }
        if (!configSizeOk(config)) { res.status(400).json({ error: 'Config too large' }); return; }

        const normalizedConfig: JsonObject = normalizeJson(config);
        const { data, error } = await supabase
            .from('cardano_projects')
            .insert({ slug, name, description: description ?? null, url, icon_url: icon_url ?? null, category: category ?? null, is_active: is_active ?? true, config: normalizedConfig, owner_address: address })
            .select('*')
            .single();
        if (error) {
            const msg = (error as unknown as { message?: string }).message || '';
            if (/duplicate key/i.test(msg) && /slug/i.test(msg)) {
                res.status(409).json({ error: 'Slug already exists' });
                return;
            }
            res.status(500).json({ error: msg || 'Insert failed' });
            return;
        }
        res.status(201).json({ project: data });
        return;
    }

    if (req.method === 'PUT') {
        const { id, ...rest } = req.body as Partial<ProjectRecord> & { id?: string } & { config?: unknown };
        if (!id) { res.status(400).json({ error: 'id is required' }); return; }
        const { address } = getAuthContext(req);
        if (!address) { res.status(401).json({ error: 'Authentication required' }); return; }

        // Authorization: owner or listed editor can update
        const { data: ownerRow, error: ownerErr } = await supabase
            .from('cardano_projects')
            .select('owner_address')
            .eq('id', id)
            .single();
        if (ownerErr || !ownerRow) { res.status(404).json({ error: 'Project not found' }); return; }
        const isOwner = (ownerRow as { owner_address: string | null }).owner_address === address;
        let isEditor = false;
        if (!isOwner) {
            let stake = await resolveStakeAddress(address);
            if (!stake) {
                const { data: wu } = await supabase
                    .from('wallet_users')
                    .select('stake_address')
                    .eq('address', address)
                    .maybeSingle();
                stake = (wu as { stake_address?: string | null } | null)?.stake_address ?? null;
            }
            let edQuery = supabase
                .from('cardano_project_editors')
                .select('project_id')
                .eq('project_id', id);
            edQuery = stake
                ? edQuery.or(`editor_address.eq.${address},stake_address.eq.${stake}`)
                : edQuery.eq('editor_address', address);
            const { data: ed, error: edErr } = await edQuery.limit(1).maybeSingle();
            if (!edErr && ed) isEditor = true;
        }
        if (!isOwner && !isEditor) { res.status(403).json({ error: 'Not authorized to edit this project' }); return; }

        type UpdatableKeys = 'slug' | 'name' | 'description' | 'url' | 'icon_url' | 'category' | 'is_active' | 'config' | 'owner_nft_fingerprints' | 'owner_wallets';
        const update: Partial<Record<UpdatableKeys, unknown>> = {};
        const allowed: UpdatableKeys[] = ['slug', 'name', 'description', 'url', 'icon_url', 'category', 'is_active', 'config', 'owner_nft_fingerprints', 'owner_wallets'];
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(rest, key)) {
                const val = (rest as Record<string, unknown>)[key];
                if (key === 'slug') {
                    if (!isValidSlug(val)) { res.status(400).json({ error: 'Invalid slug' }); return; }
                } else if (key === 'name') {
                    if (!within(val, MAX_STR)) { res.status(400).json({ error: 'Invalid name' }); return; }
                } else if (key === 'description') {
                    if (val !== undefined && !within((val as string) ?? '', 4000)) { res.status(400).json({ error: 'Invalid description' }); return; }
                } else if (key === 'url') {
                    if (!isValidUrl(val)) { res.status(400).json({ error: 'Invalid url' }); return; }
                } else if (key === 'icon_url') {
                    if (val !== undefined && val !== null && val !== '' && !isValidUrl(val)) { res.status(400).json({ error: 'Invalid icon_url' }); return; }
                } else if (key === 'category') {
                    if (val !== undefined && !within((val as string) ?? '', MAX_STR)) { res.status(400).json({ error: 'Invalid category' }); return; }
                } else if (key === 'config') {
                    if (!configSizeOk(val)) { res.status(400).json({ error: 'Config too large' }); return; }
                    update[key] = normalizeJson(val);
                    continue;
                } else if (key === 'owner_nft_fingerprints') {
                    if (val === null || val === undefined || val === '') { update[key] = null; continue; }
                    const arr = Array.isArray(val) ? val : (typeof val === 'string' ? val.split(',') : []);
                    const cleaned = arr
                        .map((p) => (typeof p === 'string' ? p.trim().toLowerCase() : ''))
                        .filter((p) => /^asset1[0-9a-z]{10,}$/.test(p));
                    update[key] = cleaned.length ? cleaned : null;
                    continue;
                } else if (key === 'owner_wallets') {
                    if (val === null || val === undefined || val === '') { update[key] = null; continue; }
                    const arr = Array.isArray(val) ? val : (typeof val === 'string' ? val.split(',') : []);
                    const cleaned = arr
                        .map((a) => (typeof a === 'string' ? a.trim() : ''))
                        .filter((a) => a && (a.startsWith('addr') || a.startsWith('stake')));
                    update[key] = cleaned.length ? cleaned : null;
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
                res.status(409).json({ error: 'Slug already exists' });
                return;
            }
            res.status(500).json({ error: msg || 'Update failed' });
            return;
        }
        res.status(200).json({ project: data });
        return;
    }

    if (req.method === 'DELETE') {
        const { id } = req.query as { id?: string };
        if (!id) { res.status(400).json({ error: 'id is required' }); return; }
        const { address } = getAuthContext(req);
        if (!address) { res.status(401).json({ error: 'Authentication required' }); return; }

        const { data: ownerRow, error: ownerErr } = await supabase
            .from('cardano_projects')
            .select('owner_address')
            .eq('id', id)
            .single();
        if (ownerErr || !ownerRow) { res.status(404).json({ error: 'Project not found' }); return; }
        const isOwner = (ownerRow as { owner_address: string | null }).owner_address === address;
        if (!isOwner) { res.status(403).json({ error: 'Only owner can delete the project' }); return; }

        const { error } = await supabase
            .from('cardano_projects')
            .delete()
            .eq('id', id);
        if (error) { res.status(500).json({ error: error.message }); return; }
        res.status(204).end();
        return;
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    res.status(405).json({ error: 'Method Not Allowed' });
}


