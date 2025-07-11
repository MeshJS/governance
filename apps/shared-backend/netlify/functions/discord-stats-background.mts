// netlify/functions/discord-stats-background.mts
import type { Context } from '@netlify/functions'
import { config as dotenv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fetchDiscordStats } from '../../lib/discord/fetchStats.js'

dotenv()

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async (req: Request, context: Context) => {
  const token = process.env.DISCORD_TOKEN
  const url = new URL(req.url)
  const guildId = url.searchParams.get('guildId') || ''
  const backfill = url.searchParams.get('backfill') === 'true'
  const backfillYear = parseInt(url.searchParams.get('year') || '2025', 10)

  if (!token || !guildId) {
    return new Response(
      JSON.stringify({ error: 'Missing DISCORD_TOKEN or guildId' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Fetch Discord stats
    const stats = await fetchDiscordStats({ token, guildId, backfill, backfillYear })

    // Prepare data for Supabase
    const supabaseData = {
      guild_id: guildId,
      updated_at: new Date().toISOString(),
      stats: stats
    }

    // Upsert data to Supabase (insert or update if guild_id exists)
    const { data, error } = await supabase
      .from('discord_stats')
      .upsert(supabaseData, {
        onConflict: 'guild_id'
      })

    if (error) {
      console.error('❌ Failed to save to Supabase:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to save to database',
          details: error.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Successfully saved Discord stats to Supabase')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Stats fetched and saved successfully',
        stats: stats,
        supabase_data: data
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (err) {
    console.error('❌ Failed to fetch stats:', err)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
