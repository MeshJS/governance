#!/usr/bin/env node

import fetch from 'node-fetch'
import https from 'node:https'

// —— Config from env / GitHub Action inputs ——
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50, keepAliveMsecs: 10000 })
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
        // Add timeout to prevent hanging requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            agent: httpsAgent,
            signal: controller.signal,
            ...options
        })

        clearTimeout(timeoutId)

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
            console.log('⚠️  Empty response received - data was processed successfully')
            return { success: true, message: 'Empty response - data processed successfully' }
        }

        // Try to parse as JSON, but handle non-JSON responses gracefully
        try {
            const parsed = JSON.parse(text)
            // Validate that we got a meaningful response
            if (parsed.success === false) {
                console.log(`⚠️  Function returned error: ${parsed.message || 'Unknown error'}`)
                return parsed
            }
            return parsed
        } catch (parseError) {
            console.log(`⚠️  Non-JSON response received: ${text.substring(0, 200)}...`)
            return { success: true, message: 'Non-JSON response', raw: text }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`❌ Request timed out after 30 seconds`)
            throw new Error('Request timed out - the Netlify function may be unresponsive')
        }
        console.error(`❌ Request failed: ${error.message}`)
        throw error
    }
}

// Retry helper for GitHub API calls (handles transient network errors like "Premature close")
async function retryWithBackoff(fn, maxRetries = 8, initialDelayMs = 1000) {
    let attempt = 0
    let backoffMs = initialDelayMs
    const maxDelayMs = 30000
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            return await fn()
        } catch (error) {
            const status = error?.status || error?.response?.status
            const code = error?.code || error?.errno
            const message = typeof error?.message === 'string' ? error.message : ''

            const isStatusRetriable = status === 403 || status === 429 || (typeof status === 'number' && status >= 500)
            const isNetworkRetriable =
                message.includes('Premature close') ||
                message.includes('ERR_STREAM_PREMATURE_CLOSE') ||
                message.includes('socket hang up') ||
                message.includes('ECONNRESET') ||
                message.includes('ETIMEDOUT') ||
                message.includes('EAI_AGAIN') ||
                message.includes('network timeout') ||
                message.includes('NetworkError') ||
                message.includes('fetch failed') ||
                message.includes('Invalid response body')

            const shouldRetry = attempt < maxRetries && (isStatusRetriable || isNetworkRetriable)

            if (shouldRetry) {
                attempt += 1
                const jitter = Math.floor(Math.random() * 250)

                // Special handling for rate limits
                if (status === 429) {
                    console.warn(`⏳ Rate limit hit (attempt ${attempt}/${maxRetries}). Waiting 1 minute...`)
                    await delay(RATE_LIMIT_CONFIG.github.delayAfterRateLimit)
                } else {
                    console.warn(`Retrying after error ${status || code || message} (attempt ${attempt}/${maxRetries})...`)
                    await delay(backoffMs + jitter)
                }

                backoffMs = Math.min(backoffMs * 2, maxDelayMs)
                continue
            }
            throw error
        }
    }
}

