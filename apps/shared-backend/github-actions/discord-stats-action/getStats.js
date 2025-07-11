#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

// —— Config from env / GitHub Action inputs ——
const GUILD_ID = process.env.GUILD_ID

const OUTPUT_FILE =
  process.env.OUTPUT_FILE ||
  path.resolve(process.cwd(), 'data/discord-stats/stats.json')

const BACKFILL = (process.env.BACKFILL || 'false') === 'true'
const BACKFILL_YEAR = Number(process.env.BACKFILL_YEAR) || new Date().getFullYear()

// Debug logging
console.log('🔍 Environment variables:')
console.log(`  GUILD_ID: ${process.env.GUILD_ID}`)
console.log(`  OUTPUT_FILE: ${process.env.OUTPUT_FILE}`)
console.log(`  BACKFILL: ${process.env.BACKFILL}`)
console.log(`  BACKFILL_YEAR: ${process.env.BACKFILL_YEAR}`)
console.log('📊 Resolved values:')
console.log(`  GUILD_ID: ${GUILD_ID}`)
console.log(`  OUTPUT_FILE: ${OUTPUT_FILE}`)
console.log(`  BACKFILL: ${BACKFILL}`)
console.log(`  BACKFILL_YEAR: ${BACKFILL_YEAR}`)

// Netlify function configuration - hardcoded URLs
const NETLIFY_FUNCTION_URL = 'https://glittering-chebakia-09bd42.netlify.app/.netlify/functions/discord-stats-background'
const API_ROUTE_URL = 'https://glittering-chebakia-09bd42.netlify.app/api/discord/status'

// Validate required inputs 
if (!GUILD_ID) {
  console.error('❌ GUILD_ID (or INPUT_GUILD_ID) must be set')
  process.exit(1)
}

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Check if response has content
    const contentType = response.headers.get('content-type')
    const text = await response.text()

    if (!text || text.trim() === '') {
      console.log('⚠️  Empty response received')
      return { success: true, message: 'Empty response' }
    }

    // Try to parse as JSON, but handle non-JSON responses gracefully
    try {
      return JSON.parse(text)
    } catch (parseError) {
      console.log(`⚠️  Non-JSON response received: ${text.substring(0, 200)}...`)
      return { success: true, message: 'Non-JSON response', raw: text }
    }
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`)
    throw error
  }
}

// Helper function to wait
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Main function
async function main() {
  console.log(`🚀 Starting Discord stats collection for guild: ${GUILD_ID}`)

  // Step 1: Trigger the Netlify background function
  console.log('📡 Triggering Netlify background function...')

  const functionUrl = new URL(NETLIFY_FUNCTION_URL)
  functionUrl.searchParams.set('guildId', GUILD_ID)
  functionUrl.searchParams.set('backfill', BACKFILL.toString())
  functionUrl.searchParams.set('year', BACKFILL_YEAR.toString())

  console.log(`🌐 Calling URL: ${functionUrl.toString()}`)

  try {
    const functionResponse = await makeRequest(functionUrl.toString(), {
      method: 'GET'
    })

    console.log('✅ Background function triggered successfully')
    console.log(`📊 Response: ${JSON.stringify(functionResponse, null, 2)}`)

    // If the response indicates success (even if it's not JSON), continue with polling
    if (functionResponse.success !== false) {
      console.log('✅ Background function appears to have been triggered successfully')
    }
  } catch (error) {
    console.error('❌ Failed to trigger background function:', error.message)
    process.exit(1)
  }

  // Step 2: Poll the API route to check for results
  console.log('⏳ Polling for results...')

  const maxAttempts = 60 // 5 minutes with 5-second intervals
  const pollInterval = 5000 // 5 seconds
  let staleData = null
  let staleAttempt = 0
  const maxStaleAttempts = 36 // 3 minutes with 5-second intervals

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔄 Polling attempt ${attempt}/${maxAttempts}...`)

    try {
      const apiUrl = new URL(API_ROUTE_URL)
      apiUrl.searchParams.set('guildId', GUILD_ID)

      const statusResponse = await makeRequest(apiUrl.toString(), {
        method: 'GET'
      })

      console.log(`📊 Status: ${statusResponse.status}`)
      console.log(`📝 Message: ${statusResponse.message}`)

      if (statusResponse.status === 'completed') {
        console.log('✅ Stats collection completed!')

        // Step 3: Write the stats to the output file
        const stats = statusResponse.stats
        const outDir = path.dirname(OUTPUT_FILE)

        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true })
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stats, null, 2))
        console.log(`✅ Stats written to ${OUTPUT_FILE}`)
        console.log(`📊 Last updated: ${statusResponse.lastUpdated}`)
        console.log(`⏱️  Time since update: ${statusResponse.timeSinceUpdate} seconds`)

        process.exit(0)
      } else if (statusResponse.status === 'stale') {
        if (!staleData) {
          staleData = statusResponse
          staleAttempt = 0
          console.log('⚠️  Stats are stale, but available. Will continue polling for fresh data...')
        }

        staleAttempt++
        console.log(`⏳ Stale data found, continuing to poll for fresh data... (${staleAttempt}/${maxStaleAttempts})`)

        if (staleAttempt >= maxStaleAttempts) {
          console.log('⏰ 3 minutes elapsed with stale data, using current stale data...')

          const stats = staleData.stats
          const outDir = path.dirname(OUTPUT_FILE)

          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true })
          }

          fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stats, null, 2))
          console.log(`✅ Stats written to ${OUTPUT_FILE}`)
          console.log(`📊 Last updated: ${staleData.lastUpdated}`)
          console.log(`⏱️  Time since update: ${staleData.timeSinceUpdate} seconds`)

          process.exit(0)
        }

        await sleep(pollInterval)
      } else if (statusResponse.status === 'pending') {
        console.log('⏳ Stats are still being processed...')

        if (attempt === maxAttempts) {
          console.error('❌ Timeout: Stats collection did not complete within the expected time')
          process.exit(1)
        }

        await sleep(pollInterval)
      }
    } catch (error) {
      console.error(`❌ Polling attempt ${attempt} failed:`, error.message)

      if (attempt === maxAttempts) {
        console.error('❌ Failed to get results after all attempts')
        process.exit(1)
      }

      await sleep(pollInterval)
    }
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Fatal error:', error.message)
  process.exit(1)
})