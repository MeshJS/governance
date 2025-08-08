#!/usr/bin/env node

import fetch from 'node-fetch'

// —— Config from env / GitHub Action inputs ——
const ORG = process.env.ORG
const REPO = process.env.REPO
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
// Hardcoded endpoints
const BASE_URL = 'https://gov.meshjs.dev/'
const NETLIFY_FUNCTION_URL = 'https://glittering-chebakia-09bd42.netlify.app/.netlify/functions/github-stats-background'

// Debug logging
console.log('🔍 Environment variables:')
console.log(`  ORG: ${process.env.ORG}`)
console.log(`  REPO: ${process.env.REPO}`)
console.log(`  BASE_URL: ${BASE_URL}`)
console.log(`  NETLIFY_FUNCTION_URL: ${NETLIFY_FUNCTION_URL}`)
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

    // BASE_URL and NETLIFY_FUNCTION_URL are hardcoded

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
const parsedBaseUrl = BASE_URL.trim().replace(/\/$/, '')
const parsedFunctionUrl = NETLIFY_FUNCTION_URL.trim()

console.log('📊 Resolved values:')
console.log(`  ORG: ${parsedOrg}`)
console.log(`  REPO: ${parsedRepo}`)
console.log(`  BASE_URL: ${parsedBaseUrl}`)

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
            // read response body for better diagnostics
            let errorBodyText = ''
            try {
                errorBodyText = await response.text()
            } catch (_) {
                // ignore
            }
            let parsedBody
            try {
                parsedBody = errorBodyText ? JSON.parse(errorBodyText) : undefined
            } catch (_) {
                parsedBody = undefined
            }
            const details = parsedBody ? JSON.stringify(parsedBody) : (errorBodyText ? errorBodyText.substring(0, 1000) : '')
            const err = new Error(`HTTP ${response.status}: ${response.statusText}${details ? ` | Body: ${details}` : ''}`)
            // Attach status for retry logic
            // @ts-ignore
            err.status = response.status
            throw err
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

// Retry helper for GitHub API calls
async function retryWithBackoff(fn, maxRetries = 5, initialDelayMs = 1000) {
    let attempt = 0
    let delay = initialDelayMs
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            return await fn()
        } catch (error) {
            const status = error.status || error.code || error?.response?.status
            if (attempt < maxRetries && (status === 403 || status === 429 || (typeof status === 'number' && status >= 500))) {
                attempt += 1
                console.warn(`Retrying after error ${status} (attempt ${attempt}/${maxRetries})...`)
                await new Promise((r) => setTimeout(r, delay))
                delay *= 2
                continue
            }
            throw error
        }
    }
}

function ghHeaders() {
    return {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${parsedGithubToken}`
    }
}

async function fetchExistingIds() {
    const url = `${parsedBaseUrl}/api/github/existing-ids?org=${encodeURIComponent(parsedOrg)}&repo=${encodeURIComponent(parsedRepo)}`
    return await makeRequest(url, { method: 'GET' })
}

async function fetchAllMissingCommits(existingShasSet) {
    const results = []
    let page = 1
    while (true) {
        const data = await retryWithBackoff(async () => {
            const resp = await fetch(`https://api.github.com/repos/${parsedOrg}/${parsedRepo}/commits?per_page=100&page=${page}`, { headers: ghHeaders() })
            if (!resp.ok) throw { status: resp.status, message: await resp.text() }
            return resp.json()
        })
        if (!Array.isArray(data) || data.length === 0) break
        for (const item of data) {
            if (!existingShasSet.has(item.sha)) {
                // Ensure we have full commit details
                const details = await retryWithBackoff(async () => {
                    const resp = await fetch(`https://api.github.com/repos/${parsedOrg}/${parsedRepo}/commits/${item.sha}`, { headers: ghHeaders() })
                    if (!resp.ok) throw { status: resp.status, message: await resp.text() }
                    return resp.json()
                })
                results.push(details)
            }
        }
        page += 1
    }
    return results
}