function ghHeaders() {
    return {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${parsedGithubToken}`,
        'User-Agent': 'mesh-gov-stats-action/1.0 (+https://gov.meshjs.dev)',
        'X-GitHub-Api-Version': '2022-11-28'
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
                // Minify commit payload to only what the Netlify function needs
                const filesCount = Array.isArray(details.files) ? details.files.length : 0
                const parents = Array.isArray(details.parents) ? details.parents.map((p) => ({ sha: p.sha })) : []
                results.push({
                    sha: details.sha,
                    author: details.author ? { login: details.author.login, avatar_url: details.author.avatar_url } : null,
                    committer: details.committer ? { login: details.committer.login, avatar_url: details.committer.avatar_url } : null,
                    commit: {
                        message: details.commit?.message ?? null,
                        author: { date: details.commit?.author?.date ?? null }
                    },
                    stats: details.stats
                        ? {
                            additions: details.stats.additions,
                            deletions: details.stats.deletions,
                            total: details.stats.total
                        }
                        : null,
                    // Only send a small array to preserve length semantics expected by the function
                    files: filesCount ? Array(filesCount).fill(0) : [],
                    parents
                })

                // Add delay between API calls to respect rate limits
                await delay(RATE_LIMIT_CONFIG.github.delayBetweenRequests)
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

                // Add delay between API calls to respect rate limits
                await delay(RATE_LIMIT_CONFIG.github.delayBetweenRequests)
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

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
    github: {
        delayBetweenRequests: 100, // 100ms between GitHub API calls
        delayAfterRateLimit: 60000, // 1 minute delay after hitting rate limit
        maxRetries: 3
    },
    netlify: {
        delayBetweenBatches: 500, // 500ms between Netlify function calls
        delayAfterError: 2000, // 2 second delay after errors
        maxRetries: 3
    }
}

// Helper function to add delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Check GitHub rate limit status
async function checkGitHubRateLimit() {
    try {
        const response = await fetch('https://api.github.com/rate_limit', { headers: ghHeaders() })
        if (!response.ok) {
            console.log('⚠️  Could not check rate limit status')
            return null
        }
        const rateLimit = await response.json()
        const core = rateLimit.resources.core
        const remaining = core.remaining
        const resetTime = new Date(core.reset * 1000)

        console.log(`📊 GitHub Rate Limit: ${remaining}/${core.limit} remaining`)
        console.log(`🕐 Rate limit resets at: ${resetTime.toISOString()}`)

        if (remaining < 100) {
            console.log('⚠️  Rate limit is getting low, consider reducing batch sizes')
        }

        return { remaining, reset: core.reset, limit: core.limit }
    } catch (error) {
        console.log(`⚠️  Rate limit check failed: ${error.message}`)
        return null
    }
}

// Main function
async function main() {
    console.log(`🚀 Starting GitHub stats collection for repository: ${parsedOrg}/${parsedRepo}`)

    // Check GitHub rate limit status before starting
    console.log('📊 Checking GitHub rate limit status...')
    const rateLimitStatus = await checkGitHubRateLimit()
    if (rateLimitStatus && rateLimitStatus.remaining < 50) {
        console.log('⚠️  Rate limit is very low. Consider running this action later.')
    }

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

    // Helper to chunk arrays
    const chunkArray = (arr, size) => {
        const chunks = []
        for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
        return chunks
    }

    // Use conservative batch sizes to avoid gateway limits
    const COMMIT_BATCH_SIZE = 25
    const PULL_BATCH_SIZE = 20
    const ISSUE_BATCH_SIZE = 50

    let sentSomething = false

    if (missingCommits.length > 0) {
        console.log(`📡 Sending ${missingCommits.length} commits in batches of ${COMMIT_BATCH_SIZE}...`)
        const commitBatches = chunkArray(missingCommits, COMMIT_BATCH_SIZE)
        for (let i = 0; i < commitBatches.length; i++) {
            const batch = commitBatches[i]
            console.log(`  ➤ Commit batch ${i + 1}/${commitBatches.length} (size=${batch.length})`)
            const payload = {
                org: parsedOrg,
                repo: parsedRepo,
                commits: batch,
                pulls: [],
                issues: []
            }

            // Debug: Log payload details
            const payloadSize = JSON.stringify(payload).length
            console.log(`    📦 Payload size: ${payloadSize} bytes`)
            console.log(`    📊 Sample commit: ${JSON.stringify(batch[0]?.sha || 'none')}`)

            // Retry Netlify function calls with delays
            let response
            for (let retry = 0; retry < RATE_LIMIT_CONFIG.netlify.maxRetries; retry++) {
                try {
                    response = await makeRequest(parsedFunctionUrl, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    })
                    break // Success, exit retry loop
                } catch (error) {
                    if (retry < RATE_LIMIT_CONFIG.netlify.maxRetries - 1) {
                        console.log(`    ⚠️  Netlify function call failed (attempt ${retry + 1}/${RATE_LIMIT_CONFIG.netlify.maxRetries}), retrying...`)
                        await delay(RATE_LIMIT_CONFIG.netlify.delayAfterError)
                        continue
                    }
                    throw error // Last retry failed
                }
            }

            console.log(`    ✅ Response: ${JSON.stringify(response)}`)

            sentSomething = true

            // Add delay between batches to respect Netlify rate limits
            if (i < commitBatches.length - 1) {
                await delay(RATE_LIMIT_CONFIG.netlify.delayBetweenBatches)
            }
        }
    }

    if (missingPulls.length > 0) {
        console.log(`📡 Sending ${missingPulls.length} pull requests in batches of ${PULL_BATCH_SIZE}...`)
        const pullBatches = chunkArray(missingPulls, PULL_BATCH_SIZE)
        for (let i = 0; i < pullBatches.length; i++) {
            const batch = pullBatches[i]
            console.log(`  ➤ PR batch ${i + 1}/${pullBatches.length} (size=${batch.length})`)
            const payload = {
                org: parsedOrg,
                repo: parsedRepo,
                commits: [],
                pulls: batch,
                issues: []
            }

            // Debug: Log payload details
            const payloadSize = JSON.stringify(payload).length
            console.log(`    📦 Payload size: ${payloadSize} bytes`)
            console.log(`    📊 Sample PR: #${batch[0]?.details?.number || 'none'}`)

            // Retry Netlify function calls with delays
            let response
            for (let retry = 0; retry < RATE_LIMIT_CONFIG.netlify.maxRetries; retry++) {
                try {
                    response = await makeRequest(parsedFunctionUrl, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    })
                    break // Success, exit retry loop
                } catch (error) {
                    if (retry < RATE_LIMIT_CONFIG.netlify.maxRetries - 1) {
                        console.log(`    ⚠️  Netlify function call failed (attempt ${retry + 1}/${RATE_LIMIT_CONFIG.netlify.maxRetries}), retrying...`)
                        await delay(RATE_LIMIT_CONFIG.netlify.delayAfterError)
                        continue
                    }
                    throw error // Last retry failed
                }
            }

            console.log(`    ✅ Response: ${JSON.stringify(response)}`)
            sentSomething = true

            // Add delay between batches to respect Netlify rate limits
            if (i < pullBatches.length - 1) {
                await delay(RATE_LIMIT_CONFIG.netlify.delayBetweenBatches)
            }
        }
    }

    if (missingIssues.length > 0) {
        console.log(`📡 Sending ${missingIssues.length} issues in batches of ${ISSUE_BATCH_SIZE}...`)
        const issueBatches = chunkArray(missingIssues, ISSUE_BATCH_SIZE)
        for (let i = 0; i < issueBatches.length; i++) {
            const batch = issueBatches[i]
            console.log(`  ➤ Issue batch ${i + 1}/${issueBatches.length} (size=${batch.length})`)
            const payload = {
                org: parsedOrg,
                repo: parsedRepo,
                commits: [],
                pulls: [],
                issues: batch
            }

            // Debug: Log payload details
            const payloadSize = JSON.stringify(payload).length
            console.log(`    📊 Sample issue: #${batch[0]?.number || 'none'}`)

            // Retry Netlify function calls with delays
            let response
            for (let retry = 0; retry < RATE_LIMIT_CONFIG.netlify.maxRetries; retry++) {
                try {
                    response = await makeRequest(parsedFunctionUrl, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    })
                    break // Success, exit retry loop
                } catch (error) {
                    if (retry < RATE_LIMIT_CONFIG.netlify.maxRetries - 1) {
                        console.log(`    ⚠️  Netlify function call failed (attempt ${retry + 1}/${RATE_LIMIT_CONFIG.netlify.maxRetries}), retrying...`)
                        await delay(RATE_LIMIT_CONFIG.netlify.delayAfterError)
                        continue
                    }
                    throw error // Last retry failed
                }
            }

            console.log(`    ✅ Response: ${JSON.stringify(response)}`)
            sentSomething = true

            // Add delay between batches to respect Netlify rate limits
            if (i < issueBatches.length - 1) {
                await delay(RATE_LIMIT_CONFIG.netlify.delayBetweenBatches)
            }
        }
    }

    if (!sentSomething) {
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
