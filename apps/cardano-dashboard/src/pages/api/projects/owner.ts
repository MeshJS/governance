import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';
import { getAuthContext } from '@/utils/apiAuth';
import { resolveStakeAddress, isStakeAddress, resolveFirstPaymentAddress } from '@/utils/address';

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

    // Verify caller is current owner via roles table
    const callerStake = await resolveStakeAddress(address).catch(() => null);
    {
        const q = supabase
            .from('cardano_project_roles')
            .select('project_id')
            .eq('project_id', project_id!)
            .eq('role', 'owner')
            .eq('principal_type', 'wallet');
        const ors: string[] = [`wallet_payment_address.eq.${address}`];
        if (callerStake) ors.push(`stake_address.eq.${callerStake}`);
        if (isStakeAddress(address)) {
            const paymentForStake = await resolveFirstPaymentAddress(address).catch(() => null);
            if (paymentForStake) ors.push(`wallet_payment_address.eq.${paymentForStake}`);
        }
        const q2 = q.or(ors.join(','));
        const { data: ownerRow, error: ownerErr } = await q2.limit(1).maybeSingle();
        if (ownerErr || !ownerRow) { res.status(403).json({ error: 'Only owner can transfer ownership' }); return; }
    }

    if (address === nextOwner) {
        res.status(400).json({ error: 'New owner is the same as current owner' });
        return;
    }

    // Insert owner role for next owner (wallet principal)
    let wallet_payment_address = nextOwner;
    let stake: string | null = null;
    if (isStakeAddress(nextOwner)) {
        stake = nextOwner;
        const payment = await resolveFirstPaymentAddress(nextOwner);
        if (!payment) { res.status(400).json({ error: 'Could not resolve a payment address for stake' }); return; }
        wallet_payment_address = payment;
    } else {
        stake = await resolveStakeAddress(nextOwner);
    }
    const { data, error } = await supabase
        .from('cardano_project_roles')
        .upsert({ project_id: project_id!, role: 'owner', principal_type: 'wallet', wallet_payment_address, stake_address: stake ?? null, added_by_address: address })
        .select('id, project_id, role, principal_type, wallet_payment_address, stake_address')
        .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ role: data });
    return;
}


