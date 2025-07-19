# Supabase Types

This folder contains all TypeScript types related to Supabase database operations and schema definitions.

## Structure

- `database.ts` - Contains all database table types and schema definitions
- `index.ts` - Central export file for all Supabase types

## Usage

Import Supabase types from the central location:

```typescript
import { DiscordStats, DiscordStatsTable, DiscordStatsResponse } from '../types/supabase';
```

## Adding New Types

When adding new database tables or Supabase-related types:

1. Add the interface to `database.ts`
2. Export it from `index.ts` (if not already covered by `export *`)
3. Update any existing imports to use the new location

## Guidelines

- Keep database types in `database.ts`
- Use descriptive interface names that match your table names with `Table` suffix (e.g., `DiscordStatsTable`)
- Include all required fields from your Supabase schema
- Add JSDoc comments for complex types
- Follow the existing naming conventions
- Re-export table types with original names for backward compatibility 