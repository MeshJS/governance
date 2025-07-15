import axios from 'axios';
import { PROJECTS_INFO } from './mockData.js';
import { saveCatalystData } from './save-catalyst-data.js';
import { getProposalMetrics } from './lidApi.js'; // NEW: import our Lido helper
import fs from 'fs';
import path from 'path';

// Initialize constants
const MILESTONES_BASE_URL = 'https://milestones.projectcatalyst.io';
const CATALYST_DATA_PATH = path.join(process.cwd(), 'mesh-gov-updates', 'catalyst-proposals', 'catalyst-data.json');

// Lido CSRF token for lidonation API calls
const LIDO_CSRF_TOKEN = '1bFPK309aGzzrR9EWTbGendt8xVApp8GrDBJcv5H';

// Get project IDs from environment variable
const README_PROJECT_IDS = process.env.README_PROJECT_IDS;
console.log('Project IDs from environment:', README_PROJECT_IDS);

// Supabase credentials check - we'll use mock data if they're missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL2;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2;
const USE_MOCK_DATA = !supabaseUrl || !supabaseKey;

let supabase;
if (!USE_MOCK_DATA) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
}

// Extract just the project IDs
const PROJECT_IDS = README_PROJECT_IDS
    ? README_PROJECT_IDS.split(',').map(id => id.trim())
    : PROJECTS_INFO.map(project => project.id);

/**
 * Retrieves the proposal details.
 */
async function getProposalDetails(projectId) {
    console.log(`Getting proposal details for project ${projectId}`);

    if (USE_MOCK_DATA) {
        const mockProject = PROJECTS_INFO.find(p => p.id === projectId);
        if (mockProject) {
            console.log(`Using mock data for project ${projectId}`);
            return {
                id: mockProject.id,
                title: mockProject.name,
                budget: mockProject.budget,
                milestones_qty: mockProject.milestones_qty,
                funds_distributed: mockProject.funds_distributed,
                project_id: mockProject.id,
                name: mockProject.name,
                category: mockProject.category,
                url: mockProject.url,
                status: mockProject.status,
                finished: mockProject.finished,
                voting: null // ensure voting field exists
            };
        }
        return null;
    }

    // Real data from Supabase
    const { data, error } = await supabase
        .from('proposals')
        .select(`
      id,
      title,
      budget,
      milestones_qty,
      funds_distributed,
      project_id
    `)
        .eq('project_id', projectId)
        .single();

    if (error) {
        console.error(`Error fetching proposal details for project ${projectId}:`, error);
        return null;
    }

    const supplementaryInfo = PROJECTS_INFO.find(p => p.id === projectId);
    const enhancedData = {
        ...data,
        name: supplementaryInfo?.name || data.title,
        category: supplementaryInfo?.category || '',
        url: supplementaryInfo?.url || '',
        status: supplementaryInfo?.status || 'In Progress',
        finished: supplementaryInfo?.finished || '',
        voting: null // placeholder for voting metrics
    };

    console.log(`Found proposal details for project ${projectId}:`, enhancedData);
    return enhancedData;
}

/**
 * Fetches milestone snapshot data.
 */
async function fetchSnapshotData(projectId) {
    if (USE_MOCK_DATA) return [];

    try {
        const response = await axios.post(
            `${supabaseUrl}/rest/v1/rpc/getproposalsnapshot`,
            { _project_id: projectId },
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Content-Profile': 'public',
                    'x-client-info': 'supabase-js/2.2.3'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching snapshot data for project ${projectId}:`, error);
        return [];
    }
}

/**
 * Main function.
 */
async function main() {
    console.log('Processing Catalyst data...');
    console.log('Using mock data:', USE_MOCK_DATA);

    // Load existing catalyst data
    let existingData = { projects: [] };
    try {
        const data = fs.readFileSync(CATALYST_DATA_PATH, 'utf8');
        existingData = JSON.parse(data);
    } catch (error) {
        console.log('No existing catalyst data found, will create new file');
    }

    const projectsByFund = { '10': [], '11': [], '12': [], '13': [] };

    for (const projectId of PROJECT_IDS) {
        const projectDetails = await getProposalDetails(projectId);
        if (!projectDetails) continue;

        // === UPDATED: determine fund number from category or URL ===
        let fundNumber = null;
        const catMatch = projectDetails.category.match(/^F(\d+)/i);
        if (catMatch) {
            fundNumber = catMatch[1];
        } else {
            const urlMatch = projectDetails.url.match(/\/f(\d+)-/i);
            fundNumber = urlMatch ? urlMatch[1] : null;
        }

        // Check if proposal already exists in catalyst-data.json
        const existingProject = existingData.projects.find(
            p => p.projectDetails.project_id === projectDetails.project_id
        );

        if (fundNumber && projectDetails.title && !existingProject?.projectDetails.voting) {
            console.log(`[Metrics] Fetching new metrics for project "${projectDetails.title}" (ID: ${projectId})`);
            try {
                const metrics = await getProposalMetrics({
                    fundNumber,
                    title: projectDetails.title,
                    csrfToken: LIDO_CSRF_TOKEN
                });
                projectDetails.voting = metrics;
                console.log(`[Metrics] Successfully fetched metrics for project "${projectDetails.title}"`);
            } catch (err) {
                console.error(`[Metrics] Failed to fetch voting metrics for "${projectDetails.title}":`, err);
                projectDetails.voting = null;
            }
        } else if (existingProject?.projectDetails.voting) {
            // Use existing voting data if available
            console.log(`[Metrics] Using existing metrics for project "${projectDetails.title}" (ID: ${projectId})`);
            projectDetails.voting = existingProject.projectDetails.voting;
        } else {
            console.log(`[Metrics] No metrics available for project "${projectDetails.title}" (ID: ${projectId})`);
        }
        // === end updated section ===

        const snapshotData = await fetchSnapshotData(projectId);

        let milestonesCompleted;
        if (USE_MOCK_DATA) {
            const mockProject = PROJECTS_INFO.find(p => p.id === projectId);
            milestonesCompleted = mockProject?.milestonesCompleted || 0;
        } else {
            milestonesCompleted = snapshotData.filter(
                m => m.som_signoff_count > 0 && m.poa_signoff_count > 0
            ).length;
        }

        const fundKey = fundNumber || String(projectId).substring(0, 2);
        if (projectsByFund[fundKey]) {
            projectsByFund[fundKey].push({ projectDetails, milestonesCompleted });
        }
    }

    const allProjects = Object.values(projectsByFund).flat();

    // Merge existing voting data with new data
    const mergedProjects = allProjects.map(newProject => {
        const existingProject = existingData.projects.find(
            p => p.projectDetails.project_id === newProject.projectDetails.project_id
        );

        if (existingProject?.projectDetails.voting && !newProject.projectDetails.voting) {
            console.log(`[Metrics] Preserving existing voting data for project "${newProject.projectDetails.title}"`);
            newProject.projectDetails.voting = existingProject.projectDetails.voting;
        }
        return newProject;
    });

    await saveCatalystData(mergedProjects);

    console.log('Catalyst data has been processed and saved.');
}

main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
