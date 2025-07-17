import { fetchAndSaveMeshStats, fetchAndSaveMonthlyDownloads, fetchAndSaveContributorsAndActivity } from './fetch-mesh-stats-data-db.js';

// Configuration
const CONFIG = {
    fetchCurrentStats: true,      // Set to false to skip current stats
    fetchMonthlyDownloads: true,  // Set to false to skip monthly downloads
    fetchContributors: true,      // Set to false to skip contributors
    years: [2024, 2025]          // Years to fetch monthly downloads for
};

async function main() {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
        console.error('GITHUB_TOKEN environment variable is required');
        process.exit(1);
    }

    try {
        console.log('Starting Mesh SDK Stats Generation (Database)...\n');

        // Fetch and save current stats for all packages
        if (CONFIG.fetchCurrentStats) {
            console.log('=== Fetching Current Stats ===');
            await fetchAndSaveMeshStats(githubToken);
        }

        // Fetch and save monthly downloads for specified years
        if (CONFIG.fetchMonthlyDownloads) {
            console.log('\n=== Fetching Monthly Downloads ===');
            for (const year of CONFIG.years) {
                console.log(`\nProcessing year ${year}...`);
                await fetchAndSaveMonthlyDownloads(year);
            }
        }

        // Fetch and save contributors
        if (CONFIG.fetchContributors) {
            console.log('\n=== Fetching Contributors ===');
            await fetchAndSaveContributorsAndActivity(githubToken);
        }

        console.log('\n✅ Stats generated and saved to database successfully!');
    } catch (error) {
        console.error('❌ Error generating stats:', error);
        process.exit(1);
    }
}

main(); 