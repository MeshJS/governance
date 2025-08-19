import fs from 'fs';

const DEFAULT_REGISTRY_PATH = 'community-config-registry/registry.json';

/**
 * Fetch JSON file content from GitHub using the contents API.
 * Accepts public or private repos; uses token when provided.
 */
export async function fetchJsonFromGitHub({ repo, path, ref = 'main', githubToken }) {
    if (!repo || !path) {
        throw new Error('fetchJsonFromGitHub: repo and path are required');
    }

    const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`;
    const headers = { Accept: 'application/vnd.github.raw' };
    if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to fetch ${repo}/${path}@${ref}: ${response.status} ${response.statusText} ${body}`);
    }

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`Invalid JSON in ${repo}/${path}@${ref}: ${(error && error.message) || error}`);
    }
}

/**
 * Read the local registry file that lists community org config locations.
 */
export function readRegistry({ registryPath = DEFAULT_REGISTRY_PATH } = {}) {
    const raw = fs.readFileSync(registryPath, 'utf-8');
    const json = JSON.parse(raw);
    if (!Array.isArray(json)) {
        throw new Error('Registry must be an array');
    }
    return json;
}

/**
 * Given a registry entry, fetch the referenced org config JSON from GitHub.
 */
export async function fetchOrgConfigFromRegistryItem({ item, githubToken }) {
    const { slug, displayName, config, enabled = true } = item || {};
    if (!enabled) return null;
    if (!config || !config.repo || !config.path) return null;
    const ref = config.ref || 'main';
    const configJson = await fetchJsonFromGitHub({
        repo: config.repo,
        path: config.path,
        ref,
        githubToken,
    });
    return { slug, displayName, repo: config.repo, ref, path: config.path, configJson };
}

/**
 * Fetch all org configs listed in the registry.
 */
export async function fetchAllOrgConfigsFromRegistry({ registry, githubToken }) {
    const results = await Promise.all(
        registry.map((item) => fetchOrgConfigFromRegistryItem({ item, githubToken }).catch(() => null))
    );
    return results.filter(Boolean);
}

/**
 * Extract Catalyst project IDs as strings from a single org config JSON.
 * Supports string with comma-separated IDs or an array of IDs.
 */
export function extractCatalystProjectIdsFromConfig({ configJson }) {
    if (!configJson) return [];
    const value = configJson.catalystProjectIds;
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v.length > 0);
    }
    return [];
}

/**
 * Extract Discord guild ID from a single org config JSON (if present).
 */
export function extractDiscordGuildIdFromConfig({ configJson }) {
    if (!configJson) return null;
    const value = configJson.discordGuildId || (configJson.discord && configJson.discord.guildId);
    return value ? String(value).trim() : null;
}

/**
 * Aggregate and deduplicate values preserving stable order of first appearance.
 */
export function uniquePreserveOrder(values) {
    const seen = new Set();
    const out = [];
    for (const v of values) {
        if (!seen.has(v)) {
            seen.add(v);
            out.push(v);
        }
    }
    return out;
}

/**
 * Helper to convert a list of numeric-like IDs to a sorted comma-separated string.
 */
export function toSortedCommaSeparatedIds(values) {
    const normalized = values.map((v) => String(v).trim()).filter((v) => v.length > 0);
    const unique = uniquePreserveOrder(normalized);
    const sorted = unique.slice().sort((a, b) => Number(a) - Number(b));
    return sorted.join(',');
}


