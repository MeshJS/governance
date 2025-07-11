# Shared Backend API

This Next.js application provides API routes and Netlify functions that serve as a shared backend for the dashboard applications in this monorepo. It handles data fetching, processing, and storage for Catalyst proposals and Discord statistics.

## Overview

The shared-backend serves as a centralized API layer that:
- Provides RESTful API endpoints for dashboard applications
- Runs background functions to fetch and update data
- Manages data storage in Supabase
- Handles authentication and data processing

## Architecture

### API Routes (`pages/api/`)

#### Catalyst API (`/api/catalyst/`)

- **`/api/catalyst/proposals`** - Fetches Catalyst proposal data
  - Query parameters: `projectIds` (comma-separated), `since` (optional timestamp)
  - Returns proposal details with freshness indicators
  - Status: `completed`, `partial`, or `stale`

- **`/api/catalyst/status`** - Checks status of Catalyst proposal data
  - Query parameters: `projectIds` (comma-separated), `since` (optional timestamp)
  - Returns data freshness and availability status
  - Useful for monitoring data updates

#### Discord API (`/api/discord/`)

- **`/api/discord/status`** - Checks Discord statistics status
  - Query parameters: `guildId`, `since` (optional timestamp)
  - Returns Discord server statistics and freshness status
  - Status: `completed`, `stale`, or `pending`

### Netlify Functions (`netlify/functions/`)

#### Background Functions

- **`catalyst-proposals-background.mts`** - Fetches and updates Catalyst proposal data
  - Integrates with Lido Nation API to get voting metrics
  - Updates Supabase with proposal details and voting statistics
  - Handles multiple Catalyst funds and proposal matching
  - Runtime: Node.js 18.x

- **`discord-stats-background.mts`** - Fetches and updates Discord server statistics
  - Uses Discord API to collect server member statistics
  - Supports backfill functionality for historical data
  - Updates Supabase with Discord statistics
  - Runtime: Node.js 18.x

## Data Sources

### Catalyst Proposals
- **Lido Nation API**: Primary source for Catalyst proposal data and voting metrics
- **Supabase**: Storage for processed proposal data and voting statistics
- **Authentication**: Uses CSRF tokens for Lido Nation API access

### Discord Statistics
- **Discord API**: Source for server member statistics and activity data
- **Supabase**: Storage for processed Discord statistics
- **Authentication**: Uses Discord bot tokens for API access

## Environment Variables

### Required Variables

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_PUBLIC=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Catalyst Database (separate from main Supabase)
CATALYST_SUPABASE_URL=your_catalyst_supabase_url
CATALYST_SUPABASE_ANON_KEY=your_catalyst_supabase_key

# Lido Nation API
LIDO_CSRF_TOKEN=your_lido_csrf_token

# Discord API
DISCORD_TOKEN=your_discord_bot_token
```

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build functions
npm run build:functions
```

### Production Deployment

The application is configured for deployment on Netlify with:
- API routes served as serverless functions
- Background functions configured in `netlify.toml`
- Automatic builds and deployments

## API Usage Examples

### Check Catalyst Proposal Status

```bash
curl "http://localhost:3000/api/catalyst/status?projectIds=1000107,1100271"
```

### Fetch Discord Statistics

```bash
curl "http://localhost:3000/api/discord/status?guildId=123456789"
```

### Trigger Background Functions

```bash
# Catalyst proposals update
curl "https://your-netlify-app.netlify.app/.netlify/functions/catalyst-proposals-background"

# Discord stats update
curl "https://your-netlify-app.netlify.app/.netlify/functions/discord-stats-background?guildId=123456789"
```

## Data Flow

1. **Background Functions** run periodically to fetch fresh data from external APIs
2. **Data Processing** occurs in the background functions before storage
3. **Supabase Storage** holds processed data with timestamps
4. **API Routes** serve data to dashboard applications with freshness indicators
5. **Dashboard Apps** consume the API routes for real-time data display

## Monitoring

The API routes provide status endpoints that help monitor:
- Data freshness (recent updates within 5 minutes)
- Missing data for requested project IDs
- Overall system health and availability

## Dependencies

- **Next.js**: Framework for API routes and server-side rendering
- **Supabase**: Database and authentication
- **Discord.js**: Discord API integration
- **Axios**: HTTP client for external API calls
- **TypeScript**: Type safety and development experience

## Contributing

When adding new API routes or functions:
1. Follow the existing patterns for error handling and response formatting
2. Include proper TypeScript types
3. Add appropriate environment variable documentation
4. Update this README with new endpoint documentation
