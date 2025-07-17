import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { fetchAndSaveMonthlyDownloads } from './fetch-mesh-stats-data-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2023 }, (_, i) => 2024 + i);
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
        console.error('GITHUB_TOKEN environment variable is required');
        process.exit(1);
    }

    try {
        console.log('Starting Yearly Mesh SDK Stats Generation (Database)...\n');

        for (const year of years) {
            console.log(`\n=== Processing year ${year} ===`);
            await fetchAndSaveMonthlyDownloads(year);
        }

        console.log('\n✅ Yearly stats generated and saved to database successfully!');
    } catch (error) {
        console.error('❌ Error generating yearly stats:', error);
        process.exit(1);
    }
}

main(); 