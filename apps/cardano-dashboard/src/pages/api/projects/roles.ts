import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';
import { isStakeAddress, resolveStakeAddress, resolveFirstPaymentAddress, fetchUnitsByStakeOrAddress } from '@/utils/address';

type RoleRow = {
    id: string;
    project_id: string;
    role: 'owner' | 'admin' | 'editor';
    principal_type: 'wallet' | 'nft_unit';
    wallet_payment_address: string | null;
    stake_address: string | null;
    unit?: string | null;
    txhash: string | null;
    added_by_address: string;
    created_at: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
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
    const normRole = (v: unknown): 'owner' | 'admin' | 'editor' | null => (v === 'owner' || v === 'admin' || v === 'editor') ? v : null;
    const normUnit = (v: unknown): string | null => {
        if (typeof v !== 'string') return null;
        const s = v.trim().toLowerCase();
        // policyId(56 hex) + assetNameHex(>=2, <=128 hex)
        return /^[0-9a-f]{58,200}$/.test(s) ? s : null;
    };

    // Ignore client-provided units for security; always derive server-side
    const deriveUnits = async (): Promise<string[]> => {
        // Prefer stake if available, otherwise use cookie address
        const stake = await getCallerStake();
        return fetchUnitsByStakeOrAddress(stake || address);
    };

    const getCallerStake = async (): Promise<string | null> => {
        try { return await resolveStakeAddress(address); } catch { return null; }
    };

    const isOwner = async (project_id: string): Promise<boolean> => {
        const stake = await getCallerStake();
        // Owner via wallet/stake
        {
            let q = supabase
                .from('cardano_project_roles')
                .select('project_id')
                .eq('project_id', project_id)
                .eq('role', 'owner')
                .eq('principal_type', 'wallet');
            const ors: string[] = [`wallet_payment_address.eq.${address}`];
            if (stake) ors.push(`stake_address.eq.${stake}`);
            if (isStakeAddress(address)) {
                const paymentForStake = await resolveFirstPaymentAddress(address).catch(() => null);
                if (paymentForStake) ors.push(`wallet_payment_address.eq.${paymentForStake}`);
            }
            q = q.or(ors.join(','));
            const { data, error } = await q.limit(1).maybeSingle();
            if (!error && data) return true;
        }
        // Owner via NFT unit
        const providedUnits = await deriveUnits();
        if (providedUnits.length > 0) {
            const { data, error } = await supabase
                .from('cardano_project_roles')
                .select('project_id')
                .eq('project_id', project_id)
                .eq('role', 'owner')
                .eq('principal_type', 'nft_unit')
                .in('unit', providedUnits)
                .limit(1)
                .maybeSingle();
            if (!error && data) return true;
        }
        return false;
    };

    const isAdmin = async (project_id: string): Promise<boolean> => {
        // Wallet/stake-based admin
        const stake = await getCallerStake();
        let walletAdmin = false;
        {
            let q = supabase
                .from('cardano_project_roles')
                .select('project_id')
                .eq('project_id', project_id)
                .eq('role', 'admin')
                .eq('principal_type', 'wallet');
            const ors: string[] = [`wallet_payment_address.eq.${address}`];
            if (stake) ors.push(`stake_address.eq.${stake}`);
            if (isStakeAddress(address)) {
                const paymentForStake = await resolveFirstPaymentAddress(address).catch(() => null);
                if (paymentForStake) ors.push(`wallet_payment_address.eq.${paymentForStake}`);
            }
            q = q.or(ors.join(','));
            const { data: row, error } = await q.limit(1).maybeSingle();
            walletAdmin = !error && !!row;
        }
        if (walletAdmin) return true;
        // NFT unit-based admin
        const providedUnits = await deriveUnits();
        if (providedUnits.length > 0) {
            const { data: row, error } = await supabase
                .from('cardano_project_roles')
                .select('project_id')
                .eq('project_id', project_id)
                .eq('role', 'admin')
                .eq('principal_type', 'nft_unit')
                .in('unit', providedUnits)
                .limit(1)
                .maybeSingle();
            if (!error && !!row) return true;
        }
        return false;
    };

    const assertOwnerOrAdmin = async (project_id: string): Promise<{ ok: true; as: 'owner' | 'admin' } | { ok: false; error: string }> => {
        if (await isOwner(project_id)) return { ok: true, as: 'owner' };
        if (await isAdmin(project_id)) return { ok: true, as: 'admin' };
        return { ok: false, error: 'Not authorized to manage roles' };
    };

    if (req.method === 'GET') {
        const { project_id } = req.query as { project_id?: string };
        if (!project_id || !isUuid(project_id)) { res.status(400).json({ error: 'Invalid project_id' }); return; }
        const auth = await assertOwnerOrAdmin(project_id);
        if (!auth.ok) { res.status(403).json({ error: auth.error }); return; }
        const { data, error } = await supabase
            .from('cardano_project_roles')
            .select('*')
            .eq('project_id', project_id) as unknown as { data: RoleRow[] | null; error: { message: string } | null };
        if (error) { res.status(500).json({ error: error.message }); return; }
        res.status(200).json({ roles: data ?? [] });
        return;
    }

    if (req.method === 'POST') {
        const body = req.body as { project_id?: string; role?: string; principal_type?: string; wallet_address?: string; unit?: string; txhash?: string };
        const project_id = body?.project_id;
        const role = normRole(body?.role);
        const principal_type = body?.principal_type === 'wallet' || body?.principal_type === 'nft_unit' ? body.principal_type : null;
        if (!project_id || !isUuid(project_id) || !role || !principal_type) { res.status(400).json({ error: 'Invalid input' }); return; }

        const auth = await assertOwnerOrAdmin(project_id);
        if (!auth.ok) { res.status(403).json({ error: auth.error }); return; }
        // Admins can only assign editor roles
        if (auth.as === 'admin' && role !== 'editor') { res.status(403).json({ error: 'Admins may only assign editor roles' }); return; }
        // Only owners may assign owner roles
        if (role === 'owner' && auth.as !== 'owner') { res.status(403).json({ error: 'Only owners may assign owner roles' }); return; }

        const normTxHash = (v: unknown): string | null => {
            if (typeof v !== 'string') return null;
            const s = v.trim().toLowerCase();
            return /^[0-9a-f]{64}$/.test(s) ? s : null;
        };
        const txhash = normTxHash(body?.txhash);

        let payload: Partial<RoleRow> & { project_id: string; role: 'owner' | 'admin' | 'editor'; principal_type: 'wallet' | 'nft_unit' } = {
            project_id,
            role,
            principal_type,
        };

        if (principal_type === 'wallet') {
            const provided = normAddr(body?.wallet_address);
            if (!provided) { res.status(400).json({ error: 'Invalid wallet_address' }); return; }
            let wallet_payment_address = provided;
            let stake: string | null = null;
            if (isStakeAddress(provided)) {
                stake = provided;
                const payment = await resolveFirstPaymentAddress(provided);
                if (!payment) { res.status(400).json({ error: 'Could not resolve a payment address for stake' }); return; }
                wallet_payment_address = payment;
            } else {
                stake = await resolveStakeAddress(provided);
            }
            payload = { ...payload, wallet_payment_address, stake_address: stake ?? null, txhash: txhash ?? null };
        } else {
            const unit = normUnit(body?.unit);
            if (!unit) { res.status(400).json({ error: 'Invalid unit' }); return; }
            payload = { ...payload, unit, txhash: txhash ?? null };
        }

        const { data, error } = await supabase
            .from('cardano_project_roles')
            .upsert({ ...payload, added_by_address: address })
            .select('*')
            .single();
        if (error) { res.status(500).json({ error: error.message }); return; }
        res.status(201).json({ role: data });
        return;
    }

    if (req.method === 'DELETE') {
        const { project_id, role, principal_type, wallet_address, unit } = req.query as { project_id?: string; role?: string; principal_type?: string; wallet_address?: string; unit?: string };
        if (!project_id || !isUuid(project_id)) { res.status(400).json({ error: 'Invalid project_id' }); return; }
        const auth = await assertOwnerOrAdmin(project_id);
        if (!auth.ok) { res.status(403).json({ error: auth.error }); return; }
        const normRoleVal = normRole(role);
        const principal = principal_type === 'wallet' || principal_type === 'nft_unit' ? principal_type : null;
        if (!normRoleVal || !principal) { res.status(400).json({ error: 'Invalid role or principal_type' }); return; }
        // Admins can only remove editor roles
        if (auth.as === 'admin' && normRoleVal !== 'editor') { res.status(403).json({ error: 'Admins may only remove editor roles' }); return; }
        // Only owners may remove owner roles
        if (normRoleVal === 'owner' && auth.as !== 'owner') { res.status(403).json({ error: 'Only owners may remove owner roles' }); return; }

        let q = supabase.from('cardano_project_roles').delete().eq('project_id', project_id).eq('role', normRoleVal).eq('principal_type', principal);
        if (principal === 'wallet') {
            const provided = normAddr(wallet_address);
            if (!provided) { res.status(400).json({ error: 'Invalid wallet_address' }); return; }
            if (isStakeAddress(provided)) {
                q = q.eq('stake_address', provided);
            } else {
                q = q.eq('wallet_payment_address', provided);
            }
        } else {
            const u = normUnit(unit);
            if (!u) { res.status(400).json({ error: 'Invalid unit' }); return; }
            q = q.eq('unit', u);
        }
        const { error } = await q;
        if (error) { res.status(500).json({ error: error.message }); return; }
        res.status(204).end();
        return;
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    res.status(405).json({ error: 'Method Not Allowed' });
}


