#!/usr/bin/env node

import fetch from 'node-fetch'

// —— Config from env / GitHub Action inputs ——
const ORG = process.env.ORG
const REPO = process.env.REPO
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

// Debug logging
console.log('🔍 Environment variables:')
console.log(`  ORG: ${process.env.ORG}`)
console.log(`  REPO: ${process.env.REPO}`)
console.log(`  GITHUB_TOKEN: ${GITHUB_TOKEN ? '[REDACTED]' : '(not provided)'}`)

// Input validation function
function validateInputs() {
    const errors = []

    // Validate ORG
    if (!ORG) {
        errors.push('ORG is required but not provided')
    } else if (typeof ORG !== 'string' || ORG.trim() === '') {
        errors.push('ORG must be a non-empty string')
    } else if (!/^[a-zA-Z0-9_-]+$/.test(ORG.trim())) {
        errors.push('ORG must be a valid GitHub organization name (alphanumeric, hyphens, underscores only)')
    }

    // Validate REPO
    if (!REPO) {
        errors.push('REPO is required but not provided')
    } else if (typeof REPO !== 'string' || REPO.trim() === '') {
        errors.push('REPO must be a non-empty string')
    } else if (!/^[a-zA-Z0-9._-]+$/.test(REPO.trim())) {
        errors.push('REPO must be a valid GitHub repository name (alphanumeric, dots, hyphens, underscores only)')
    }

    // Validate GITHUB_TOKEN
    if (!GITHUB_TOKEN) {
        errors.push('GITHUB_TOKEN is required but not provided')
    } else if (typeof GITHUB_TOKEN !== 'string' || GITHUB_TOKEN.trim() === '') {
        errors.push('GITHUB_TOKEN must be a non-empty string')
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

// Parse validated inputs
const parsedOrg = ORG.trim()
const parsedRepo = REPO.trim()
const parsedGithubToken = GITHUB_TOKEN.trim()

console.log('📊 Resolved values:')
console.log(`  ORG: ${parsedOrg}`)
console.log(`  REPO: ${parsedRepo}`)

// Netlify function configuration - hardcoded URL
const NETLIFY_FUNCTION_URL = 'https://glittering-chebakia-09bd42.netlify.app/.netlify/functions/github-stats-background'

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
    console.log(`🚀 Starting GitHub stats collection for repository: ${parsedOrg}/${parsedRepo}`)

    // Trigger the Netlify background function
    console.log('📡 Triggering Netlify background function...')

    const functionUrl = new URL(NETLIFY_FUNCTION_URL)
    functionUrl.searchParams.set('org', parsedOrg)
    functionUrl.searchParams.set('repo', parsedRepo)
    functionUrl.searchParams.set('githubToken', parsedGithubToken)

    console.log(`🌐 Calling URL: ${functionUrl.toString().replace(parsedGithubToken, '[REDACTED]')}`)

    try {
        const functionResponse = await makeRequest(functionUrl.toString(), {
            method: 'GET'
        })

        console.log('✅ Background function triggered successfully')
        console.log(`📊 Response: ${JSON.stringify(functionResponse, null, 2)}`)

        // If the response indicates success (even if it's not JSON), we're done
        if (functionResponse.success !== false) {
            console.log('✅ Background function appears to have been triggered successfully')
            console.log('🎉 GitHub stats collection initiated - the background function will handle the rest')
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
