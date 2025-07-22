import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const orgLogin = req.query.org as string | undefined;
        let query = supabase.from('github_repos').select('*');
        if (orgLogin) {
            // First, get the org id for the given login
            const { data: orgs, error: orgError } = await supabase
                .from('github_orgs')
                .select('id')
                .eq('login', orgLogin);
            if (orgError) throw new Error(orgError.message);
            if (!orgs || orgs.length === 0) {
                return res.status(404).json({ error: 'Organization not found' });
            }
            const orgId = orgs[0].id;
            query = query.eq('org_id', orgId);
        }
        const { data: repos, error } = await query;
        if (error) throw new Error(error.message);
        return res.status(200).json({ repos });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 