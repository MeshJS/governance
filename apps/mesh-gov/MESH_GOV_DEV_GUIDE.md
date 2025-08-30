# Mesh Governance Dashboard - Complete Development Guide

helpful guide to kickstart ai dev sessions

## 🎯 Overview

The Mesh Governance Dashboard is a sophisticated Next.js 15 application showcasing Mesh's governance activities, SDK adoption, and community metrics. Built with a modern glassmorphism dark theme and comprehensive data visualization capabilities.

## 🏗️ Technical Architecture

### Core Stack

- **Framework**: Next.js 15.2.4 (Pages Router)
- **Language**: TypeScript (strict typing throughout)
- **Styling**: CSS Modules only (no external frameworks)
- **State Management**: React Context + localStorage caching
- **Data Visualization**: Recharts (primary), D3.js, @xyflow/react
- **Backend**: Minimal Supabase usage, GitHub-hosted JSON data
- **Deployment**: Vercel-optimized

### Key Dependencies

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

## 🎨 Design System & Brand Identity

### Color Palette

```css
/* Core Brand Colors */
--status-success-rgb:
  12, 242,
  180 /* PRIMARY TEAL - Key brand color */ --background: #000000 /* Pure black background */
    --card-bg: #141414 /* Dark gray cards/UI */ --text-color: #ffffff /* Primary white text */
    --text-secondary: #aaaaaa /* Secondary gray text */ /* Status Colors */ --status-blue-rgb: 0,
  122, 255 /* Links and info */ --status-warning-rgb: 255, 193,
  7 /* Warnings */ --status-error-rgb: 255, 76,
  76 /* Errors */ --border-color: #333333 /* Borders */;
```

### Glassmorphism Effects

```css
/* Standard Glass Card */
background: linear-gradient(165deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;

/* Enhanced Hover Glass Effect */
box-shadow:
  0 12px 32px -8px rgba(0, 0, 0, 0.2),
  0 4px 16px -4px rgba(0, 0, 0, 0.1),
  0 0 0 1px rgba(255, 255, 255, 0.1) inset;
```

### Animation Standards

```css
/* Standard Transitions */
--transition-fast: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
--transition-medium: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover Transform Pattern */
--hover-transform: translateY(-2px) to translateY(-4px);

/* Floating Navigation Animation */
animation: float 4.6s-5.5s ease-in-out infinite;
```

### Typography & Gradients

```css
/* Gradient Text Effect (Brand Pattern) */
.gradientText {
  background: linear-gradient(
    90deg,
    rgba(12, 242, 180, 0.9) 0%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(12, 242, 180, 0.9) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: gradientText 3s ease infinite;
}
```

## 📁 Project Architecture

```
src/
├── components/              # React components (45+ components)
│   ├── Layout.tsx          # Main app wrapper
│   ├── Navigation.tsx      # Glassmorphism sidebar
│   ├── PageHeader.tsx      # Consistent page headers
│   ├── *Chart.tsx          # Data visualization components
│   ├── *Modal.tsx          # Modal components
│   └── *.module.css        # Component-specific styles
├── contexts/
│   └── DataContext.tsx     # Centralized state management
├── lib/                    # Business logic & utilities
│   ├── dataContext/        # Data fetching functions
│   ├── supabase.ts        # Minimal Supabase client
│   ├── discord.ts         # Discord API utilities
│   └── githubApiUtils.ts  # GitHub API functions
├── pages/                  # Next.js pages (Pages Router)
│   ├── index.tsx          # Main dashboard (4-column grid)
│   ├── drep-voting.tsx    # DRep governance section
│   ├── catalyst-proposals.tsx # Catalyst funding tracking
│   ├── mesh-stats.tsx     # SDK usage analytics
│   ├── projects.tsx       # Project showcase
│   ├── contributors.tsx   # Contributor network
│   └── api/              # API routes (minimal)
├── styles/                # CSS Modules
│   ├── globals.css       # Global styles & CSS variables
│   ├── Dashboard.module.css # Homepage grid layout
│   ├── Navigation.module.css # Sidebar styles
│   └── *.module.css     # Component-specific styles
├── types/                 # TypeScript definitions by feature
└── types.ts              # Shared types
```

## 🔌 State Management Pattern

### DataContext Structure

```typescript
interface DataContextType {
  // Data States
  meshData: MeshData | null;
  catalystData: CatalystContextData | null;
  drepVotingData: DRepVotingData | null;
  discordStats: DiscordStats | null;
  contributorStats: ContributorStats | null;

  // Individual Loading States (key pattern)
  isLoadingMesh: boolean;
  isLoadingCatalyst: boolean;
  isLoadingDRep: boolean;
  isLoadingDiscord: boolean;
  isLoadingContributors: boolean; // Lazy loaded

  // Individual Error States
  meshError: string | null;
  catalystError: string | null;
  drepError: string | null;
  discordError: string | null;
  contributorsError: string | null;
}
```

