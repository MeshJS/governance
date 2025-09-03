import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/utils/supabaseServer';

type ContributorActivityRecord = {
    contributor_id: number;
    login: string;
    repo_id: number;
    repo_name: string;
    year: number;
    commit_count: number;
    pr_count: number;
    first_activity_at: string;
    last_activity_at: string;
    commit_timestamps: string[];
    pr_timestamps: string[];
};

type ProjectContributorActivity = {
    project_id: string;
    project_name: string;
    org_name: string;
    contributor_activity: ContributorActivityRecord[];
};

type ProjectData = {
    id: string;
    name: string;
    config: unknown;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const supabase = getSupabaseServerClient();

    try {
        // Get projects data from request body
        const { projects } = req.body as { projects: ProjectData[] };

        console.log('Contributor activity API called with projects:', projects?.length || 0);

        if (!projects || !Array.isArray(projects) || projects.length === 0) {
            console.log('No projects provided, returning empty array');
            res.status(200).json({ projects: [] });
            return;
        }

        const results: ProjectContributorActivity[] = [];

        for (const project of projects) {
            const config = project.config as { mainOrganization?: { name?: string } } | null;
            const mainOrg = config?.mainOrganization;

            console.log(`Processing project "${project.name}" (ID: ${project.id}):`, {
                hasConfig: !!config,
                hasMainOrg: !!mainOrg,
                orgName: mainOrg?.name
            });

            if (!mainOrg?.name) {
                console.log(`Skipping project "${project.name}" - no organization info`);
                continue; // Skip projects without organization info
            }

            const orgName = mainOrg.name;

            // Get GitHub organization by login
            const { data: githubOrg, error: orgError } = await supabase
                .from('github_orgs')
                .select('id, login')
                .eq('login', orgName)
                .single();

            console.log(`Looking for GitHub org "${orgName}":`, { githubOrg, orgError });

            if (orgError || !githubOrg) {
                console.warn(`GitHub organization not found: ${orgName}`, orgError);
                continue;
            }

            // Get all repositories for this organization
            const { data: repos, error: reposError } = await supabase
                .from('github_repos')
                .select('id, name')
                .eq('org_id', githubOrg.id);

            if (reposError || !repos || repos.length === 0) {
                console.warn(`No repositories found for organization: ${orgName}`);
                continue;
            }

            const repoIds = repos.map(repo => repo.id);

            // Get contributor activity for all repos in this org
            const { data: contributorActivity, error: activityError } = await supabase
                .from('contributor_activity_yearly_mat')
                .select('*')
                .in('repo_id', repoIds)
                .order('year', { ascending: false })
                .order('commit_count', { ascending: false })
                .order('pr_count', { ascending: false });

            if (activityError) {
                console.error(`Error fetching contributor activity for ${orgName}:`, activityError);
                continue;
            }

            results.push({
                project_id: project.id,
                project_name: project.name,
                org_name: orgName,
                contributor_activity: contributorActivity || []
            });
        }

        console.log(`Contributor activity API returning ${results.length} projects with data`);
        res.status(200).json({ projects: results });

    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
