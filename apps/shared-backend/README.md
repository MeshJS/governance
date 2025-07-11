# API Machine 🚀

A comprehensive API testing and development platform for hosting API routes, Netlify functions, and background functions. Built with Next.js, this platform provides a clean interface for testing Discord and GitHub integrations, along with reusable scripts for GitHub Actions.

## 🏗️ Project Structure

```
api-machine/
├── 📁 pages/                      # Next.js pages and API routes
│   ├── 📁 api/                    # Next.js API endpoints
│   │   ├── 📁 discord/            # Discord API routes
│   │   │   ├── stats.ts           # Discord stats endpoint
│   │   │   └── webhook.ts         # Discord webhook handler
│   │   ├── 📁 github/             # GitHub API routes
│   │   │   ├── repos.ts           # GitHub repos endpoint
│   │   │   └── actions.ts         # GitHub actions endpoint
│   │   └── 📁 utils/              # Utility API endpoints
│   │       ├── auth.ts            # Authentication utilities
│   │       └── validation.ts      # Validation utilities
│   ├── 📁 api-test/               # Frontend testing interface
│   │   ├── index.tsx              # Main testing dashboard
│   │   ├── discord.tsx            # Discord API tests
│   │   └── github.tsx             # GitHub API tests
│   ├── _app.tsx                   # Next.js app wrapper
│   └── index.tsx                  # Home page
│
├── 📁 components/                 # Reusable React components
│   ├── 📁 ui/                     # Basic UI components
│   ├── 📁 api-test/               # API testing components
│   └── 📁 layout/                 # Layout components
│
├── 📁 lib/                        # Shared utilities and services
│   ├── 📁 services/               # External service integrations
│   │   ├── discord.ts             # Discord service functions
│   │   └── github.ts              # GitHub service functions
│   ├── 📁 utils/                  # Utility functions
│   │   └── api.ts                 # API helpers
│   └── 📁 types/                  # TypeScript type definitions
│       ├── common.ts              # Common types
│       ├── discord.ts             # Discord types
│       └── github.ts              # GitHub types
│
├── 📁 netlify/                    # Netlify serverless functions
│   └── 📁 functions/
│       ├── 📁 discord/            # Discord Netlify functions
│       ├── 📁 github/             # GitHub Netlify functions
│       └── 📁 utils/              # Utility Netlify functions
│
├── 📁 scripts/                    # Development and GitHub Actions scripts
│   ├── 📁 github-actions/         # Working scripts for other projects
│   │   ├── discord-stats.js       # Discord stats collection
│   │   └── github-repo-stats.js   # GitHub repo stats collection
│   ├── 📁 templates/              # Reusable templates
│   │   ├── basic-discord-stats.js # Discord stats template
│   │   └── github-action.yml      # GitHub Actions workflow template
│   └── 📁 testing/                # Test utilities
│       ├── test-discord-api.js    # Discord API tests
│       └── test-github-api.js     # GitHub API tests
│
├── 📁 styles/                     # CSS and styling
├── package.json                   # Dependencies and scripts
├── next.config.js                 # Next.js configuration
├── netlify.toml                   # Netlify configuration
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Discord Bot Token (for Discord features)
- GitHub Personal Access Token (for GitHub features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd api-machine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   GITHUB_TOKEN=your_github_personal_access_token
   NEXT_PUBLIC_DISCORD_GUILD_ID=your_discord_guild_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🧪 Testing Interface

The platform includes a comprehensive testing interface at `/api-test`:

### Discord Testing (`/api-test/discord`)
- 📊 Get Discord Stats
- 🔄 Get Stats with Backfill
- 🔗 Test Webhook
- ✅ Validate Guild ID

### GitHub Testing (`/api-test/github`)
- 📦 Get Repository Info
- 🚀 Trigger GitHub Action
- ✅ Validate Repository Format
- 🔐 Test GitHub Auth

## 📡 API Endpoints

### Discord APIs

#### `GET /api/discord/stats`
Fetch Discord server statistics.

**Query Parameters:**
- `guildId` (required): Discord server ID
- `backfill` (optional): Set to 'true' for historical data
- `year` (optional): Year to backfill from (default: 2025)

**Response:**
```json
{
  "memberCount": 150,
  "totalMessages": 1250,
  "uniquePosters": 45,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### `POST /api/discord/webhook`
Handle Discord webhook events.

### GitHub APIs

#### `GET /api/github/repos`
Fetch GitHub repository information.

**Query Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name

#### `POST /api/github/actions`
Trigger GitHub Actions workflows.

**Body:**
```json
{
  "owner": "username",
  "repo": "repository-name",
  "workflow_id": "ci.yml",
  "ref": "main"
}
```

### Utility APIs

#### `POST /api/utils/auth`
Validate authentication tokens.

#### `POST /api/utils/validation`
Validate various data formats.

## 🔧 Scripts

### GitHub Actions Scripts

#### Discord Stats Collection
```bash
node scripts/github-actions/discord-stats.js
```

**Environment Variables:**
- `DISCORD_TOKEN`: Discord bot token
- `GUILD_ID`: Discord server ID
- `OUTPUT_FILE`: Output file path (optional)
- `BACKFILL`: Set to 'true' for historical data
- `BACKFILL_YEAR`: Year to backfill from

#### GitHub Repository Stats
```bash
node scripts/github-actions/github-repo-stats.js
```

**Environment Variables:**
- `GITHUB_TOKEN`: GitHub personal access token
- `GITHUB_OWNER`: Repository owner
- `GITHUB_REPO`: Repository name
- `OUTPUT_FILE`: Output file path (optional)

### Testing Scripts

#### Discord API Tests
```bash
node scripts/testing/test-discord-api.js
```

#### GitHub API Tests
```bash
node scripts/testing/test-github-api.js
```

## 📋 Templates

### Discord Stats Template
Copy `scripts/templates/basic-discord-stats.js` to your project and customize:

1. Update configuration variables
2. Set environment variables
3. Install dependencies: `npm install discord.js`
4. Run: `node basic-discord-stats.js`

### GitHub Actions Workflow Template
Copy `scripts/templates/github-action.yml` to `.github/workflows/`:

```yaml
name: Monthly Stats Collection
on:
  schedule:
    - cron: '0 0 1 * *'  # First day of each month
  workflow_dispatch:     # Manual trigger
```

## 🔐 Environment Variables

### Required
- `DISCORD_TOKEN`: Discord bot token
- `GITHUB_TOKEN`: GitHub personal access token

### Optional
- `NEXT_PUBLIC_DISCORD_GUILD_ID`: Discord server ID for testing
- `OUTPUT_FILE`: Custom output path for scripts
- `BACKFILL`: Enable historical data collection
- `BACKFILL_YEAR`: Year to start backfill from

## 🚀 Deployment

### Netlify Deployment

1. **Connect your repository** to Netlify
2. **Set environment variables** in Netlify dashboard
3. **Deploy automatically** on push to main branch

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

## 📊 Usage Examples

### Running Discord Stats Collection

```bash
# Basic usage
DISCORD_TOKEN=your_token GUILD_ID=your_guild_id node scripts/github-actions/discord-stats.js

# With backfill
DISCORD_TOKEN=your_token GUILD_ID=your_guild_id BACKFILL=true BACKFILL_YEAR=2024 node scripts/github-actions/discord-stats.js
```

### Running GitHub Stats Collection

```bash
# Basic usage
GITHUB_TOKEN=your_token GITHUB_OWNER=username GITHUB_REPO=repo-name node scripts/github-actions/github-repo-stats.js
```

### Testing APIs

```bash
# Test Discord API
DISCORD_TOKEN=your_token GUILD_ID=your_guild_id node scripts/testing/test-discord-api.js

# Test GitHub API
GITHUB_TOKEN=your_token node scripts/testing/test-github-api.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include environment details and error messages

## 🔄 Updates

This project is actively maintained. Check the releases page for updates and new features.

---

**Happy API Testing! 🎉** 