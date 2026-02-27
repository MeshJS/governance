# Shared Patterns

Cross-cutting knowledge that applies across multiple skills. When a pattern is learned in one context, it lives here so all skills benefit.

This file grows organically through the `/wrap-up` skill. Start minimal — add patterns as you discover them.

---

## Project Conventions

<!-- Add project-specific conventions here as you learn them -->
<!-- Examples: -->
<!-- - Import order convention -->
<!-- - Naming conventions -->
<!-- - File organization patterns -->
<!-- - Data transformation conventions -->

---

## Framework Gotchas

<!-- Add framework-specific gotchas here -->
<!-- Examples: -->
<!-- - React: useEffect dependency array pitfalls -->
<!-- - Next.js: SSR vs CSR data fetching patterns -->
<!-- - Django: QuerySet lazy evaluation gotchas -->

---

## Architecture Patterns

<!-- Add architectural patterns discovered during development -->
<!-- Examples: -->
<!-- - API proxy patterns -->
<!-- - State management conventions -->
<!-- - Caching strategies -->
<!-- - Error handling patterns -->

---

## Context Window Conservation

**Critical**: Large files eat context fast when read repeatedly. Follow these rules:

- **Grep first, read second**: Use `Grep` with `-n` to find exact line numbers before reading
- **Narrow reads**: Always pass `offset` and `limit` to `Read`. Aim for 10-20 lines around the target
- **One read per edit**: Read the target area once, make the edit, move on. Don't re-read to verify
- **Use `replace_all`**: When the same pattern repeats across a file, use `replace_all: true`
- **Skip verification reads**: After an edit, don't read the file to confirm — the Edit tool reports success/failure
- **Subagents for exploration**: Use `Explore` agent for broad codebase research so findings don't bloat the main context
