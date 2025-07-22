import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse comma-separated package names from query
        const namesParam = req.query.names;
        let packageQuery = supabase.from('packages').select('*');
        let names: string[] | undefined = undefined;
        if (typeof namesParam === 'string') {
            names = namesParam.split(',').map((n) => n.trim());
            if (names.length > 0) {
                packageQuery = packageQuery.in('name', names);
            }
        }

        const { data: packages, error: packagesError } = await packageQuery;
        if (packagesError) throw new Error(packagesError.message);
        if (!packages || packages.length === 0) {
            return res.status(200).json({ packages: [] });
        }

        // For each package, fetch monthly_downloads and package_stats_history
        const results = await Promise.all(
            packages.map(async (pkg) => {
                const [monthlyDownloads, statsHistory] = await Promise.all([
                    supabase
                        .from('monthly_downloads')
                        .select('*')
                        .eq('package_id', pkg.id),
                    supabase
                        .from('package_stats_history')
                        .select('*')
                        .eq('package_id', pkg.id),
                ]);
                return {
                    ...pkg,
                    monthly_downloads: monthlyDownloads.data || [],
                    package_stats_history: statsHistory.data || [],
                };
            })
        );

        return res.status(200).json({ packages: results });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 