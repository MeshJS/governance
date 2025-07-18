// netlify/functions/discord-stats-background.mts
import type { Context } from '@netlify/functions'
import { config as dotenv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fetchDiscordStats } from '../../lib/discord/fetchStats.js'
// Type-only import for fetchDiscordStatsViaApi to satisfy TypeScript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { fetchDiscordStatsViaApi } from '../../lib/discord/getStatsViaApi.js'

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
  const analyticsToken = url.searchParams.get('analyticsToken') || ''

  // Use analyticsToken from query if provided, else fall back to env
  // For bot-based fetcher, always use process.env.DISCORD_TOKEN
  const botToken: string = token || ''

  if ((!botToken && !analyticsToken) || !guildId) {
    const missing = []
    if (!botToken && !analyticsToken) missing.push('DISCORD_TOKEN or analyticsToken')
    if (!guildId) missing.push('guildId')
    return new Response(
      JSON.stringify({ error: `Missing required parameter(s): ${missing.join(', ')}` }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // First, check if there are existing stats for this guild
    const { data: existingData, error: fetchError } = await supabase
      .from('discord_stats')
      .select('stats')
      .eq('guild_id', guildId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('❌ Failed to fetch existing stats:', fetchError)
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch existing stats',
          details: fetchError.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch new Discord stats using the appropriate method
    let newStats
    if (analyticsToken) {
      console.log('📡 Using API-based Discord stats fetcher (getStatsViaApi.js)')
      newStats = await fetchDiscordStatsViaApi({
        guildId,
        token: analyticsToken,
        backfill,
        backfillYear
      })
    } else {
      console.log('🤖 Using bot-based Discord stats fetcher (fetchStats.ts)')
      newStats = await fetchDiscordStats({
        token: botToken,
        guildId,
        backfill,
        backfillYear
      })
    }

    // Merge with existing stats if they exist
    let mergedStats = newStats
    if (existingData && existingData.stats) {
      console.log('📊 Found existing stats, merging with new data...')
      mergedStats = { ...existingData.stats, ...newStats }

      // Log what's being merged
      const existingMonths = Object.keys(existingData.stats)
      const newMonths = Object.keys(newStats)
      const addedMonths = newMonths.filter(month => !existingMonths.includes(month))
      const updatedMonths = newMonths.filter(month => existingMonths.includes(month))

      console.log(`📈 Existing months: ${existingMonths.length}`)
      console.log(`🆕 New months being added: ${addedMonths.length} (${addedMonths.join(', ')})`)
      console.log(`🔄 Months being updated: ${updatedMonths.length} (${updatedMonths.join(', ')})`)
    } else {
      console.log('🆕 No existing stats found, creating new record...')
    }

    // Prepare data for Supabase
    const supabaseData = {
      guild_id: guildId,
      updated_at: new Date().toISOString(),
      stats: mergedStats
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
        new_stats: newStats,
        merged_stats: mergedStats,
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
