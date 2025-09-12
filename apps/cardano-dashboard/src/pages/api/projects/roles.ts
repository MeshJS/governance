import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';
import { isStakeAddress, resolveStakeAddress, resolveFirstPaymentAddress } from '@/utils/address';

type RoleRow = {
    id: string;
    project_id: string;
    role: 'admin' | 'editor';
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
    const normRole = (v: unknown): 'admin' | 'editor' | null => (v === 'admin' || v === 'editor') ? v : null;
    const normUnit = (v: unknown): string | null => {
        if (typeof v !== 'string') return null;
        const s = v.trim().toLowerCase();
        // policyId(56 hex) + assetNameHex(>=2, <=128 hex)
        return /^[0-9a-f]{58,200}$/.test(s) ? s : null;
    };

    // Authorization helper: only owner can manage roles
    const assertOwner = async (project_id: string): Promise<true | string> => {
        const { data: proj, error: projErr } = await supabase
            .from('cardano_projects')
            .select('owner_wallets')
            .eq('id', project_id)
            .single();
        if (projErr || !proj) return 'Project not found';
        const wallets = ((proj as { owner_wallets?: string[] | null }).owner_wallets ?? []) as string[];
        if (Array.isArray(wallets) && wallets.length > 0) {
            // consider stake mapping
            let stake: string | null = null;
            try { stake = await resolveStakeAddress(address); } catch { stake = null; }
            if (wallets.includes(address) || (stake && wallets.includes(stake))) return true;
        }
        return 'Only owner can manage roles';
    };

    if (req.method === 'GET') {
        const { project_id } = req.query as { project_id?: string };
        if (!project_id || !isUuid(project_id)) { res.status(400).json({ error: 'Invalid project_id' }); return; }
        const own = await assertOwner(project_id);
        if (own !== true) { res.status(403).json({ error: own }); return; }
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

        const own = await assertOwner(project_id);
        if (own !== true) { res.status(403).json({ error: own }); return; }

        const normTxHash = (v: unknown): string | null => {
            if (typeof v !== 'string') return null;
            const s = v.trim().toLowerCase();
            return /^[0-9a-f]{64}$/.test(s) ? s : null;
        };
        const txhash = normTxHash(body?.txhash);

        let payload: Partial<RoleRow> & { project_id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_unit' } = {
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
        const own = await assertOwner(project_id);
        if (own !== true) { res.status(403).json({ error: own }); return; }
        const normRoleVal = normRole(role);
        const principal = principal_type === 'wallet' || principal_type === 'nft_unit' ? principal_type : null;
        if (!normRoleVal || !principal) { res.status(400).json({ error: 'Invalid role or principal_type' }); return; }

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