async function fetchAllMissingPulls(existingNumbersSet) {
    const results = []
    let page = 1
    while (true) {
        const data = await retryWithBackoff(async () => {
            const resp = await fetch(`https://api.github.com/repos/${parsedOrg}/${parsedRepo}/pulls?state=all&per_page=100&page=${page}`, { headers: ghHeaders() })
            if (!resp.ok) throw { status: resp.status, message: await resp.text() }
            return resp.json()
        })
        if (!Array.isArray(data) || data.length === 0) break
        for (const pr of data) {
            if (!existingNumbersSet.has(pr.number)) {
                const prDetails = await retryWithBackoff(async () => {
                    const resp = await fetch(`https://api.github.com/repos/${parsedOrg}/${parsedRepo}/pulls/${pr.number}`, { headers: ghHeaders() })
                    if (!resp.ok) throw { status: resp.status, message: await resp.text() }
                    return resp.json()
                })
                const prCommits = await retryWithBackoff(async () => {
                    const resp = await fetch(`https://api.github.com/repos/${parsedOrg}/${parsedRepo}/pulls/${pr.number}/commits`, { headers: ghHeaders() })
                    if (!resp.ok) throw { status: resp.status, message: await resp.text() }
                    return resp.json()
                })
                results.push({ details: prDetails, commits: prCommits })
            }
        }
        page += 1
    }
    return results
}

async function fetchAllMissingIssues(existingNumbersSet) {
    const results = []
    let page = 1
    while (true) {
        const data = await retryWithBackoff(async () => {
            const resp = await fetch(`https://api.github.com/repos/${parsedOrg}/${parsedRepo}/issues?state=all&per_page=100&page=${page}`, { headers: ghHeaders() })
            if (!resp.ok) throw { status: resp.status, message: await resp.text() }
            return resp.json()
        })
        if (!Array.isArray(data) || data.length === 0) break
        for (const issue of data) {
            if (issue.pull_request) continue // skip PRs
            if (!existingNumbersSet.has(issue.number)) {
                results.push(issue)
            }
        }
        page += 1
    }
    return results
}

// Main function
async function main() {
    console.log(`🚀 Starting GitHub stats collection for repository: ${parsedOrg}/${parsedRepo}`)

    // Trigger the Netlify background function
    console.log('📥 Fetching existing IDs from mesh-gov API...')
    const existing = await fetchExistingIds()
    const existingCommitShas = new Set(existing.commitShas || [])
    const existingPrNumbers = new Set(existing.prNumbers || [])
    const existingIssueNumbers = new Set(existing.issueNumbers || [])

    console.log(`🔎 Found existing: commits=${existingCommitShas.size}, PRs=${existingPrNumbers.size}, issues=${existingIssueNumbers.size}`)

    console.log('⬇️  Fetching missing commits from GitHub...')
    const missingCommits = await fetchAllMissingCommits(existingCommitShas)
    console.log(`🧮 Missing commits: ${missingCommits.length}`)

    console.log('⬇️  Fetching missing pull requests from GitHub...')
    const missingPulls = await fetchAllMissingPulls(existingPrNumbers)
    console.log(`🧮 Missing PRs: ${missingPulls.length}`)

    console.log('⬇️  Fetching missing issues from GitHub...')
    const missingIssues = await fetchAllMissingIssues(existingIssueNumbers)
    console.log(`🧮 Missing issues: ${missingIssues.length}`)

    const payload = {
        org: parsedOrg,
        repo: parsedRepo,
        commits: missingCommits,
        pulls: missingPulls,
        issues: missingIssues,
    }

    if (
        (missingCommits && missingCommits.length) ||
        (missingPulls && missingPulls.length) ||
        (missingIssues && missingIssues.length)
    ) {
        console.log('📡 Sending new data to Netlify background function...')
        const response = await makeRequest(parsedFunctionUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
        })
        console.log(`✅ Background function response: ${JSON.stringify(response, null, 2)}`)
    } else {
        console.log('✅ No new data to send')
    }

    console.log('🎉 Done')
    process.exit(0)
}

// Run the main function
main().catch(error => {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
})
