#!/usr/bin/env node

// —— Config from env / GitHub Action inputs ——
const GUILD_ID = process.env.GUILD_ID
const BACKFILL = process.env.BACKFILL
const BACKFILL_YEAR = process.env.BACKFILL_YEAR
const DISCORD_TOKEN = process.env.DISCORD_TOKEN

// Debug logging
console.log('🔍 Environment variables:')
console.log(`  GUILD_ID: ${process.env.GUILD_ID}`)
console.log(`  BACKFILL: ${process.env.BACKFILL}`)
console.log(`  BACKFILL_YEAR: ${process.env.BACKFILL_YEAR}`)
console.log(`  DISCORD_TOKEN: ${DISCORD_TOKEN ? '[REDACTED]' : '(not provided)'}`)

// Input validation function
function validateInputs() {
  const errors = []

  // Validate GUILD_ID
  if (!GUILD_ID) {
    errors.push('GUILD_ID is required but not provided')
  } else if (typeof GUILD_ID !== 'string' || GUILD_ID.trim() === '') {
    errors.push('GUILD_ID must be a non-empty string')
  } else if (!/^\d+$/.test(GUILD_ID.trim())) {
    errors.push('GUILD_ID must be a valid numeric Discord guild ID')
  }

  // Validate BACKFILL
  if (BACKFILL !== undefined && BACKFILL !== null && BACKFILL !== '') {
    if (BACKFILL !== 'true' && BACKFILL !== 'false') {
      errors.push('BACKFILL must be either "true" or "false"')
    }
  }

  // Validate BACKFILL_YEAR
  if (BACKFILL_YEAR !== undefined && BACKFILL_YEAR !== null && BACKFILL_YEAR !== '') {
    const year = Number(BACKFILL_YEAR)
    if (isNaN(year)) {
      errors.push('BACKFILL_YEAR must be a valid number')
    } else if (year < 2020 || year > new Date().getFullYear() + 1) {
      errors.push(`BACKFILL_YEAR must be between 2020 and ${new Date().getFullYear() + 1}`)
    }
  }

  return errors
}

// Parse and validate inputs
const validationErrors = validateInputs()

if (validationErrors.length > 0) {
  console.error('❌ Input validation failed:')
  validationErrors.forEach(error => console.error(`  - ${error}`))
  process.exit(1)
}

// Parse validated inputs with defaults
const parsedBackfill = BACKFILL === 'true'
const parsedBackfillYear = BACKFILL_YEAR ? Number(BACKFILL_YEAR) : new Date().getFullYear()

console.log('📊 Resolved values:')
console.log(`  GUILD_ID: ${GUILD_ID}`)
console.log(`  BACKFILL: ${parsedBackfill}`)
console.log(`  BACKFILL_YEAR: ${parsedBackfillYear}`)

// Netlify function configuration - hardcoded URL
const NETLIFY_FUNCTION_URL = 'https://glittering-chebakia-09bd42.netlify.app/.netlify/functions/discord-stats-background'

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

// Main function
async function main() {
  console.log(`🚀 Starting Discord stats collection for guild: ${GUILD_ID}`)

  // Trigger the Netlify background function
  console.log('📡 Triggering Netlify background function...')

  const functionUrl = new URL(NETLIFY_FUNCTION_URL)
  functionUrl.searchParams.set('guildId', GUILD_ID)
  functionUrl.searchParams.set('backfill', parsedBackfill.toString())
  functionUrl.searchParams.set('year', parsedBackfillYear.toString())
  if (DISCORD_TOKEN && DISCORD_TOKEN.trim() !== '') {
    functionUrl.searchParams.set('analyticsToken', DISCORD_TOKEN)
    console.log('🔑 analyticsToken will be sent to the background function')
  }

  console.log(`🌐 Calling URL: ${functionUrl.toString()}`)

  try {
    const functionResponse = await makeRequest(functionUrl.toString(), {
      method: 'GET'
    })

    console.log('✅ Background function triggered successfully')
    console.log(`📊 Response: ${JSON.stringify(functionResponse, null, 2)}`)

    // If the response indicates success (even if it's not JSON), we're done
    if (functionResponse.success !== false) {
      console.log('✅ Background function appears to have been triggered successfully')
      console.log('🎉 Discord stats collection initiated - the background function will handle the rest')
      process.exit(0)
    } else {
      console.error('❌ Background function returned an error')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Failed to trigger background function:', error.message)
    process.exit(1)
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Fatal error:', error.message)
  process.exit(1)
})