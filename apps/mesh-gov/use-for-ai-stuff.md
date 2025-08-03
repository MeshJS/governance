# Mesh Governance Dashboard - Development Guide

## Overview

The Mesh Governance Dashboard is a Next.js 15 application that provides transparency into Mesh's governance activities, SDK usage, and contributor statistics. It features a modern dark theme with glassmorphism design and comprehensive data visualization.

## Architecture

### Tech Stack
- **Framework**: Next.js 15.2.4 with Pages Router
- **Language**: TypeScript
- **Styling**: CSS Modules (no external CSS framework)
- **Data Visualization**: Recharts (primary), D3.js, @xyflow/react
- **State Management**: React Context + localStorage caching
- **Deployment**: Vercel-ready

### Core Dependencies
```json
{
  "next": "15.2.4",
  "react": "^18.2.0",
  "@xyflow/react": "^12.6.0",
  "d3": "^7.9.0",
  "recharts": "^2.15.2",
  "react-markdown": "^10.1.0",
  "@supabase/supabase-js": "^2.52.0"
}
```

## Design System

### Color Palette
```css
/* Primary Colors (RGB values for blending) */
--primary-rgb: 0, 122, 255            /* Blue primary */
--card-bg-rgb: 28, 30, 35             /* Dark card background */
--status-success-rgb: 12, 242, 180    /* Teal green - key brand color */
--status-blue-rgb: 0, 122, 255        /* Status blue */
--status-warning-rgb: 255, 193, 7     /* Warning yellow */
--status-error-rgb: 255, 76, 76       /* Error red */

/* Background Colors */
--background: #000000                  /* Pure black background */
--text-color: #ffffff                  /* Primary text */
--text-secondary: #aaaaaa              /* Secondary text */
--border-color: #333333                /* Border color */

/* Card & UI Elements */
--card-bg: #141414                     /* Card background */
--sidebar-bg: #141414                  /* Sidebar background */
--item-hover: #1a1a1a                 /* Hover states */
```

### Key Brand Colors
- **Primary Teal**: `rgb(12, 242, 180)` - Used for accents, success states, gradients
- **Pure Black**: `#000000` - Main background
- **Dark Gray**: `#141414` - Cards and UI elements
- **White**: Various opacities for text and borders

### Glassmorphism Effects
```css
/* Standard glass effect */
background: linear-gradient(165deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.08);
```

### Animation & Transitions
- **Standard transition**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- **Hover transform**: `translateY(-2px)` to `translateY(-4px)`
- **Floating animations**: Individual timing for nav items (4.6s - 5.5s)

## Project Structure

```
src/
├── components/           # React components
├── contexts/            # DataContext for state management
├── lib/                 # Core business logic
│   ├── dataContext/     # Data fetching functions
│   ├── supabase.ts      # Supabase client (minimal usage)
│   ├── discord.ts       # Discord API utilities
│   └── githubApiUtils.ts
├── pages/               # Next.js pages
│   ├── index.tsx        # Dashboard homepage
│   ├── drep-voting.tsx  # DRep voting section
│   ├── catalyst-proposals.tsx
│   ├── mesh-stats.tsx
│   ├── projects.tsx
│   ├── contributors.tsx
│   └── api/            # API routes (minimal)
├── styles/             # CSS Modules
├── types/              # TypeScript definitions
└── types.ts            # Shared types
```

## Key Components

### Core Layout Components
- **Layout.tsx**: Main layout wrapper with sidebar
- **Navigation.tsx**: Glassmorphism sidebar navigation
- **PageHeader.tsx**: Consistent page headers

### Data Visualization Components
- **Recharts-based**: Primary charting library
  - `DonutChart.tsx`, `VotesDonutChart.tsx`
  - `RepositoriesEvolutionChart.tsx`
  - `DelegationGrowthChart.tsx`
- **D3.js**: Advanced visualizations
- **@xyflow/react**: Flow diagrams and network graphs

### Feature Components
- **DRep Section**: Voting history, delegation data
- **Catalyst Section**: Proposal tracking, milestone progress
- **Contributors**: GitHub stats, network visualization
- **Mesh Stats**: SDK usage, download metrics

## Data Management

### DataContext Structure
```typescript
interface DataContextType {
  // Data states
  meshData: MeshData | null;
  catalystData: CatalystContextData | null;
  drepVotingData: DRepVotingData | null;
  discordStats: DiscordStats | null;
  contributorStats: ContributorStats | null;
  
  // Loading states (individual per data source)
  isLoadingMesh: boolean;
  isLoadingCatalyst: boolean;
  isLoadingDRep: boolean;
  isLoadingDiscord: boolean;
  isLoadingContributors: boolean;
  
  // Error states (individual per data source)
  meshError: string | null;
  catalystError: string | null;
  drepError: string | null;
  discordError: string | null;
  contributorsError: string | null;
}
```

### Caching Strategy
- **localStorage**: 5-minute cache duration (configurable)
- **Individual data sources**: Separate caching per data type
- **Lazy loading**: Contributors data loaded on demand
- **ISR-ready**: Weekly data refreshes supported

### Data Sources
1. **GitHub-hosted JSON files**: Primary data source
2. **GitHub API**: Contributor statistics
3. **Discord API**: Community metrics
4. **Supabase**: Minimal usage, mainly for future features

## Main Sections

