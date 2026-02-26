# CLAUDE.md — AI Document Analyzer

## Project Overview
AI Document Analyzer — Upload a PDF (contract, invoice, report) → AI extracts structured data, generates a summary, identifies key terms/dates/obligations → displays results in a clean dashboard.

**Stack**: Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS + shadcn/ui + Claude API + Vercel
**No src/ directory** — everything at root level.
**No database** — MVP returns results in real-time. No login, no auth, no saved history.

## Architecture

```
Frontend (Next.js 16 App Router + shadcn/ui)
  → /api/extract (PDF text extraction via pdf-parse)
  → /api/analyze (Claude API structured analysis)
  → Dashboard components render the JSON response
```

## File Structure Rules
- `app/` — Pages and API routes only (App Router)
- `components/` — All React components. Dashboard components go in `components/dashboard/`
- `types/` — TypeScript interfaces and types
- `lib/` — Utility functions (rate limiter, helpers)
- `components/ui/` — shadcn/ui components (DO NOT edit manually — managed by shadcn CLI)

## Code Style & Conventions

### TypeScript
- Strict mode. No `any` types — use proper interfaces from `types/analysis.ts`
- Use `interface` for object shapes, `type` for unions/intersections
- All API responses must be typed
- Use `@ts-expect-error` only for pdf-parse import (known type issue)

### React / Next.js
- Use `"use client"` directive only on components that need interactivity (state, effects, event handlers)
- Server components by default — only add client directive when necessary
- All page components in `app/` are server components unless they need client interactivity
- Use Next.js App Router conventions: `page.tsx`, `layout.tsx`, `route.ts` for API routes
- Import alias: `@/` maps to project root

### Styling
- **shadcn/ui components first** — use Card, Badge, Button, Table, Alert, Separator, Skeleton, Tooltip before writing custom CSS
- Tailwind CSS for all custom styling — no CSS modules, no styled-components, no inline styles
- Use Tailwind's core utility classes only
- Mobile-first responsive: all grid layouts must stack on small screens (`grid-cols-1 md:grid-cols-2`)
- Color coding conventions:
  - Risk severity: high=red, medium=yellow, low=blue
  - Document types: contract=blue, invoice=green, report=purple, legal=red, financial=yellow
  - Financial items: payment=green, penalty=red, total=bold, discount=purple

### Components
- One component per file
- Props interfaces defined in the same file or imported from `types/`
- Conditional rendering: check `array.length > 0` before rendering list sections
- Use lucide-react for all icons

### API Routes
- All API routes in `app/api/` using Next.js Route Handlers
- Always validate input (file type, size, required fields)
- Always return proper HTTP status codes (400, 429, 500)
- Rate limiting on AI endpoints (5 requests/min per IP)
- Truncate large documents to 80,000 chars before sending to Claude API
- Strip markdown backticks from Claude responses before JSON.parse

### Claude API
- Model: `claude-sonnet-4-5-20250514`
- Max tokens: 4096
- System prompt instructs JSON-only output — no markdown, no backticks, no explanation text
- Always wrap JSON.parse in try-catch with specific SyntaxError handling

## Key Interfaces (types/analysis.ts)
```typescript
DocumentAnalysis {
  summary: string
  documentType: "contract" | "invoice" | "report" | "letter" | "legal" | "financial" | "other"
  keyEntities: Entity[]
  keyDates: KeyDate[]
  financialItems: FinancialItem[]
  obligations: Obligation[]
  riskFlags: RiskFlag[]
  keyTerms: KeyTerm[]
  actionItems: string[]
}
```

## Environment Variables
- `ANTHROPIC_API_KEY` — Required. Set in `.env.local` (local) and Vercel env settings (production)
- Never hardcode API keys. Never commit `.env.local`

## Commands
```bash
npm run dev          # Start dev server (Turbopack is default in Next.js 16)
npm run build        # Production build — must pass with zero errors before deploy
npx tsc --noEmit     # Type check without emitting
```

## Git Workflow

Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`

### SSH Hosts

This project uses **only** the personal GitHub account.

| Host | Account | Remote URL |
|------|---------|-----------|
| `github-personal` | Personal (`eangao`) | `git@github-personal:eangao/ai-document-analyzer.git` |

### Commit / Push Rules

- Always use `github-personal` SSH host for this repo.
- No `Co-Authored-By` line -- commits are personal.
- Use local git config defaults for author name and email.

### Branch Strategy

- **Main branch:** `main` (production-ready, protected)
- **Staging branch:** `staging` (pre-production, merge to `main` via PR — create when MVP is ready)
- **Dev branch:** `dev` (active development, all MVP work happens here)
- **Feature branches:** Create from `dev` for post-MVP work, merge back via PR.

**MVP phase:** Work directly on `dev`. No feature branches needed during initial build.
**Post-MVP:** `dev` → PR to `staging` → PR to `main` → deploy.

Push with:

```bash
git push -u origin dev

## Do NOT
- Do NOT add a database, auth, or user accounts — this is an MVP
- Do NOT install additional CSS libraries (no Material UI, no Chakra, no Ant Design)
- Do NOT create a `src/` directory
- Do NOT edit files in `components/ui/` — those are managed by shadcn CLI
- Do NOT use `localStorage` or `sessionStorage`
- Do NOT leave `console.log` statements in production code
- Do NOT use default exports for non-page components (use named exports except for pages)

## Testing Approach
- Run `npm run build` as the primary verification — zero errors required
- Type checking via `npx tsc --noEmit`
- Manual testing: upload a real PDF and verify all dashboard sections render correctly
- Test with different document types: contracts, invoices, reports

## Deployment
- Platform: Vercel
- Add `ANTHROPIC_API_KEY` in Vercel project settings → Environment Variables
- Verify build passes on Vercel before considering deploy complete
