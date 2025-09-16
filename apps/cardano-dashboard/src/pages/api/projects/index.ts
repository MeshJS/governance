import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';
import { resolveStakeAddress, isStakeAddress, resolveFirstPaymentAddress, fetchUnitsByStakeOrAddress } from '@/utils/address';

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
        const { include_inactive, only_editable } = req.query as { include_inactive?: string; only_editable?: string };
        const { address } = getAuthContext(req);


        // If requesting only projects the current wallet can edit, require auth and merge owner + editor projects
        if (only_editable === 'true') {
            if (!address) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const activeFilter = include_inactive === 'true' ? undefined : true;

            // Resolve stake address for stake-aware matching
            let stake = await resolveStakeAddress(address);
            if (!stake) {
                const { data: wu } = await supabase
                    .from('wallet_users')
                    .select('stake_address')
                    .eq('address', address)
                    .maybeSingle();
                stake = (wu as { stake_address?: string | null } | null)?.stake_address ?? null;
            }

            // Derive held units on the server for security
            const uniqueUnits = await fetchUnitsByStakeOrAddress(stake || address);


            // Roles: wallet-based owner/admin/editor
            let rolesWalletQuery = supabase
                .from('cardano_project_roles')
                .select('project_id, role')
                .eq('principal_type', 'wallet')
                .in('role', ['owner', 'admin', 'editor']);
            // Accept both payment and stake addresses on either column
            const orFilters: string[] = [];
            // Always try payment address match with cookie address (may be payment or stake)
            orFilters.push(`wallet_payment_address.eq.${address}`);
            if (stake) orFilters.push(`stake_address.eq.${stake}`);
            // If cookie is a stake address, try to resolve a payment address and include
            if (isStakeAddress(address)) {
                const paymentForStake = await resolveFirstPaymentAddress(address).catch(() => null);
                if (paymentForStake) {
                    orFilters.push(`wallet_payment_address.eq.${paymentForStake}`);
                }
            }
            rolesWalletQuery = rolesWalletQuery.or(orFilters.join(','));
            const { data: roleWalletRows, error: roleWalletErr } = await rolesWalletQuery;
            if (roleWalletErr) { res.status(500).json({ error: roleWalletErr.message }); return; }
            const roleWalletIds = (roleWalletRows ?? []).map((r: { project_id: string }) => r.project_id);

            // Roles: NFT unit-based owner/admin/editor
            let roleUnitIds: string[] = [];
            if (uniqueUnits.length > 0) {
                const { data: roleUnitRows, error: roleUnitErr } = await supabase
                    .from('cardano_project_roles')
                    .select('project_id, role')
                    .eq('principal_type', 'nft_unit')
                    .in('role', ['owner', 'admin', 'editor'])
                    .in('unit', uniqueUnits);
                if (roleUnitErr) { res.status(500).json({ error: roleUnitErr.message }); return; }
                roleUnitIds = (roleUnitRows ?? []).map((r: { project_id: string }) => r.project_id);
            }
            // Merge owner/admin/editor project ids
            const editableProjectIds = Array.from(new Set([...roleWalletIds, ...roleUnitIds]));

            // Also compute my_role for those projects
            type RoleRow = { project_id: string; role: 'owner' | 'admin' | 'editor'; principal_type: 'wallet' | 'nft_unit' };
            let myRoles: RoleRow[] = [];
            if (editableProjectIds.length > 0) {
                // Fetch roles for these projects scoped to the caller
                let rQuery = supabase
                    .from('cardano_project_roles')
                    .select('project_id, role, principal_type')
                    .in('project_id', editableProjectIds)
                    .in('role', ['owner', 'admin', 'editor']);
                const ors: string[] = [`wallet_payment_address.eq.${address}`];
                if (stake) ors.push(`stake_address.eq.${stake}`);
                if (isStakeAddress(address)) {
                    const paymentForStake = await resolveFirstPaymentAddress(address).catch(() => null);
                    if (paymentForStake) ors.push(`wallet_payment_address.eq.${paymentForStake}`);
                }
                rQuery = rQuery.or(ors.join(','));
                const { data: walletRoleRows, error: walletRoleErr } = await rQuery;
                if (walletRoleErr) { res.status(500).json({ error: walletRoleErr.message }); return; }
                myRoles = (walletRoleRows ?? []) as RoleRow[];

                // Include NFT roles via units
                if (uniqueUnits.length > 0) {
                    const { data: unitRoleRows, error: unitRoleErr } = await supabase
                        .from('cardano_project_roles')
                        .select('project_id, role, principal_type')
                        .eq('principal_type', 'nft_unit')
                        .in('project_id', editableProjectIds)
                        .in('role', ['owner', 'admin', 'editor'])
                        .in('unit', uniqueUnits);
                    if (unitRoleErr) { res.status(500).json({ error: unitRoleErr.message }); return; }
                    myRoles.push(...((unitRoleRows ?? []) as RoleRow[]));
                }
            }

            // Fetch project records and annotate
            let rolesQuery = supabase
                .from('cardano_projects')
                .select('*')
                .in('id', editableProjectIds);
            if (activeFilter !== undefined) rolesQuery = rolesQuery.eq('is_active', activeFilter);
            const { data: roleProjectsData, error: rolesErr } = await rolesQuery as unknown as { data: ProjectRecord[] | null; error: { message: string } | null };
            if (rolesErr) { res.status(500).json({ error: rolesErr.message }); return; }
            const roleProjects = roleProjectsData ?? [];

            const rolePriority: Array<'owner' | 'admin' | 'editor'> = ['owner', 'admin', 'editor'];
            const roleByProject = new Map<string, 'owner' | 'admin' | 'editor'>();
            for (const r of myRoles) {
                const current = roleByProject.get(r.project_id);
                if (!current || rolePriority.indexOf(r.role) < rolePriority.indexOf(current)) {
                    roleByProject.set(r.project_id, r.role);
                }
            }

            const annotated = roleProjects.map((p) => ({
                ...p,
                my_role: roleByProject.get(p.id) ?? null,
                can_edit: roleByProject.has(p.id),
            }));

            const merged = annotated.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
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
            .insert({ slug, name, description: description ?? null, url, icon_url: icon_url ?? null, category: category ?? null, is_active: is_active ?? true, config: normalizedConfig })
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
        // Also create an owner role for creator
        try {
            const created = data as ProjectRecord;
            await supabase
                .from('cardano_project_roles')
                .insert({ project_id: created.id, role: 'owner', principal_type: 'wallet', wallet_payment_address: address, stake_address: await resolveStakeAddress(address).catch(() => null), added_by_address: address });
        } catch { }
        res.status(201).json({ project: data });
        return;
    }

    if (req.method === 'PUT') {
        const { id, ...rest } = req.body as Partial<ProjectRecord> & { id?: string } & { config?: unknown };
        if (!id) { res.status(400).json({ error: 'id is required' }); return; }
        const { address } = getAuthContext(req);
        if (!address) { res.status(401).json({ error: 'Authentication required' }); return; }

        // Authorization: owner or listed editor can update
        // Authorization: owner or listed editor/admin can update
        let isOwner = false;
        {
            const stake = await resolveStakeAddress(address).catch(() => null);
            let q = supabase
                .from('cardano_project_roles')
                .select('project_id')
                .eq('project_id', id)
                .eq('role', 'owner')
                .eq('principal_type', 'wallet');
            q = stake
                ? q.or(`wallet_payment_address.eq.${address},stake_address.eq.${stake}`)
                : q.eq('wallet_payment_address', address);
            const { data: ownerRole, error: ownerErr } = await q.limit(1).maybeSingle();
            isOwner = !ownerErr && !!ownerRole;
        }
        let isEditor = false;
        if (!isOwner) {
            // Use roles table for editor/admin authorization
            let roleQuery = supabase
                .from('cardano_project_roles')
                .select('project_id')
                .eq('project_id', id)
                .in('role', ['admin', 'editor']);
            // Match by wallet addresses if present
            const stake = await resolveStakeAddress(address).catch(() => null);
            const ors2: string[] = [`wallet_payment_address.eq.${address}`];
            if (stake) ors2.push(`stake_address.eq.${stake}`);
            if (isStakeAddress(address)) {
                const payFromStake = await resolveFirstPaymentAddress(address).catch(() => null);
                if (payFromStake) ors2.push(`wallet_payment_address.eq.${payFromStake}`);
            }
            roleQuery = roleQuery.or(ors2.join(','));
            const { data: roleWallet, error: roleWalletErr } = await roleQuery.limit(1).maybeSingle();
            if (!roleWalletErr && roleWallet) isEditor = true;
        }
        if (!isOwner && !isEditor) { res.status(403).json({ error: 'Not authorized to edit this project' }); return; }

        type UpdatableKeys = 'slug' | 'name' | 'description' | 'url' | 'icon_url' | 'category' | 'is_active' | 'config';
        const update: Partial<Record<UpdatableKeys, unknown>> = {};
        const allowed: UpdatableKeys[] = ['slug', 'name', 'description', 'url', 'icon_url', 'category', 'is_active', 'config'];
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

        // Only owner can delete the project
        let isOwnerDel = false;
        {
            const stake = await resolveStakeAddress(address).catch(() => null);
            let q = supabase
                .from('cardano_project_roles')
                .select('project_id')
                .eq('project_id', id)
                .eq('role', 'owner')
                .eq('principal_type', 'wallet');
            q = stake
                ? q.or(`wallet_payment_address.eq.${address},stake_address.eq.${stake}`)
                : q.eq('wallet_payment_address', address);
            const { data: ownerRole, error: ownerErr2 } = await q.limit(1).maybeSingle();
            isOwnerDel = !ownerErr2 && !!ownerRole;
        }
        if (!isOwnerDel) { res.status(403).json({ error: 'Only owner can delete the project' }); return; }

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


