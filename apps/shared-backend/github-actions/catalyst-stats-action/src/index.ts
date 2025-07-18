#!/usr/bin/env node

// —— Config from env / GitHub Action inputs ——
const PROJECT_IDS = process.env['INPUT_PROJECT_IDS']

// Debug logging
console.log('🔍 Environment variables:')
console.log(`  INPUT_PROJECT_IDS: ${process.env['INPUT_PROJECT_IDS']}`)
console.log('📊 Resolved values:')
console.log(`  PROJECT_IDS: ${PROJECT_IDS}`)

// Netlify function configuration - hardcoded URLs
const triggerUrl = 'https://glittering-chebakia-09bd42.netlify.app/.netlify/functions/catalyst-proposals-background'

// Validate required inputs 
if (!PROJECT_IDS) {
  console.error('❌ INPUT_PROJECT_IDS must be set')
  process.exit(1)
}

// Validate project IDs format
function validateProjectIds(projectIds: string): boolean {
  if (!projectIds.trim()) {
    console.error('❌ PROJECT_IDS cannot be empty or whitespace only')
    return false
  }

  const ids = projectIds.split(',').map(id => id.trim()).filter(id => id.length > 0)

  if (ids.length === 0) {
    console.error('❌ PROJECT_IDS must contain at least one valid project ID')
    return false
  }

  // Check if each ID is a valid number
  const invalidIds = ids.filter(id => !/^\d+$/.test(id))

  if (invalidIds.length > 0) {
    console.error(`❌ Invalid project IDs found: ${invalidIds.join(', ')}`)
    console.error('❌ Project IDs must be numbers only')
    return false
  }

  console.log(`✅ Validated ${ids.length} project ID(s): ${ids.join(', ')}`)
  return true
}

if (!validateProjectIds(PROJECT_IDS)) {
  process.exit(1)
}

// Helper function to make HTTP requests
async function makeRequest(url: string, options: any = {}): Promise<any> {
  try {
    console.log(`🌐 Making request to: ${url}`)
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
      const data = JSON.parse(text)
      console.log(`📊 Response data: ${JSON.stringify(data, null, 2)}`)
      return data
    } catch (parseError) {
      console.log(`⚠️  Non-JSON response received: ${text.substring(0, 200)}...`)
      return { success: true, message: 'Non-JSON response', raw: text }
    }
  } catch (error) {
    console.error(`❌ Request failed: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

async function main(): Promise<void> {
  // PROJECT_IDS is guaranteed to be defined here due to the validation check above
  const projectIds = PROJECT_IDS!

  console.log(`🚀 Starting Catalyst stats collection for projects: ${projectIds}`)

  // Trigger the background function
  console.log('📡 Triggering background function...')
  console.log(`🌐 Trigger URL: ${triggerUrl}`)
  console.log(`📦 Project IDs: ${projectIds}`)

  try {
    // Send project IDs as query parameters instead of request body
    const triggerUrlWithParams = `${triggerUrl}?projectIds=${encodeURIComponent(projectIds)}`
    console.log(`🌐 Trigger URL with params: ${triggerUrlWithParams}`)

    const functionResponse = await makeRequest(triggerUrlWithParams, {
      method: 'POST'
    })

    console.log('✅ Background function triggered successfully')
    console.log(`📊 Function response: ${JSON.stringify(functionResponse, null, 2)}`)

    // If the response indicates success (even if it's not JSON), continue with polling
    if (functionResponse.success !== false) {
      console.log('✅ Background function appears to have been triggered successfully')
    }
  } catch (error) {
    console.error('❌ Failed to trigger background function:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  console.log('🎉 Action completed successfully - background function has been triggered')
}

main().catch(err => {
  console.error('❌ Fatal error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
