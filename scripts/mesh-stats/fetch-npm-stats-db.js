import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
    upsertPackage,
    updatePackageStats,
    insertPackageStatsHistory,
    upsertMonthlyDownloads,
    getAllPackages
} from './database-client.js';

// Add Discord webhook URL - this should be set as an environment variable
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscordNotification(message) {
    if (!DISCORD_WEBHOOK_URL) {
        console.error('Discord webhook URL not set');
        return;
    }
    try {
        await axios.post(DISCORD_WEBHOOK_URL, {
            content: message
        });
    } catch (error) {
        console.error('Failed to send Discord notification:', error.message);
    }
}

// Read org-stats-config.json and parse npmPackages
const orgStatsConfigPath = path.resolve(__dirname, '../../org-stats-config.json');
const orgStatsConfig = JSON.parse(fs.readFileSync(orgStatsConfigPath, 'utf-8'));
const npmPackagesConfig = orgStatsConfig.npmPackages;

// --- NPM Stats Logic ---

async function fetchPackageStats(pkgConfig, githubToken) {
    const packageName = pkgConfig.name;
    const githubPackageId = pkgConfig.github_package_id;
    const dependentsUrlOverride = pkgConfig.dependents_url;
    console.log(`Fetching stats for ${packageName}...`);

    // Search for package in package.json
    const packageJsonResponse = await axios.get(
        'https://api.github.com/search/code',
        {
            params: { q: `"${packageName}" in:file filename:package.json` },
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${githubToken}`
            }
        }
    );

    // Search for package in any file
    const anyFileResponse = await axios.get(
        'https://api.github.com/search/code',
        {
            params: { q: `"${packageName}"` },
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${githubToken}`
            }
        }
    );

    // Get package info from npm registry
    const packageInfo = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const latestVersion = packageInfo.data['dist-tags'].latest;

    // Get dependents count from npm registry
    const dependentsResponse = await axios.get(
        'https://registry.npmjs.org/-/v1/search',
        {
            params: { text: `dependencies:${packageName}`, size: 1 }
        }
    );

    // Fetch GitHub dependents count using Cheerio (scrape GitHub dependents page)
    let githubDependentsCount = null;
    async function fetchDependentsWithRetry(url, maxRetries = 5, initialDelayMs = 2000) {
        let attempt = 0;
        let delayMs = initialDelayMs;
        while (attempt < maxRetries) {
            try {
                const response = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                return response.data;
            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) throw error;
                const status = error.response ? error.response.status : null;
                console.warn(`Error fetching ${url} (status: ${status}), retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`);
                await new Promise(res => setTimeout(res, delayMs));
                delayMs = Math.min(delayMs * 2, 32000); // exponential backoff, max 32s
            }
        }
    }
    try {
        let dependentsUrl = null;
        if (githubPackageId) {
            dependentsUrl = `https://github.com/MeshJS/mesh/network/dependents?package_id=${githubPackageId}`;
        } else if (dependentsUrlOverride) {
            dependentsUrl = dependentsUrlOverride;
        }
        if (dependentsUrl) {
            const html = await fetchDependentsWithRetry(dependentsUrl);
            const $ = cheerio.load(html);
            const selector = 'a.btn-link.selected';
            const countText = $(selector).text().trim();
            if (countText) {
                const [rawCount] = countText.split(' ');
                const dependentsCount = parseInt(rawCount.replace(/,/g, ''), 10);
                if (!isNaN(dependentsCount)) {
                    githubDependentsCount = dependentsCount;
                } else {
                    console.error('Extracted text is not a valid number:', countText);
                }
            } else {
                console.error('CSS selector did not match any content.');
            }
        }
    } catch (error) {
        console.error('Error fetching GitHub dependents count using Cheerio:', error.message);
    }

    // Fetch downloads for different time periods
    const currentDate = new Date();
    const lastDay = new Date(currentDate);
    lastDay.setDate(lastDay.getDate() - 1);

    const lastWeek = new Date(currentDate);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStart = new Date(lastWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() + 1);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

    const lastMonth = new Date(currentDate);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    const lastYear = new Date(currentDate);
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const lastYearStart = new Date(lastYear.getFullYear(), 0, 1);
    const lastYearEnd = new Date(lastYear.getFullYear(), 11, 31);

    const formatDate = date => date.toISOString().split('T')[0];
    const getDownloads = async (startDate, endDate) => {
        const response = await axios.get(
            `https://api.npmjs.org/downloads/point/${startDate}:${endDate}/${packageName}`
        );
        return response.data.downloads;
    };

    // Fetch last 12 months downloads (rolling window)
    const last12MonthsDownloadsResponse = await axios.get(
        `https://api.npmjs.org/downloads/point/last-year/${packageName}`
    );
    const last12MonthsDownloads = last12MonthsDownloadsResponse.data.downloads;

    const [lastDayDownloads, lastWeekDownloads, lastMonthDownloads, lastYearDownloads] = await Promise.all([
        getDownloads(formatDate(lastDay), formatDate(currentDate)),
        getDownloads(formatDate(lastWeekStart), formatDate(lastWeekEnd)),
        getDownloads(formatDate(lastMonthStart), formatDate(lastMonthEnd)),
        getDownloads(formatDate(lastYearStart), formatDate(lastYearEnd))
    ]);

    return {
        github_in_package_json: packageJsonResponse.data.total_count,
        github_in_any_file: anyFileResponse.data.total_count,
        github_dependents_count: githubDependentsCount,
        latest_version: latestVersion,
        npm_dependents_count: dependentsResponse.data.total,
        last_day_downloads: lastDayDownloads,
        last_week_downloads: lastWeekDownloads,
        last_month_downloads: lastMonthDownloads,
        last_year_downloads: lastYearDownloads,
        last_12_months_downloads: last12MonthsDownloads
    };
}

