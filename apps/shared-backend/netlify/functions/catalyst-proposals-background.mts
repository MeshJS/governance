// netlify/functions/catalyst-proposals-background.mts
import type { Context } from '@netlify/functions'
import { config as dotenv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

dotenv()

// TypeScript interfaces for milestone structure
interface MilestoneContent {
    budget: string
    challenge: string
    content: string
    delivered: string
    isCloseOut: boolean
    link: string
    number: number
    projectId: string
}

interface MilestonesContentRecord {
    [key: string]: MilestoneContent
}

// Initialize Supabase clients for different databases
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const catalystSupabaseUrl = process.env.CATALYST_SUPABASE_URL
const catalystSupabaseKey = process.env.CATALYST_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

if (!catalystSupabaseUrl || !catalystSupabaseKey) {
    throw new Error('Missing CATALYST_SUPABASE_URL or CATALYST_SUPABASE_ANON_KEY environment variables')
}

// Client for fetching proposal details (using CATALYST_SUPABASE_URL)
const supabaseFetch = createClient(catalystSupabaseUrl, catalystSupabaseKey)

// Client for upserting data (using SUPABASE_URL)
const supabaseUpsert = createClient(supabaseUrl, supabaseServiceKey)

// Lido CSRF token for lidonation API calls
const LIDO_CSRF_TOKEN = process.env.LIDO_CSRF_TOKEN

if (!LIDO_CSRF_TOKEN) {
    throw new Error('Missing LIDO_CSRF_TOKEN environment variable')
}

const API_BASE = 'https://www.lidonation.com/api/catalyst-explorer'

/**
 * Fetches voting metrics for a single proposal by title & fund number.
 */
async function getProposalMetrics({ fundNumber, title, csrfToken }: {
    fundNumber: number | string
    title: string
    csrfToken: string
}) {
    console.log(`[Lido API] Starting metrics fetch for "${title}" in Fund ${fundNumber}`)

    const headers = {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
    }

    // 1) Get all funds, find the one matching "Fund ${fundNumber}"
    const fundsRes = await fetch(`${API_BASE}/funds`, { headers })
    if (!fundsRes.ok) {
        console.error(`[Lido API] Failed to fetch funds: ${fundsRes.status} ${fundsRes.statusText}`)
        throw new Error(`Failed to fetch funds: ${fundsRes.status}`)
    }
    const { data: funds } = await fundsRes.json() as { data: any[] }

    const fund = funds.find((f: any) => f.title === `Fund ${fundNumber}`)
    if (!fund) {
        console.error(`[Lido API] Fund ${fundNumber} not found in available funds:`, funds.map(f => f.title))
        throw new Error(`Fund ${fundNumber} not found`)
    }
    const fundId = fund.id

    // 2) Search proposals in that fund for the exact title
    const searchTerm = encodeURIComponent(title)
    const propsRes = await fetch(
        `${API_BASE}/proposals?fund_id=${fundId}&search=${searchTerm}&per_page=5&page=1`,
        { headers }
    )
    if (!propsRes.ok) {
        console.error(`[Lido API] Failed to search proposals: ${propsRes.status} ${propsRes.statusText}`)
        throw new Error(`Failed to search proposals: ${propsRes.status}`)
    }
    const propsJson = await propsRes.json() as { data: any[] }

    const match = propsJson.data.find((p: any) => p.title === title)
    if (!match) {
        console.error(`[Lido API] Proposal titled "${title}" not found in Fund ${fundNumber}. Available proposals:`, propsJson.data.map(p => p.title))
        throw new Error(`Proposal titled "${title}" not found in Fund ${fundNumber}`)
    }
    const proposalId = match.id

    // 3) Fetch full proposal details by ID
    const detailRes = await fetch(`${API_BASE}/proposals/${proposalId}`, { headers })
    if (!detailRes.ok) {
        console.error(`[Lido API] Failed to fetch proposal ${proposalId}: ${detailRes.status} ${detailRes.statusText}`)
        throw new Error(`Failed to fetch proposal ${proposalId}: ${detailRes.status}`)
    }
    const detailResponse = await detailRes.json() as { data: any }
    const { data: detail } = detailResponse

    const {
        yes_votes_count,
        no_votes_count,
        abstain_votes_count,
        unique_wallets,
        users
    } = detail

    // Extract user_id from the users array - try multiple possible field names
    let userId = null

    // Try the expected 'users' field first
    if (users && users.length > 0) {
        userId = users[0].id
        console.log(`[Lido API] Found user ID from 'users' field: ${userId}`)
    }

    // If not found, try alternative field names
    if (!userId && detail.user_id) {
        userId = detail.user_id
        console.log(`[Lido API] Found user ID from 'user_id' field: ${userId}`)
    }

    if (!userId && detail.user) {
        userId = detail.user.id || detail.user
        console.log(`[Lido API] Found user ID from 'user' field: ${userId}`)
    }

    if (!userId) {
        console.log(`[Lido API] No user ID found in any expected fields`)
    }

    // Debug: Check if users exists and log its structure (only if no user ID found)
    if (!userId) {
        console.log(`[Lido API] Users field debug:`, {
            has_users_field: 'users' in detail,
            users_value: detail.users,
            users_type: typeof detail.users,
            users_is_array: Array.isArray(detail.users),
            users_length: detail.users ? detail.users.length : 'N/A'
        })
    }

    console.log(`[Lido API] Successfully retrieved voting metrics:`, {
        yes_votes: yes_votes_count,
        no_votes: no_votes_count,
        abstain_votes: abstain_votes_count,
        unique_wallets,
        user_id: userId
    })

    return { proposalId, yes_votes_count, no_votes_count, abstain_votes_count, unique_wallets, user_id: userId }
}

/**
 * Fetches all proposals by a specific user ID.
 */
async function getProposalsByUserId(userId: number, csrfToken: string) {
    console.log(`[Lido API] Fetching all proposals for user ID: ${userId}`)

    const headers = {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
    }

    try {
        const response = await fetch(
            `${API_BASE}/proposals?user_id=${userId}&per_page=24&page=1`,
            { headers }
        )

        if (!response.ok) {
            console.error(`[Lido API] Failed to fetch proposals for user ${userId}: ${response.status} ${response.statusText}`)
            throw new Error(`Failed to fetch proposals for user ${userId}: ${response.status}`)
        }

        const { data: proposals } = await response.json() as { data: any[] }
        console.log(`[Lido API] Retrieved ${proposals.length} proposals for user ${userId}`)

        return proposals
    } catch (error) {
        console.error(`[Lido API] Error fetching proposals for user ${userId}:`, error)
        return []
    }
}

/**
 * Attempts to find a proposal by title from a list of user proposals.
 */
function findProposalByTitle(proposals: any[], targetTitle: string): any | null {
    console.log(`[Title Matching] Attempting to match "${targetTitle}" against ${proposals.length} proposals`)

    // Log all available proposal titles for debugging
    console.log(`[Title Matching] Available proposal titles:`, proposals.map(p => p.title))

    // First try exact match
    const exactMatch = proposals.find(p => p.title === targetTitle)
    if (exactMatch) {
        console.log(`[Title Matching] ✅ Found exact title match: "${targetTitle}"`)
        return exactMatch
    }

    // Try case-insensitive match
    const caseInsensitiveMatch = proposals.find(p =>
        p.title.toLowerCase() === targetTitle.toLowerCase()
    )
    if (caseInsensitiveMatch) {
        console.log(`[Title Matching] ✅ Found case-insensitive title match: "${targetTitle}"`)
        return caseInsensitiveMatch
    }

    // Try partial match (if title contains the target)
    const partialMatch = proposals.find(p =>
        p.title.toLowerCase().includes(targetTitle.toLowerCase()) ||
        targetTitle.toLowerCase().includes(p.title.toLowerCase())
    )
    if (partialMatch) {
        console.log(`[Title Matching] ✅ Found partial title match: "${targetTitle}" -> "${partialMatch.title}"`)
        return partialMatch
    }

    // Try fuzzy matching - remove common words and compare
    const cleanTarget = targetTitle.toLowerCase()
        .replace(/\b(by|the|and|or|for|with|in|on|at|to|from|of|a|an)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim()

    const fuzzyMatch = proposals.find(p => {
        const cleanProposal = p.title.toLowerCase()
            .replace(/\b(by|the|and|or|for|with|in|on|at|to|from|of|a|an)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim()

        return cleanProposal === cleanTarget ||
            cleanProposal.includes(cleanTarget) ||
            cleanTarget.includes(cleanProposal)
    })

    if (fuzzyMatch) {
        console.log(`[Title Matching] ✅ Found fuzzy title match: "${targetTitle}" -> "${fuzzyMatch.title}"`)
        return fuzzyMatch
    }

    console.log(`[Title Matching] ❌ No title match found for "${targetTitle}" in user proposals`)
    return null
}

/**
 * Generates a URL-friendly slug from a project title.
 */
function generateUrlFromTitle(title: string): string {
    if (!title) return ''

    return title
        // Replace '&' with 'and'
        .replace(/&/g, 'and')
        // Replace '|' with 'or'
        .replace(/\|/g, 'or')
        // Replace '[' and ']' with empty string
        .replace(/[\[\]]/g, '')
        // Replace multiple spaces, hyphens, or underscores with single space
        .replace(/[\s\-_]+/g, ' ')
        // Remove special characters except spaces and alphanumeric
        .replace(/[^a-zA-Z0-9\s]/g, '')
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // Trim whitespace
        .trim()
        // Replace spaces with hyphens
        .replace(/\s/g, '-')
        // Convert to lowercase
        .toLowerCase()
}

/**
 * Extracts category slug from challenges data.
 */
function extractCategoryFromChallenges(challenges: any): string | null {
    if (!challenges || !challenges.title) {
        return null
    }

    // Remove the fund prefix (e.g., "F11: ") and clean up the title
    const categoryMatch = challenges.title.match(/^F\d+:\s*(.+)$/i)
    if (categoryMatch) {
        return generateUrlFromTitle(categoryMatch[1])
    }

    return null
}

/**
 * Extracts fund number from challenges data.
 */
function extractFundNumberFromChallenges(challenges: any): string | null {
    if (!challenges || !challenges.title) {
        return null
    }

    // Extract fund number from challenge title (e.g., "F11: OSDE: ...")
    const fundMatch = challenges.title.match(/^F(\d+):/i)
    if (fundMatch) {
        return fundMatch[1]
    }

    return null
}

/**
 * Generates the full Catalyst URL for a project.
 */
function generateCatalystUrl(title: string, fundNumber: string, categorySlug: string): string {
    if (!title || !fundNumber || !categorySlug) return ''

    const slug = generateUrlFromTitle(title)
    return `https://projectcatalyst.io/funds/${fundNumber}/${categorySlug}/${slug}`
}

/**
 * Retrieves the proposal details from Supabase.
 */
async function getProposalDetails(projectId: string) {
    console.log(`[Supabase] Getting proposal details for project ${projectId}`)

    const { data, error } = await supabaseFetch
        .from('proposals')
        .select(`
      id,
      title,
      budget,
      milestones_qty,
      funds_distributed,
      challenges(*),
      project_id
    `)
        .eq('project_id', projectId)
        .single()

    if (error) {
        console.error(`[Supabase] Error fetching proposal details for project ${projectId}:`, error)
        return null
    }

    console.log(`[Supabase] Successfully retrieved proposal details:`, {
        id: data.id,
        title: data.title,
        budget: data.budget,
        milestones_qty: data.milestones_qty,
        has_challenges: !!data.challenges && !!(data.challenges as any).title
    })

    return data
}

/**
 * Cleans HTML content while preserving line breaks and formatting.
 */
function cleanHtmlContent(htmlContent: string): string {
    if (!htmlContent) return ''

    console.log(`[HTML Clean] Original content length: ${htmlContent.length}`)

    const cleaned = htmlContent
        // Replace <br> and <br/> with newlines
        .replace(/<br\s*\/?>/gi, '\n')
        // Replace </p> with double newlines to separate paragraphs
        .replace(/<\/p>/gi, '\n\n')
        // Replace <p> with empty string (we already handled closing tags)
        .replace(/<p[^>]*>/gi, '')
        // Replace <ul> and </ul> with newlines
        .replace(/<\/?ul[^>]*>/gi, '\n')
        // Replace <li> and </li> with bullet points
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        // Replace <strong> and </strong> with ** for markdown-style bold
        .replace(/<strong[^>]*>/gi, '**')
        .replace(/<\/strong>/gi, '**')
        // Replace <em> and </em> with * for markdown-style italic
        .replace(/<em[^>]*>/gi, '*')
        .replace(/<\/em>/gi, '*')
        // Replace <a> tags with just the text content
        .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
        // Remove all other HTML tags
        .replace(/<[^>]*>/g, '')
        // Decode HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Clean up multiple newlines
        .replace(/\n{3,}/g, '\n\n')
        // Trim whitespace
        .trim()

    console.log(`[HTML Clean] Cleaned content length: ${cleaned.length}`)
    console.log(`[HTML Clean] Cleaned content preview: ${cleaned.substring(0, 100)}...`)

    return cleaned
}

/**
 * Extracts and combines POAs content for all milestones with structured format.
 */
function extractMilestonesContent(proposalId: string, projectId: string, somData: any[]): MilestonesContentRecord {
    console.log(`[POAs] Extracting milestones content for proposal ${proposalId}`)

    try {
        if (!somData || somData.length === 0) {
            console.log(`[POAs] No SOMs found for proposal ${proposalId}`)
            return {}
        }

        console.log(`[POAs] Found ${somData.length} SOM records for proposal ${proposalId}`)
        console.log(`[POAs] Sample SOM data:`, somData.slice(0, 2).map(som => ({
            id: som.id,
            milestone: som.milestone,
            current: som.current,
            poas_count: som.poas?.length || 0
        })))

        // Group by milestone and get the current (most recent) SOM for each
        const milestoneMap = new Map<number, any>()

        for (const som of somData) {
            if (!milestoneMap.has(som.milestone) || som.current) {
                milestoneMap.set(som.milestone, som)
            }
        }

        const milestonesContent: MilestonesContentRecord = {}
        let milestoneIndex = 0

        for (const [milestone, currentSom] of milestoneMap) {
            console.log(`[POAs] Processing milestone ${milestone} for proposal ${proposalId}`)

            // Extract POAs content
            if (currentSom.poas && currentSom.poas.length > 0) {
                // Debug: Log the POAs data to see what we're working with
                console.log(`[POAs] Raw POAs data for milestone ${milestone}:`, currentSom.poas.map((poa: any) => ({
                    id: poa.id,
                    current: poa.current,
                    has_content: !!poa.content,
                    content_length: poa.content?.length || 0
                })))

                // Filter for current POAs only
                const currentPoas = currentSom.poas.filter((poa: any) => poa.current === true)
                console.log(`[POAs] Found ${currentSom.poas.length} total POAs, ${currentPoas.length} current POAs for milestone ${milestone}`)

                const milestoneContent: string[] = []
                let deliveredDate = ''

                for (const poa of currentPoas) {
                    console.log(`[POAs] Processing POA ${poa.id}, has content: ${!!poa.content}, content length: ${poa.content?.length || 0}`)
                    if (poa.content) {
                        const cleanedContent = cleanHtmlContent(poa.content)
                        console.log(`[POAs] Cleaned content length: ${cleanedContent.length}`)
                        if (cleanedContent) {
                            milestoneContent.push(cleanedContent)
                            console.log(`[POAs] Added ${cleanedContent.length} characters of cleaned content from current POA ${poa.id}`)
                        } else {
                            console.log(`[POAs] Cleaned content was empty for POA ${poa.id}`)
                        }
                    } else {
                        console.log(`[POAs] No content found for POA ${poa.id}`)
                    }

                    // Get the delivered date from the POA's created_at
                    if (poa.created_at && !deliveredDate) {
                        deliveredDate = new Date(poa.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })
                    }
                }

                if (milestoneContent.length > 0) {
                    // Format budget as "ADA X,XXX.XX"
                    const budget = currentSom.cost ? `ADA ${Number(currentSom.cost).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}` : 'ADA 0.00'

                    // Determine if this is a closeout milestone (completion = 100)
                    const isCloseOut = currentSom.completion === 100

                    milestonesContent[milestoneIndex.toString()] = {
                        budget: budget,
                        challenge: '', // This will be filled in later from proposal details
                        content: milestoneContent.join('\n\n'),
                        delivered: deliveredDate,
                        isCloseOut: isCloseOut,
                        link: '', // This will be filled in later from proposal details
                        number: milestone,
                        projectId: String(projectId)
                    } as MilestoneContent

                    console.log(`[POAs] Added milestone ${milestone} content (${milestoneContent.length} parts) with structured format`)
                    milestoneIndex++
                } else {
                    console.log(`[POAs] No current POAs with content found for milestone ${milestone}`)
                }
            } else {
                console.log(`[POAs] No POAs found for milestone ${milestone}`)
            }
        }

        console.log(`[POAs] Successfully extracted ${Object.keys(milestonesContent).length} milestone contents for proposal ${proposalId}`)
        return milestonesContent

    } catch (error) {
        console.error(`[POAs] Error extracting milestones content for proposal ${proposalId}:`, error)
        return {}
    }
}

/**
 * Calculates milestone completion based on POA reviews instead of signoffs.
 * A milestone is considered completed if all its current POAs have approved reviews.
 */
function calculateMilestonesCompletedFromReviews(proposalId: string, somData: any[]): number {
    console.log(`[Milestone Completion] Calculating completed milestones for proposal ${proposalId} based on POA reviews`)

    try {
        if (!somData || somData.length === 0) {
            console.log(`[Milestone Completion] No SOMs found for proposal ${proposalId}`)
            return 0
        }

        console.log(`[Milestone Completion] Found ${somData.length} SOM records for proposal ${proposalId}`)

        // Group by milestone and get the current (most recent) SOM for each
        const milestoneMap = new Map<number, any>()

        for (const som of somData) {
            if (som.current && (!milestoneMap.has(som.milestone) || som.current)) {
                milestoneMap.set(som.milestone, som)
            }
        }

        let completedMilestones = 0

        for (const [milestone, currentSom] of milestoneMap) {
            console.log(`[Milestone Completion] Checking milestone ${milestone} for proposal ${proposalId}`)

            // Check if this milestone has POAs
            if (currentSom.poas && currentSom.poas.length > 0) {
                // Filter for current POAs only
                const currentPoas = currentSom.poas.filter((poa: any) => poa.current === true)
                console.log(`[Milestone Completion] Found ${currentPoas.length} current POAs for milestone ${milestone}`)

                if (currentPoas.length === 0) {
                    console.log(`[Milestone Completion] No current POAs found for milestone ${milestone} - marking as incomplete`)
                    continue
                }

                // Check if all current POAs have approved reviews
                let allPoasApproved = true
                let poasWithReviews = 0

                for (const poa of currentPoas) {
                    if (poa.poas_reviews && poa.poas_reviews.length > 0) {
                        // Filter for current reviews only
                        const currentReviews = poa.poas_reviews.filter((review: any) => review.current === true)

                        if (currentReviews.length === 0) {
                            console.log(`[Milestone Completion] POA ${poa.id} has no current reviews - marking milestone ${milestone} as incomplete`)
                            allPoasApproved = false
                            break
                        }

                        // Check if all current reviews are approved
                        const allReviewsApproved = currentReviews.every((review: any) => review.content_approved === true)

                        if (!allReviewsApproved) {
                            console.log(`[Milestone Completion] POA ${poa.id} has unapproved reviews - marking milestone ${milestone} as incomplete`)
                            allPoasApproved = false
                            break
                        }

                        poasWithReviews++
                        console.log(`[Milestone Completion] POA ${poa.id} has ${currentReviews.length} approved current reviews`)
                    } else {
                        console.log(`[Milestone Completion] POA ${poa.id} has no reviews - marking milestone ${milestone} as incomplete`)
                        allPoasApproved = false
                        break
                    }
                }

                if (allPoasApproved && poasWithReviews === currentPoas.length) {
                    completedMilestones++
                    console.log(`[Milestone Completion] ✅ Milestone ${milestone} marked as completed (${poasWithReviews} POAs with approved reviews)`)
                } else {
                    console.log(`[Milestone Completion] ❌ Milestone ${milestone} marked as incomplete`)
                }
            } else {
                console.log(`[Milestone Completion] No POAs found for milestone ${milestone} - marking as incomplete`)
            }
        }

        console.log(`[Milestone Completion] Total completed milestones for proposal ${proposalId}: ${completedMilestones} out of ${milestoneMap.size}`)
        return completedMilestones

    } catch (error) {
        console.error(`[Milestone Completion] Error calculating completed milestones for proposal ${proposalId}:`, error)
        return 0
    }
}

/**
 * Fetches SOM data once and processes both milestone completion and content extraction.
 */
async function processProposalMilestones(proposalId: string, projectId: string): Promise<{
    milestonesCompleted: number;
    milestonesContent: MilestonesContentRecord;
}> {
    console.log(`[SOM Processing] Fetching SOM data for proposal ${proposalId}`)

    try {
        // Get all SOMs with POAs and reviews data for this proposal in a single query
        const { data: somData, error } = await supabaseFetch
            .from('soms')
            .select(`
                id,
                milestone,
                completion,
                cost,
                current,
                poas(
                    id,
                    content,
                    created_at,
                    current,
                    poas_reviews(
                        id,
                        content_approved,
                        current
                    )
                )
            `)
            .eq('proposal_id', proposalId)
            .order('milestone', { ascending: true })
            .order('current', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) {
            console.error(`[SOM Processing] Error fetching SOMs data for proposal ${proposalId}:`, error)
            console.error(`[SOM Processing] Error details:`, {
                code: error.code,
                message: error.message,
                details: error.details
            })
            return { milestonesCompleted: 0, milestonesContent: {} }
        }

        if (!somData || somData.length === 0) {
            console.log(`[SOM Processing] No SOMs found for proposal ${proposalId}`)
            return { milestonesCompleted: 0, milestonesContent: {} }
        }

        console.log(`[SOM Processing] Found ${somData.length} SOM records for proposal ${proposalId}`)

        // Calculate milestone completion using the fetched data
        const milestonesCompleted = calculateMilestonesCompletedFromReviews(proposalId, somData)

        // Extract milestones content using the same data
        const milestonesContent = extractMilestonesContent(proposalId, projectId, somData)

        console.log(`[SOM Processing] ✅ Completed processing for proposal ${proposalId}: ${milestonesCompleted} completed milestones, ${Object.keys(milestonesContent).length} content records`)

        return { milestonesCompleted, milestonesContent }

    } catch (error) {
        console.error(`[SOM Processing] Error processing milestones for proposal ${proposalId}:`, error)
        return { milestonesCompleted: 0, milestonesContent: {} }
    }
}

export default async (req: Request, context: Context) => {
    console.log('🚀 Catalyst proposals background function started')
    console.log('📅 Timestamp:', new Date().toISOString())

    const url = new URL(req.url)
    const projectIds = url.searchParams.get('projectIds') || ''

    console.log('🔍 Request URL:', req.url)
    console.log('📋 Project IDs from query params:', projectIds)

    if (!projectIds) {
        console.log('❌ No projectIds provided, returning 400 error')
        return new Response(
            JSON.stringify({ error: 'Missing projectIds parameter' }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }

    // Parse comma-separated project IDs
    const PROJECT_IDS = projectIds.split(',').map(id => id.trim())
    console.log('📝 Parsed project IDs:', PROJECT_IDS)

    try {
        console.log('🔄 Starting to process Catalyst data for projects:', PROJECT_IDS)
        console.log('🔧 Environment check - Supabase URL (upsert):', supabaseUrl ? '✅ Set' : '❌ Missing')
        console.log('🔧 Environment check - CATALYST_SUPABASE_URL (fetch):', catalystSupabaseUrl ? '✅ Set' : '❌ Missing')
        console.log('🔧 Environment check - LIDO_CSRF_TOKEN:', LIDO_CSRF_TOKEN ? '✅ Set' : '❌ Missing')

        // Collect all data in memory before pushing to database
        const allSupabaseData: any[] = []
        const successfulUserIds = new Set<number>()
        const failedTitles: Array<{ projectId: string, title: string, fundNumber: string | null }> = []

        // First pass: Try direct title matching
        console.log('\n🔄 FIRST PASS: Direct title matching')
        for (const projectId of PROJECT_IDS) {
            console.log(`\n📊 Processing project ID: ${projectId}`)

            const projectDetails = await getProposalDetails(projectId)
            if (!projectDetails) {
                console.log(`❌ No project details found for project ${projectId}, skipping`)
                continue
            }

            // Determine fund number from challenges
            let fundNumber = null
            if (projectDetails.challenges && (projectDetails.challenges as any).title) {
                fundNumber = extractFundNumberFromChallenges(projectDetails.challenges as any)
            }

            // If not found in challenges, try to get fund number from category
            if (!fundNumber) {
                const category = (projectDetails.challenges as any)?.title || ''
                const catMatch = category.match(/^F(\d+)/i)
                if (catMatch) {
                    fundNumber = catMatch[1]
                }
            }

            // Last fallback: use all digits to the left of the last 5 digits of project_id
            if (!fundNumber && projectDetails.project_id) {
                const pidStr = String(projectDetails.project_id)
                if (pidStr.length > 5) {
                    fundNumber = pidStr.substring(0, pidStr.length - 5)
                }
            }

            // Extract category from challenges data
            let categorySlug = null
            if (projectDetails.challenges && (projectDetails.challenges as any).title) {
                categorySlug = extractCategoryFromChallenges(projectDetails.challenges as any)
            }

            // Generate the proper Catalyst URL with fund number and category
            let url = ''
            if (fundNumber && projectDetails.title && categorySlug) {
                url = generateCatalystUrl(projectDetails.title, fundNumber, categorySlug)
            }

            // Fetch voting metrics if we have fund number and title
            let voting = null
            let userId = null
            if (fundNumber && projectDetails.title) {
                try {
                    const metrics = await getProposalMetrics({
                        fundNumber,
                        title: projectDetails.title,
                        csrfToken: LIDO_CSRF_TOKEN
                    })
                    // Create voting data without user_id for Supabase storage
                    voting = {
                        proposalId: metrics.proposalId,
                        yes_votes_count: metrics.yes_votes_count,
                        no_votes_count: metrics.no_votes_count,
                        abstain_votes_count: metrics.abstain_votes_count,
                        unique_wallets: metrics.unique_wallets
                    }
                    userId = metrics.user_id

                    if (userId) {
                        successfulUserIds.add(userId)
                        console.log(`[User ID] ✅ Tracked user ID: ${userId}`)
                    }

                    console.log(`[Metrics] ✅ Found voting data for "${projectDetails.title}"`)
                } catch (err) {
                    console.error(`[Metrics] ❌ Failed to fetch voting metrics for "${projectDetails.title}":`, err)
                    // Track failed titles for second pass
                    failedTitles.push({
                        projectId,
                        title: projectDetails.title,
                        fundNumber
                    })
                }
            } else {
                console.log(`[Metrics] ⏭️ Skipping metrics fetch - missing fundNumber or title`)
                // Track failed titles for second pass
                failedTitles.push({
                    projectId,
                    title: projectDetails.title,
                    fundNumber
                })
            }

            // Process milestones (calculate completion and extract content) in a single query
            console.log(`[Main] Starting milestone processing for proposal ${projectDetails.id} (${projectDetails.title})`)
            const { milestonesCompleted, milestonesContent } = await processProposalMilestones(projectDetails.id, projectDetails.project_id)
            console.log(`[Main] ✅ Milestone processing finished: ${milestonesCompleted} completed milestones for proposal ${projectDetails.id}`)

            // Fill in challenge and link information for each milestone
            if (milestonesContent && Object.keys(milestonesContent).length > 0) {
                const challengeTitle = (projectDetails.challenges as any)?.title || ''
                for (const milestoneKey in milestonesContent) {
                    milestonesContent[milestoneKey].challenge = challengeTitle
                    milestonesContent[milestoneKey].link = url
                }

                const totalContentLength = Object.values(milestonesContent).reduce((acc, milestone) => acc + milestone.content.length, 0)
                console.log(`[POAs] ✅ Extracted ${Object.keys(milestonesContent).length} milestones with ${totalContentLength} total characters for proposal ${projectDetails.id}`)
            } else {
                console.log(`[POAs] ⚠️ No milestones content found for proposal ${projectDetails.id}`)
            }

            // Prepare data for Supabase (but don't push yet)
            const supabaseData = {
                id: projectDetails.id,
                title: projectDetails.title,
                budget: projectDetails.budget,
                milestones_qty: projectDetails.milestones_qty,
                funds_distributed: projectDetails.funds_distributed,
                project_id: projectDetails.project_id,
                challenges: projectDetails.challenges,
                name: projectDetails.title,
                category: (projectDetails.challenges as any)?.title || '',
                category_slug: categorySlug,
                fund_number: fundNumber,
                url: url,
                status: 'In Progress',
                finished: '',
                voting: voting,
                milestones_completed: milestonesCompleted,
                milestones_content: milestonesContent,
                updated_at: new Date().toISOString()
            }

            // Store in memory instead of pushing to database
            allSupabaseData.push(supabaseData)
            console.log(`✅ Prepared project ${projectId}: "${projectDetails.title}"`)
        }

        // Second pass: Try matching failed titles using user IDs
        console.log(`\n🔄 SECOND PASS: User ID matching`)
        console.log(`📊 User IDs: ${Array.from(successfulUserIds).length}, Failed titles: ${failedTitles.length}`)

        if (successfulUserIds.size > 0 && failedTitles.length > 0) {
            // Get all proposals for each successful user ID
            const userProposalsMap = new Map<number, any[]>()

            for (const userId of successfulUserIds) {
                const userProposals = await getProposalsByUserId(userId, LIDO_CSRF_TOKEN)
                userProposalsMap.set(userId, userProposals)
                console.log(`[User Search] User ${userId}: ${userProposals.length} proposals`)
            }

            // Try to match failed titles with user proposals
            for (const failedTitle of failedTitles) {
                let bestMatch = null
                let bestUserId = null

                // Try to find a match across all user proposals
                for (const [userId, proposals] of userProposalsMap) {
                    const match = findProposalByTitle(proposals, failedTitle.title)
                    if (match) {
                        bestMatch = match
                        bestUserId = userId
                        break
                    }
                }

                if (bestMatch && bestUserId) {
                    console.log(`[Retry] ✅ Matched "${failedTitle.title}" with "${bestMatch.title}"`)

                    // Get the original project details again
                    const projectDetails = await getProposalDetails(failedTitle.projectId)
                    if (!projectDetails) {
                        console.log(`[Retry] Could not get project details for ${failedTitle.projectId}, skipping`)
                        continue
                    }

                    // Extract category and generate URL (reuse the same logic)
                    let categorySlug = null
                    if (projectDetails.challenges && (projectDetails.challenges as any).title) {
                        categorySlug = extractCategoryFromChallenges(projectDetails.challenges as any)
                    }

                    let url = ''
                    if (failedTitle.fundNumber && projectDetails.title && categorySlug) {
                        url = generateCatalystUrl(projectDetails.title, failedTitle.fundNumber, categorySlug)
                    }

                    // Create voting data from the matched proposal
                    const voting = {
                        proposalId: bestMatch.id,
                        yes_votes_count: bestMatch.yes_votes_count,
                        no_votes_count: bestMatch.no_votes_count,
                        abstain_votes_count: bestMatch.abstain_votes_count,
                        unique_wallets: bestMatch.unique_wallets
                    }

                    // Process milestones (calculate completion and extract content) in a single query
                    console.log(`[Main] Starting milestone processing for failed title proposal ${projectDetails.id} (${projectDetails.title})`)
                    const { milestonesCompleted, milestonesContent } = await processProposalMilestones(projectDetails.id, projectDetails.project_id)
                    console.log(`[Main] ✅ Milestone processing finished for failed title: ${milestonesCompleted} completed milestones for proposal ${projectDetails.id}`)
                    if (milestonesContent && Object.keys(milestonesContent).length > 0) {
                        // Fill in challenge and link information for each milestone
                        const challengeTitle = (projectDetails.challenges as any)?.title || ''
                        for (const milestoneKey in milestonesContent) {
                            milestonesContent[milestoneKey].challenge = challengeTitle
                            milestonesContent[milestoneKey].link = url
                        }

                        const totalContentLength = Object.values(milestonesContent).reduce((acc, milestone) => acc + milestone.content.length, 0)
                        console.log(`[POAs] ✅ Extracted ${Object.keys(milestonesContent).length} milestones with ${totalContentLength} total characters for proposal ${projectDetails.id}`)
                    } else {
                        console.log(`[POAs] ⚠️ No milestones content found for proposal ${projectDetails.id}`)
                    }

                    // Prepare updated data for Supabase (but don't push yet)
                    const updatedSupabaseData = {
                        id: projectDetails.id,
                        title: projectDetails.title,
                        budget: projectDetails.budget,
                        milestones_qty: projectDetails.milestones_qty,
                        funds_distributed: projectDetails.funds_distributed,
                        project_id: projectDetails.project_id,
                        challenges: projectDetails.challenges,
                        name: projectDetails.title,
                        category: (projectDetails.challenges as any)?.title || '',
                        category_slug: categorySlug,
                        fund_number: failedTitle.fundNumber,
                        url: url,
                        status: 'In Progress',
                        finished: '',
                        voting: voting,
                        milestones_completed: milestonesCompleted,
                        milestones_content: milestonesContent,
                        updated_at: new Date().toISOString()
                    }

                    // Update the existing record in memory
                    const existingIndex = allSupabaseData.findIndex(p => p.project_id === failedTitle.projectId)
                    if (existingIndex >= 0) {
                        allSupabaseData[existingIndex] = updatedSupabaseData
                        console.log(`[Retry] ✅ Updated project ${failedTitle.projectId} with voting data`)
                    } else {
                        allSupabaseData.push(updatedSupabaseData)
                        console.log(`[Retry] ✅ Added project ${failedTitle.projectId} with voting data`)
                    }
                } else {
                    console.log(`[Retry] ❌ No match found for "${failedTitle.title}"`)
                }
            }
        }

        // FINAL STEP: Push everything to database at once
        console.log(`\n💾 PUSHING TO DATABASE: ${allSupabaseData.length} projects`)

        if (allSupabaseData.length > 0) {
            // Remove duplicates based on project_id to prevent ON CONFLICT errors
            const uniqueSupabaseData = allSupabaseData.reduce((acc: any[], current: any) => {
                const existingIndex = acc.findIndex(item => item.project_id === current.project_id)
                if (existingIndex >= 0) {
                    // Replace existing entry with the newer one (which has more complete data)
                    acc[existingIndex] = current
                    console.log(`🔄 Deduplicated project_id: ${current.project_id}`)
                } else {
                    acc.push(current)
                }
                return acc
            }, [])

            console.log(`📊 After deduplication: ${uniqueSupabaseData.length} unique projects`)

            const { data, error } = await supabaseUpsert
                .from('catalyst_proposals')
                .upsert(uniqueSupabaseData, {
                    onConflict: 'project_id'
                })

            if (error) {
                console.error(`❌ Failed to batch save projects to Supabase:`, error)
                return new Response(
                    JSON.stringify({
                        error: 'Database save failed',
                        details: error.message
                    }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    }
                )
            }

            console.log(`✅ Successfully saved ${uniqueSupabaseData.length} projects to database`)
        } else {
            console.log(`⚠️ No projects to save to database`)
        }

        // Calculate final statistics
        const projectsWithVoting = allSupabaseData.filter(p => p.voting).length
        const projectsWithoutVoting = allSupabaseData.length - projectsWithVoting
        const secondPassSuccesses = allSupabaseData.filter(p => p.voting && !PROJECT_IDS.includes(p.project_id)).length
        const projectsWithMilestonesContent = allSupabaseData.filter(p => p.milestones_content && Object.keys(p.milestones_content).length > 0).length

        console.log(`\n🎉 Processing Complete!`)
        console.log(`📊 Summary:`)
        console.log(`   • Total projects processed: ${allSupabaseData.length}/${PROJECT_IDS.length}`)
        console.log(`   • Projects with voting data: ${projectsWithVoting}`)
        console.log(`   • Projects without voting data: ${projectsWithoutVoting}`)
        console.log(`   • Projects with milestones content: ${projectsWithMilestonesContent}`)
        console.log(`   • Second pass successes: ${secondPassSuccesses}`)
        console.log(`   • Successful user IDs collected: ${successfulUserIds.size}`)
        console.log(`   • Failed titles retried: ${failedTitles.length}`)

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Catalyst proposals fetched and saved successfully',
                processed_count: allSupabaseData.length,
                projects: allSupabaseData,
                successful_user_ids: Array.from(successfulUserIds),
                failed_titles_count: failedTitles.length
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    } catch (err) {
        console.error('❌ Failed to process Catalyst proposals:', err)
        console.error('🔍 Error details:', {
            name: err instanceof Error ? err.name : 'Unknown',
            message: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined
        })
        return new Response(
            JSON.stringify({
                error: 'Internal Server Error',
                details: err instanceof Error ? err.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
} 