### Caching Strategy

- **localStorage**: 5-minute cache duration (configurable via `NEXT_PUBLIC_ENABLE_DEV_CACHE`)
- **Individual sources**: Separate cache keys per data type
- **Stale-while-revalidate**: Show cached data while fetching fresh
- **Safe error handling**: Graceful localStorage fallbacks

### Data Sources

1. **GitHub-hosted JSON**: Primary data source (`/api/*` endpoints)
2. **GitHub API**: Real-time contributor statistics
3. **Discord API**: Community engagement metrics
4. **Supabase**: Future features (minimal current usage)

## 🧩 Component Patterns

### Layout Components

- **Layout.tsx**: Main wrapper with sidebar + content area
- **Navigation.tsx**: Fixed glassmorphism sidebar with floating animations
- **PageHeader.tsx**: Consistent page headers across sections

### Chart Components (Recharts-based)

- **DonutChart.tsx**: Base donut chart component
- **VotesDonutChart.tsx**: Governance voting visualization
- **RepositoriesEvolutionChart.tsx**: Repository growth over time
- **DelegationGrowthChart.tsx**: DRep delegation timeline
- **MilestoneDeliveryChart.tsx**: Catalyst milestone tracking

### Modal Components

- **ProposalModal.tsx**: Catalyst proposal details
- **ContributorModal.tsx**: Contributor profile modal
- **ProposalFullContentModal.tsx**: Extended proposal content

### UI Components

- **LoadingState.tsx**: Consistent loading indicators
- **ErrorState.tsx**: Error handling component
- **StatusCard.tsx**: Status indicator cards
- **SearchFilterBar.tsx**: Filtering interface

## 🎯 Page Structure & Functionality

### 1. Dashboard Homepage (`/`)

- **Layout**: 4-column responsive CSS Grid
- **Sections**: Large preview cards for each main section
- **Loading**: Individual loading states per data source
- **Images**: Preview images for visual appeal

### 2. DRep Voting (`/drep-voting`)

- **Voting History**: Chronological governance decisions
- **Delegation Timeline**: Growth charts with epoch tracking
- **Rationales**: Detailed voting explanations
- **Metrics**: Delegation power and delegator count

### 3. Catalyst Proposals (`/catalyst-proposals`)

- **Budget Overview**: Funding distribution donut charts
- **Milestone Tracking**: Progress bars and delivery status
- **Proposal List**: Filterable proposal grid
- **Detail Modals**: In-depth proposal information

### 4. Mesh Stats (`/mesh-stats`)

- **NPM Analytics**: Package download statistics
- **GitHub Metrics**: Repository activity and growth
- **Discord Stats**: Community engagement tracking
- **Dependency Network**: Ecosystem adoption visualization

### 5. Projects (`/projects`)

- **Featured Showcase**: Highlighted projects using Mesh SDK
- **Builder Directory**: Community project listings
- **Categorization**: Projects organized by type/status

### 6. Contributors (`/contributors`)

- **GitHub Statistics**: Commit and PR tracking per contributor
- **Network Visualization**: Contributor relationship mapping (@xyflow/react)
- **Activity Timeline**: Historical contribution patterns
- **Repository Breakdown**: Per-repo contribution statistics

## 🎨 Styling Guidelines & Patterns

### CSS Modules Convention

```css
/* File naming: ComponentName.module.css */
.componentName {
  /* Component-specific styles */
}

/* State modifiers */
.navItem.active {
}
.section.compactCard {
}
```

### Responsive Design

```css
/* Mobile-first breakpoints */
@media (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

### Hover Effect Standards

```css
.hoverCard {
  transition: var(--transition-medium);
}

.hoverCard:hover {
  transform: var(--hover-transform);
  box-shadow: var(--hover-shadow);
  border-color: rgba(255, 255, 255, 0.15);
}
```

### Navigation Animations

```css
/* Floating navigation items */
.navItem {
  animation: float 5s ease-in-out infinite;
}

.navItem:nth-child(1) {
  animation: float 5.2s ease-in-out infinite;
}
.navItem:nth-child(2) {
  animation: float 4.8s ease-in-out infinite;
}
/* Staggered timing for organic feel */
```

## 🚀 Development Patterns

### Component Structure

```typescript
// Standard component pattern
import React from 'react';
import styles from './ComponentName.module.css';
import { ComponentProps } from '../types';

interface ComponentNameProps {
  // Props with descriptive names
  isLoading: boolean;
  hasError: boolean;
  onAction: () => void;
}

