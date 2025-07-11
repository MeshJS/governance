import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_PUBLIC

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_PUBLIC environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { guildId, since } = req.query

    if (!guildId) {
        return res.status(400).json({
            error: 'Missing guildId parameter'
        })
    }

    // Ensure guildId is a string (Next.js query params can be string | string[] | number)
    const guildIdString = Array.isArray(guildId) ? guildId[0] : String(guildId)

    try {
        // Build query to get the stats for the guild (there's only one record per guild_id)
        let query = supabase
            .from('discord_stats')
            .select('*')
            .eq('guild_id', guildIdString)

        // If 'since' parameter is provided, only return results updated after that timestamp
        if (since) {
            const sinceDate = new Date(since as string)
            if (!isNaN(sinceDate.getTime())) {
                query = query.gt('updated_at', sinceDate.toISOString())
            }
        }

        // Get the single record
        const { data, error } = await query.single()

        if (error) {
            // Handle the case where no record exists for this guild
            if (error.code === 'PGRST116') {
                return res.status(200).json({
                    status: 'pending',
                    message: 'No stats found for this guild',
                    hasData: false,
                    lastUpdated: null
                })
            }

            console.error('❌ Failed to query Supabase:', error)
            return res.status(500).json({
                error: 'Failed to query database',
                details: error.message
            })
        }

        // We have the single record for this guild
        const stats = data
        const lastUpdated = new Date(stats.updated_at)
        const now = new Date()
        const timeDiff = now.getTime() - lastUpdated.getTime()
        const isRecent = timeDiff < 5 * 60 * 1000 // Consider "recent" if updated within last 5 minutes

        return res.status(200).json({
            status: isRecent ? 'completed' : 'stale',
            message: isRecent ? 'Stats are up to date' : 'Stats may be outdated',
            hasData: true,
            lastUpdated: stats.updated_at,
            stats: stats.stats,
            guildId: stats.guild_id,
            isRecent,
            timeSinceUpdate: Math.floor(timeDiff / 1000) // seconds
        })
    } catch (err) {
        console.error('❌ Failed to check status:', err)
        return res.status(500).json({
            error: 'Internal Server Error',
            details: err instanceof Error ? err.message : 'Unknown error'
        })
    }
} 