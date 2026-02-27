# Mesh Governance Dashboard

## Project Overview

Governance transparency dashboard for the MeshJS organization on Cardano. Tracks DRep voting, Catalyst proposals, SDK adoption metrics, contributor activity, and community engagement.

## Tech Stack

- **Framework**: Next.js 16 (Pages Router)
- **Language**: TypeScript (strict mode)
- **Styling**: CSS Modules only (no external frameworks)
- **State Management**: React Context + localStorage caching
- **Data Visualization**: Recharts (primary), D3.js, @xyflow/react
- **Backend**: GitHub-hosted JSON data, GitHub API, Discord API, minimal Supabase
- **Deployment**: Vercel-optimized

## Project Structure

```
apps/mesh-gov/src/
├── components/              # 45+ React components
│   ├── Layout.tsx          # Main app wrapper
│   ├── Navigation.tsx      # Glassmorphism sidebar
│   ├── *Chart.tsx          # Data visualization (Recharts-based)
│   ├── *Modal.tsx          # Modal components
│   └── *.module.css        # Component-specific styles
├── contexts/
│   └── DataContext.tsx     # Centralized state management
├── config/
│   └── filterConfig.ts     # Filter configurations
├── lib/
│   ├── dataContext/        # Data fetching functions
│   ├── supabase.ts        # Supabase client
│   ├── discord.ts         # Discord API utilities
│   └── githubApiUtils.ts  # GitHub API functions
├── pages/                  # Next.js Pages Router
│   ├── index.tsx          # Dashboard homepage (4-column grid)
│   ├── drep-voting.tsx    # DRep governance section
│   ├── catalyst-proposals.tsx
│   ├── mesh-stats.tsx     # SDK usage analytics
│   ├── projects.tsx       # Project showcase
│   ├── contributors.tsx   # Contributor network
│   └── api/              # API routes
├── styles/                # CSS Modules
│   ├── globals.css       # Global styles & CSS variables
│   └── *.module.css
├── types/                 # TypeScript definitions
└── utils/
```

Other directories at repo root: `voting-history/`, `funding/`, `scripts/`, `cardano-gov-roles/`, `community-config-registry/`, `mesh-bounty-board/`.

## Key Patterns

### Data Flow
```
GitHub JSON / APIs → API Routes → DataContext (React Context) → localStorage cache → Components
```

### State Management
- Each data source has independent loading/error states (`isLoadingMesh`, `isLoadingCatalyst`, etc.)
- 5-minute localStorage cache with stale-while-revalidate
- Lazy loading for non-critical data (contributors)

### Design System
- **Brand Teal**: `rgb(12, 242, 180)` — primary accent
- **Background**: `#000000` (pure black)
- **Cards**: `#141414` with glassmorphism (`backdrop-filter: blur(20px)`)
- **Text**: `#ffffff` primary, `#aaaaaa` secondary
- **Borders**: `#333333`

## Coding Conventions

### Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Styles: `ComponentName.module.css`
- Types: `PascalCase`

### Component Pattern
```typescript
import styles from './ComponentName.module.css';
const ComponentName: React.FC<Props> = ({ ... }) => { ... };
export default ComponentName;
```

### Path Aliases
`@/` maps to `src/`

## Claude Code Tooling

### Hooks (`.claude/hooks.json`)

Event-driven automations:

**PreToolUse:**
- **Doc file blocker** — Blocks creation of random `.md`/`.txt` files outside allowed paths
- **Git push warning** — Warns before pushing to review changes first

**PostToolUse:**
- **Debug statement warning** — Warns when debug statements are added to source files

**Stop:**
- **Debug statement audit** — Scans modified files at session end

### Skills (`.claude/skills/`)

**Quality skills:**
- `build-fix` - Build and fix errors with guardrails
- `verify` - Pre-PR verification loop (build, types, lint, security)
- `code-review` - Security and quality review of uncommitted changes
- `security-review` - Deep security audit

**Meta skills:**
- `journey` - Create session learning logs
- `wrap-up` - End-of-session learning consolidation
- `reflect` - Deep reflection on skill system
- `context` - Context window conservation rules

### Contexts (`.claude/contexts/`)

- **`dev`** — Active coding mode. Write code first, explain after.
- **`review`** — Code review mode. Read thoroughly, prioritize by severity.

### Skill Learning System

Skills improve through a natural learning loop:

```
Work (use skill) → Notice & annotate inline → /wrap-up consolidates → Skills improve
```

**During work:** Leave inline learning notes when skill instructions are wrong/incomplete:
```markdown
<!-- LEARNING 2026-02-27: Discovered that X needs Y because Z -->
```

**At session end:** `/wrap-up {title}` consolidates everything.

## Build & Dev

All commands run from `apps/mesh-gov/`:

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint checking
npm run lint:fix     # Auto-fix linting issues
npm run format       # Prettier formatting
npm run type-check   # TypeScript validation
```

## Critical Files

- `src/contexts/DataContext.tsx` - Central state management
- `src/styles/globals.css` - Design system CSS variables
- `src/components/Layout.tsx` - Main app structure
- `src/components/Navigation.tsx` - Sidebar navigation
- `config.ts` - Application configuration
- `MESH_GOV_DEV_GUIDE.md` - Detailed development reference
