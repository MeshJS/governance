import {
    readRegistry,
    fetchAllOrgConfigsFromRegistry,
    extractCatalystProjectIdsFromConfig,
    toSortedCommaSeparatedIds,
} from './org-config-utils.mjs';

async function main() {
    const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

    const registry = readRegistry();
    const entries = await fetchAllOrgConfigsFromRegistry({ registry, githubToken });

    const allIds = entries.flatMap((entry) => extractCatalystProjectIdsFromConfig({ configJson: entry.configJson }));
    const csv = toSortedCommaSeparatedIds(allIds);

    // Write to GitHub Actions output if available
    if (process.env.GITHUB_OUTPUT) {
        const fs = await import('fs');
        fs.default.appendFileSync(process.env.GITHUB_OUTPUT, `project_ids=${csv}\n`);
    }

    // Also print to stdout for easy debugging
    console.log(csv);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});


