// /pages/api/discord/engagement.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Get auth token from Authorization header, fallback to env variable
    const authHeader = req.headers.authorization;
    const DISCORD_AUTH = authHeader;

    // Get query parameters with defaults
    const { start: startParam, end: endParam, interval: intervalParam, guild_id: guildIdParam } = req.query;

    // Use provided guild_id or fallback to environment variable
    const guildId = guildIdParam as string;

    if (!guildId) {
        return res.status(400).json({ error: 'Guild ID is required. Please provide guild_id parameter or set GUILD_ID environment variable.' });
    }

    // Calculate fallback dates: start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const start = encodeURIComponent(startParam as string || startOfMonth.toISOString());
    const end = encodeURIComponent(endParam as string || endOfMonth.toISOString());
    const interval = parseInt(intervalParam as string) || 3;

    const url = `https://discord.com/api/v9/guilds/${guildId}/analytics/engagement/base?start=${start}&end=${end}&interval=${interval}`;

    try {
        // Fetch engagement data
        const response = await fetch(url, {
            headers: {
                Authorization: DISCORD_AUTH!,
                'Accept': '*/*',
            },
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ error: `Failed: ${text}` });
        }

        const data = await response.json();

        // Fetch member count from /users/@me/guilds?with_counts=true
        let memberCount: number | null = null;
        try {
            const guildsResponse = await fetch('https://discord.com/api/v9/users/@me/guilds?with_counts=true', {
                headers: {
                    Authorization: DISCORD_AUTH!,
                    'Accept': '*/*',
                },
            });
            if (guildsResponse.ok) {
                const guilds = await guildsResponse.json();
                if (Array.isArray(guilds)) {
                    const matchedGuild = guilds.find((g: any) => g.id === guildId);
                    if (matchedGuild && typeof matchedGuild.approximate_member_count === 'number') {
                        memberCount = matchedGuild.approximate_member_count;
                    }
                }
            }
        } catch (e) {
            // Ignore member count errors, just don't include it
        }

        // Add member count to each item if data is an array
        let responseData;
        if (Array.isArray(data)) {
            responseData = data.map((item: any) => ({
                ...item,
                approximate_member_count: memberCount,
            }));
        } else {
            responseData = { ...data, approximate_member_count: memberCount };
        }

        // Return engagement data + member count
        return res.status(200).json(responseData);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