async function fetchMonthlyDownloadsForPackage(packageName, year) {
    const downloads = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    for (let month = 1; month <= 12; month++) {
        // Skip future months
        if (year === currentYear && month > currentMonth) {
            downloads.push({
                month,
                downloads: 0
            });
            continue;
        }

        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        try {
            const response = await axios.get(
                `https://api.npmjs.org/downloads/point/${startDate}:${endDate}/${packageName}`
            );
            downloads.push({
                month,
                downloads: response.data.downloads
            });
        } catch (error) {
            console.error(`Error fetching downloads for ${packageName} in ${year}-${month}:`, error.message);
            downloads.push({
                month,
                downloads: 0
            });
        }
    }
    return downloads;
}

export async function fetchAndSaveMeshStats(githubToken) {
    console.log('Fetching and saving Mesh SDK statistics to database...');
    // Ensure all config packages exist in the DB
    let dbPackages = await getAllPackages();
    for (const pkgConfig of npmPackagesConfig) {
        const dbPkg = dbPackages.find(p => p.name === pkgConfig.name);
        if (!dbPkg) {
            // Insert missing package
            try {
                await upsertPackage({ name: pkgConfig.name });
                console.log(`Inserted missing package: ${pkgConfig.name}`);
            } catch (err) {
                console.error(`Failed to insert package ${pkgConfig.name}:`, err.message);
            }
        }
    }
    // Fetch the updated DB package list
    dbPackages = await getAllPackages();
    // Map config packages to DB packages by name
    for (const pkgConfig of npmPackagesConfig) {
        const dbPkg = dbPackages.find(p => p.name === pkgConfig.name);
        if (!dbPkg) {
            console.warn(`Package ${pkgConfig.name} not found in DB, skipping.`);
            continue;
        }
        console.log(`\nProcessing package: ${pkgConfig.name}`);
        try {
            // Fetch stats for this package
            const stats = await fetchPackageStats(pkgConfig, githubToken);
            // Update package with new stats
            await updatePackageStats(dbPkg.id, {
                latest_version: stats.latest_version,
                npm_dependents_count: stats.npm_dependents_count,
                github_in_any_file: stats.github_in_any_file,
                github_in_repositories: stats.github_in_package_json,
                github_dependents_count: stats.github_dependents_count,
                last_day_downloads: stats.last_day_downloads,
                last_week_downloads: stats.last_week_downloads,
                last_month_downloads: stats.last_month_downloads,
                last_year_downloads: stats.last_year_downloads,
                last_12_months_downloads: stats.last_12_months_downloads,
                updated_at: new Date().toISOString()
            });
            // Save to history
            const now = new Date();
            const year = now.getFullYear();
            const monthNum = now.getMonth() + 1;
            const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;
            // Fetch monthly downloads for this package and year
            const monthlyDownloadsArr = await fetchMonthlyDownloadsForPackage(pkgConfig.name, year);
            const thisMonthDownloads = monthlyDownloadsArr.find(m => m.month === monthNum)?.downloads ?? 0;
            await insertPackageStatsHistory(dbPkg.id, monthStr, {
                npm_dependents_count: stats.npm_dependents_count,
                github_in_any_file: stats.github_in_any_file,
                github_in_repositories: stats.github_in_package_json,
                github_dependents_count: stats.github_dependents_count,
                package_downloads: thisMonthDownloads
            });
            console.log(`✅ Updated stats for ${pkgConfig.name}`);
        } catch (error) {
            console.error(`❌ Error processing ${pkgConfig.name}:`, error.message);
            await sendDiscordNotification(`⚠️ Error processing package ${pkgConfig.name}: ${error.message}`);
        }
    }
}

export async function fetchAndSaveMonthlyDownloads(year) {
    console.log(`\nFetching monthly downloads for year ${year}...`);

    const packages = await getAllPackages();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    for (const pkg of packages) {
        console.log(`Processing monthly downloads for ${pkg.name}...`);

        try {
            const monthlyDownloads = await fetchMonthlyDownloadsForPackage(pkg.name, year);

            // Save monthly downloads to database
            for (const monthData of monthlyDownloads) {
                // Skip future months
                if (year === currentYear && monthData.month > currentMonth) {
                    continue;
                }

                await upsertMonthlyDownloads(pkg.id, year, monthData.month, monthData.downloads);
            }

            console.log(`✅ Saved monthly downloads for ${pkg.name}`);
        } catch (error) {
            console.error(`❌ Error processing monthly downloads for ${pkg.name}:`, error.message);
        }
    }
}

(async () => {
    try {
        console.log('--- Mesh NPM Stats Script: START ---');
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            console.error('GITHUB_TOKEN environment variable is not set. Exiting.');
            process.exit(1);
        }
        // Log Supabase envs for debug (do not print secrets)
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Supabase environment variables are missing. Exiting.');
            process.exit(1);
        }
        console.log('Environment variables loaded.');
        // Run main stats update
        await fetchAndSaveMeshStats(githubToken);
        // Optionally, run monthly downloads for current year
        const year = new Date().getFullYear();
        await fetchAndSaveMonthlyDownloads(year);
        console.log('--- Mesh NPM Stats Script: FINISHED SUCCESSFULLY ---');
    } catch (err) {
        console.error('--- Mesh NPM Stats Script: ERROR ---');
        console.error(err);
        process.exit(1);
    }
})(); 