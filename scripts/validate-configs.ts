/// <reference types="node" />
import fs from 'fs';
import axios from 'axios';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

type Registry = Array<{
    slug: string;
    displayName: string;
    enabled?: boolean;
    config: { repo: string; path: string; ref: string };
}>;

const registry: Registry = JSON.parse(fs.readFileSync('registry.json', 'utf8'));
const schema = JSON.parse(fs.readFileSync('schema/community-config.schema.json', 'utf8'));

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);
const validate = ajv.compile(schema);

(async () => {
    const errors: string[] = [];
    for (const entry of registry) {
        if (entry.enabled === false) continue;
        const rawUrl = `https://raw.githubusercontent.com/${entry.config.repo}/${entry.config.ref}/${entry.config.path}`;
        try {
            const { data } = await axios.get(rawUrl, { timeout: 15000 });
            const valid = validate(data);
            if (!valid) {
                errors.push(`[${entry.slug}] schema errors: ${ajv.errorsText(validate.errors, { separator: ' | ' })}`);
                continue;
            }
            // minor extra checks
            const cfg = data as any;
            if (!cfg.mainOrganization?.name) {
                errors.push(`[${entry.slug}] mainOrganization.name is required`);
            }
        } catch (e: any) {
            errors.push(`[${entry.slug}] failed to fetch/parse ${rawUrl}: ${e.message}`);
        }
    }
    if (errors.length) {
        console.error(errors.join('\n'));
        process.exit(1);
    } else {
        console.log('All referenced configs are valid ✅');
    }
})();
