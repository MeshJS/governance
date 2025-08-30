import { NextApiRequest, NextApiResponse } from 'next';

interface RepoStats {
  name: string;
  stars: number;
  forks: number;
  full_name: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const org = req.query.org as string;
    const repos = req.query.repos as string; // comma-separated repo names

    if (!org || !repos) {
      return res.status(400).json({ error: 'Missing org or repos parameter' });
    }

    const repoNames = repos.split(',').map(name => name.trim());
    const repoStats: RepoStats[] = [];

    for (const repoName of repoNames) {
      try {
        const response = await fetch(`https://api.github.com/repos/${org}/${repoName}`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'mesh-gov-app',
            ...(process.env.GITHUB_TOKEN && { Authorization: `token ${process.env.GITHUB_TOKEN}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          repoStats.push({
            name: repoName,
            full_name: data.full_name,
            stars: data.stargazers_count || 0,
            forks: data.forks_count || 0,
          });
        } else {
          // If repo not found or error, add with 0 values
          repoStats.push({
            name: repoName,
            full_name: `${org}/${repoName}`,
            stars: 0,
            forks: 0,
          });
        }
      } catch (error) {
        console.error(`Error fetching stats for ${repoName}:`, error);
        repoStats.push({
          name: repoName,
          full_name: `${org}/${repoName}`,
          stars: 0,
          forks: 0,
        });
      }
    }

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({ repoStats });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