const ComponentName: React.FC<ComponentNameProps> = ({
  isLoading,
  hasError,
  onAction
}) => {
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

### Data Fetching Pattern

```typescript
// lib/dataContext/fetchDataType.ts pattern
export async function fetchDataTypeForContext({
  safeSetItem,
  setData,
  setError,
  STORAGE_KEY,
}: {
  safeSetItem: (key: string, value: string) => void;
  setData: (data: DataType | null) => void;
  setError: (err: string | null) => void;
  STORAGE_KEY: string;
}) {
  try {
    // Data fetching logic
    const response = await fetch('/api/endpoint');
    const data = await response.json();

    safeSetItem(STORAGE_KEY, JSON.stringify(data));
    setData(data);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  }
}
```

### Error Handling Pattern

```typescript
// Individual error states per data source
const [meshError, setMeshError] = useState<string | null>(null);
const [catalystError, setCatalystError] = useState<string | null>(null);

// Show errors only when no data available
const showError = error && !hasAnyData;
```

## 📊 Chart Customization

### Recharts Theming

```css
/* Global chart styles in globals.css */
.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line {
  stroke: rgba(255, 255, 255, 0.1) !important;
  stroke-dasharray: 2 2 !important;
}

.recharts-tooltip-wrapper {
  background: rgba(0, 0, 0, 0.85) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  backdrop-filter: blur(10px) !important;
}
```

### Chart Color Patterns

```typescript
// Consistent color schemes across charts
const CHART_COLORS = {
  primary: 'rgb(12, 242, 180)', // Teal brand color
  secondary: 'rgb(0, 122, 255)', // Blue
  success: 'rgb(52, 199, 89)', // Green
  warning: 'rgb(255, 193, 7)', // Yellow
  error: 'rgb(255, 76, 76)', // Red
};
```

## 🔧 Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build
npm run start

# Code quality
npm run lint          # ESLint checking
npm run lint:fix      # Auto-fix linting issues
npm run format        # Prettier formatting
npm run format:check  # Check formatting
npm run type-check    # TypeScript validation
```

## 📱 Mobile Optimization

### Responsive Navigation

- Fixed glassmorphism sidebar collapses on mobile
- Touch-friendly 44px minimum tap targets
- Optimized spacing and typography for mobile

### Performance Optimizations

- Next.js Image component with `priority` loading
- Lazy loading for non-critical data (contributors)
- CSS-only animations with `will-change` optimizations
- localStorage caching reduces API calls

## 🎯 Key Development Principles

### 1. **Individual Loading States**

Each data source has independent loading/error states for better UX:

```typescript
isLoadingMesh, isLoadingCatalyst, isLoadingDRep; // etc.
```

### 2. **Glassmorphism Consistency**

All cards/modals use consistent glassmorphism effects with standardized:

- Background gradients
- Backdrop filters
- Border styles
- Hover animations

### 3. **Type Safety**

Strict TypeScript throughout with comprehensive interfaces in:

- `src/types.ts` (shared types)
- `src/types/` (feature-specific types)

### 4. **CSS Modules Only**

No external CSS frameworks - all styling through CSS Modules:

- Scoped styles prevent conflicts
- Descriptive camelCase class names
- Modular and maintainable

### 5. **Data-Driven Visualizations**

All charts are data-driven with consistent:

- Color schemes using CSS variables
- Loading states
- Error handling
- Responsive design

## 🔮 Future Development Considerations

### Planned Enhancements

- Real-time WebSocket updates for live data
- Enhanced accessibility (ARIA labels, keyboard navigation)
- Advanced filtering and search capabilities
- User preference settings (theme, layout options)

### Performance Targets

- Lighthouse score >90 across all metrics
- First Contentful Paint <2s
- Largest Contentful Paint <3s
- Cumulative Layout Shift <0.1

---

## 📚 Quick Reference

### Critical Files

- `src/contexts/DataContext.tsx` - State management
- `src/styles/globals.css` - Design system variables
- `src/components/Layout.tsx` - Main app structure
- `src/components/Navigation.tsx` - Sidebar navigation
- `config.ts` - Application configuration

### Design System Colors

- **Brand Teal**: `rgb(12, 242, 180)`
- **Background**: `#000000` (pure black)
- **Cards**: `#141414` (dark gray)
- **Text**: `#ffffff` primary, `#aaaaaa` secondary
- **Borders**: `#333333`

### Animation Timing

- **Fast**: 0.2s cubic-bezier(0.4, 0, 0.2, 1)
- **Medium**: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- **Slow**: 0.4s cubic-bezier(0.4, 0, 0.2, 1)

This guide provides the complete foundation for developing and extending the Mesh Governance dashboard while maintaining design consistency and code quality standards.
