# Cardano Dashboard Scripts

This directory contains maintenance scripts for the Cardano Dashboard application. These scripts are primarily used by GitHub Actions to keep the dashboard data up to date.

## Available Scripts

### `update-network-totals.ts`

This script updates the network statistics in the dashboard's database. It:
- Fetches the latest chain tip from Koios API
- Retrieves network totals for recent epochs
- Enriches the data with epoch information
- Updates exchange rates from CoinGecko
- Stores the data in Supabase

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `KOIOS_API_KEY`: Koios API key

### `update-governance-proposals.ts`

This script updates the governance proposals data in the dashboard. It:
- Fetches the latest governance proposals
- Updates the data in Supabase

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `KOIOS_API_KEY`: Koios API key

## Running Scripts Locally

To run these scripts locally:

1. Ensure you have the required environment variables set
2. Navigate to the cardano-dashboard directory
3. Run the script using ts-node:
   ```bash
   npx ts-node scripts/update-network-totals.ts
   ```

## GitHub Actions

These scripts are automatically run by GitHub Actions:
- `update-network-totals.ts` runs daily at midnight UTC
- Both scripts can be manually triggered through the GitHub Actions interface

See `.github/workflows/update-cardano-dashboard-data.yml` for the workflow configuration. 