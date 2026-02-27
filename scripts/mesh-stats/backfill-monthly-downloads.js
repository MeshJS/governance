/**
 * Targeted backfill script for missing/incomplete monthly download data.
 *
 * Fetches exact download counts from the npm API and upserts them into
 * both the `monthly_downloads` and `package_stats_history` Supabase tables.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node backfill-monthly-downloads.js
 *
 * The npm download counts API returns authoritative numbers — the same
 * values shown on npmjs.com. No estimation or sampling is involved.
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// --- Config -----------------------------------------------------------

const PACKAGES = [
  '@meshsdk/core',
  '@meshsdk/react',
  '@meshsdk/transaction',
  '@meshsdk/wallet',
  '@meshsdk/provider',
  '@meshsdk/contract',
  '@meshsdk/common',
  '@meshsdk/web3-sdk',
  '@meshsdk/core-csl',
  '@meshsdk/core-cst',
];

// Months to backfill (add more entries here if needed in the future)
const MONTHS_TO_BACKFILL = [
  { year: 2025, month: 11 },
  { year: 2025, month: 12 },
];

// --- Supabase ---------------------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- npm API ----------------------------------------------------------

async function fetchNpmDownloads(packageName, year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month
  const url = `https://api.npmjs.org/downloads/point/${startDate}:${endDate}/${packageName}`;

  const response = await axios.get(url);
  return response.data.downloads;
}

// --- Main -------------------------------------------------------------

async function main() {
  console.log('=== Monthly Downloads Backfill ===\n');

  // Resolve package IDs from the database
  const { data: dbPackages, error } = await supabase
    .from('packages')
    .select('id, name')
    .in('name', PACKAGES);

  if (error) {
    console.error('Failed to fetch packages from database:', error.message);
    process.exit(1);
  }

  const pkgMap = new Map(dbPackages.map(p => [p.name, p.id]));

  let totalUpdated = 0;

  for (const { year, month } of MONTHS_TO_BACKFILL) {
    const label = `${year}-${String(month).padStart(2, '0')}`;
    console.log(`--- ${label} ---`);

    for (const pkgName of PACKAGES) {
      const packageId = pkgMap.get(pkgName);
      if (!packageId) {
        console.warn(`  ${pkgName}: not found in database, skipping`);
        continue;
      }

      try {
        const downloads = await fetchNpmDownloads(pkgName, year, month);

        // Upsert into monthly_downloads
        const { error: mdError } = await supabase
          .from('monthly_downloads')
          .upsert(
            { package_id: packageId, year, month, downloads },
            { onConflict: 'package_id,year,month' }
          );
        if (mdError) throw new Error(`monthly_downloads upsert failed: ${mdError.message}`);

        // Upsert into package_stats_history
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        const { error: pshError } = await supabase
          .from('package_stats_history')
          .upsert(
            { package_id: packageId, month: monthStr, package_downloads: downloads },
            { onConflict: 'package_id,month' }
          );
        if (pshError) throw new Error(`package_stats_history upsert failed: ${pshError.message}`);

        console.log(`  ${pkgName}: ${downloads.toLocaleString()} downloads — upserted`);
        totalUpdated++;
      } catch (err) {
        console.error(`  ${pkgName}: ERROR — ${err.message}`);
      }
    }
    console.log();
  }

  console.log(`Done. Updated ${totalUpdated} rows across both tables.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