### 1. Overview Dashboard (`/`)
- **Grid layout**: 4-column responsive grid
- **Preview cards**: Large preview images for each section
- **Loading states**: Individual per data source
- **Main sections**: DRep, Catalyst, Stats, Projects, Contributors

### 2. DRep Voting (`/drep-voting`)
- **Voting history**: Chronological voting decisions
- **Delegation data**: Stake pool information
- **Rationales**: Detailed voting explanations
- **Epoch tracking**: Historical delegation growth

### 3. Catalyst Proposals (`/catalyst-proposals`)
- **Funding overview**: Budget distribution charts
- **Milestone tracking**: Progress bars and completion status
- **Project details**: Individual proposal information
- **Status filtering**: Active, completed, in-progress

### 4. Mesh Stats (`/mesh-stats`)
- **NPM downloads**: Package usage statistics
- **GitHub metrics**: Repository statistics
- **Discord activity**: Community engagement
- **Dependency tracking**: Ecosystem adoption

### 5. Projects (`/projects`)
- **Showcase**: Featured projects using Mesh SDK
- **Builder directory**: Community projects
- **Categorization**: By project type/status

### 6. Contributors (`/contributors`)
- **GitHub statistics**: Commit and PR tracking
- **Contributor network**: Visual relationship mapping
- **Activity timeline**: Historical contribution patterns
- **Repository breakdown**: Per-repo contribution stats

## Styling Guidelines

### CSS Modules Convention
```css
/* File naming: ComponentName.module.css */
.componentName {
  /* Component-specific styles */
}
```

### Class Naming
- **camelCase**: For CSS classes
- **Descriptive names**: `.sectionHeader`, `.loadingIndicator`
- **State modifiers**: `.navItem.active`, `.section.compactCard`

### Responsive Design
```css
/* Mobile breakpoint */
@media (max-width: 767px) {
  /* Mobile-specific styles */
}
```

### Hover Effects Standard
```css
.hoverCard {
  transition: var(--hover-transition);
}

.hoverCard:hover {
  transform: var(--hover-transform);
  box-shadow: var(--hover-shadow);
}
```

## Development Patterns

### Component Guidelines
1. **Functional components**: No class components
2. **TypeScript**: Strict typing throughout
3. **RORO pattern**: Receive/Return objects for complex functions
4. **Descriptive naming**: `isLoading`, `hasError`, etc.

### File Organization
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.module.css
└── types.ts (if needed)
```

### Import Patterns
```typescript
// React & Next.js
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Contexts & hooks
import { useData } from '../contexts/DataContext';

// Components
import ComponentName from './ComponentName';

// Styles
import styles from './ComponentName.module.css';

// Types
import { TypeName } from '../types';
```

## Performance Optimizations

### Image Handling
- **Next.js Image**: All images use `next/image`
- **Priority loading**: Critical images marked with `priority`
- **Responsive sizing**: `style={{ width: 'auto', height: 'auto' }}`

### Code Splitting
- **Page-level**: Automatic Next.js splitting
- **Component-level**: Dynamic imports where beneficial
- **Data loading**: Lazy loading for non-critical data

### Caching Strategy
- **Client-side**: localStorage with TTL
- **Stale-while-revalidate**: Show cached data while fetching fresh
- **Error boundaries**: Graceful degradation

## Development Commands

```bash
# Development
npm run dev

# Building
npm run build
npm run start

# Code quality
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run type-check
```

## UI Patterns

### Loading States
```typescript
{isLoading && <div className={styles.loadingIndicator}>Loading...</div>}
{error && <div className={styles.errorIndicator}>Error: {error}</div>}
```

### Glassmorphism Cards
```css
.glassCard {
  background: linear-gradient(165deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}
```

### Gradient Text Effects
```css
.gradientText {
  background: linear-gradient(90deg,
    rgba(12, 242, 180, 0.9) 0%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(12, 242, 180, 0.9) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Mobile Considerations

- **Responsive navigation**: Collapses to mobile-friendly format
- **Touch targets**: 44px minimum for interactive elements
- **Optimized spacing**: Adjusted padding for mobile viewports
- **Performance**: Lazy loading and optimized images

## Future Development

### Planned Features
- **Real-time updates**: WebSocket integration for live data
- **Enhanced filtering**: Advanced search and filtering options
- **User preferences**: Theme customization and layout options
- **API endpoints**: RESTful API for external consumption

### Technical Debt
- **Test coverage**: Unit and integration tests needed
- **Error boundaries**: More granular error handling
- **Accessibility**: ARIA labels and keyboard navigation
- **SEO optimization**: Meta tags and structured data

---

## Key Files Reference

### Critical Files
- `src/contexts/DataContext.tsx` - Main state management
- `src/styles/globals.css` - Global styles and CSS variables
- `src/types.ts` - Shared TypeScript definitions
- `config.ts` - Configuration management

### Entry Points
- `src/pages/_app.tsx` - App initialization
- `src/pages/index.tsx` - Main dashboard
- `src/components/Layout.tsx` - Main layout wrapper

### Style System
- `src/styles/globals.css` - Global styles, variables, theme
- `src/styles/Navigation.module.css` - Navigation styling patterns
- `src/styles/Layout.module.css` - Layout and responsive design
- `src/styles/Dashboard.module.css` - Dashboard-specific styles

This guide serves as the foundation for understanding and extending the Mesh Governance dashboard. Follow these patterns and conventions to maintain consistency and code quality. 
