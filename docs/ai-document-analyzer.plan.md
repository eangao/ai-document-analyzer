 Implementation Plan: AI Document Analyzer

  Overview
                                                                                                                          Build a Next.js 16 app where users upload a PDF → AI extracts structured data → displays results in a clean dashboard.   Fully stateless MVP (no database, no auth).                                                                          
  ---
  Phase 1: Project Bootstrap & Configuration (3 steps) ✅ COMPLETED
  Step: 1 ✅
  Action: Initialize Next.js 16 + install deps (pdf-parse, @anthropic-ai/sdk, lucide-react)
  File(s): package.json
  Result: Installed pdf-parse, @anthropic-ai/sdk, lucide-react + @types/pdf-parse (dev)
  ────────────────────────────────────────
  Step: 2 ✅
  Action: Configure strict TypeScript + @/ path alias
  File(s): tsconfig.json
  Result: Already configured by create-next-app (strict: true, @/* path alias)
  ────────────────────────────────────────
  Step: 3 ✅
  Action: Next.js config + Tailwind globals
  File(s): next.config.ts, globals.css
  Result: Added serverExternalPackages for pdf-parse; extended Tailwind v4 inline theme with
    muted/border/ring/radius CSS variables (light + dark mode) for shadcn/ui foundation
  ---
  Phase 2: Core Type System (2 steps) ✅ COMPLETED
  Step: 4 ✅
  Action: Define all interfaces: DocumentAnalysis, Entity, KeyDate, FinancialItem, Obligation, RiskFlag, KeyTerm
  File(s): types/analysis.ts
  Result: Defined 7 interfaces + 4 union types (DocumentType, RiskSeverity, FinancialCategory, ObligationStatus)
  ────────────────────────────────────────
  Step: 5 ✅
  Action: Export barrel
  File(s): types/index.ts
  Result: Re-exports all 11 types from analysis.ts

  ---
  Phase 3: API Infrastructure (3 steps) ✅ COMPLETED
  Step: 6 ✅
  Action: In-memory rate limiter (5 req/min per IP, cleanup every 5 min)
  File(s): lib/rate-limit.ts
  Result: Map-based store, 5 req/min per IP, 1-min window, cleanup every 5 min, evicts entries > 2 hours.
    7 unit tests passing.
  ────────────────────────────────────────
  Step: 7 ✅
  Action: PDF extraction endpoint: validate PDF, extract via pdf-parse, truncate to 80K chars
  File(s): app/api/extract/route.ts
  Result: Validates MIME type, file size (10MB), rate limiting (5 req/min per IP), extracts via pdf-parse,
    validates min text (50 chars), truncates to 80K chars, sanitized error messages. 10 unit tests passing.
  ────────────────────────────────────────
  Step: 8 ✅
  Action: Claude analysis endpoint: rate limit check, call Claude with JSON-only system prompt, strip backticks, parse
    response
  File(s): app/api/analyze/route.ts
  Result: API key validation, JSON body parse guard (400 for malformed JSON), input truncation (80K),
    rate limiting, Claude API call (claude-sonnet-4-5-20250514), backtick stripping, JSON parsing
    with error handling, sanitized error messages. 11 unit tests passing.

  Phase 3 Summary:
    Testing infrastructure: Vitest with @vitejs/plugin-react, node environment, @/ path alias, v8 coverage provider.
    Test scripts added: npm test, npm run test:watch, npm run test:coverage.
    TDD approach: RED (failing tests) → GREEN (minimal implementation) → REFACTOR for all 3 steps.
    Total: 28 unit tests passing across 3 test suites (7 + 10 + 11).
    Code review findings addressed:
      - Added rate limiting to /api/extract endpoint (was missing)
      - Added text truncation (80K) in /api/analyze endpoint
      - Added JSON body parse guard in /api/analyze (400 for malformed JSON)
      - Improved backtick stripping regex with multiline flag
      - Added type guard on Anthropic response content
      - Sanitized error messages in both endpoints (no API key or raw error leakage)
    Build verification: npx tsc --noEmit clean, npm run build clean.
    Files created: vitest.config.ts, lib/rate-limit.ts, lib/__tests__/rate-limit.test.ts,
      app/api/extract/route.ts, app/api/extract/__tests__/route.test.ts,
      app/api/analyze/route.ts, app/api/analyze/__tests__/route.test.ts.
  ---
  Phase 4: Core UI Components (4 steps) ✅ COMPLETED
  Step: 9 ✅
  Action: Root layout + page structure (client component with state management)
  File(s): app/layout.tsx, app/page.tsx
  Result: Server layout with Geist fonts, metadata, TooltipProvider wrapper. Client page component with
    4-state machine (idle/processing/complete/error), useCallback handlers for upload lifecycle,
    conditional rendering per state. Header with FileText icon + app title.
  ────────────────────────────────────────
  Step: 10 ✅
  Action: FileUpload: drag & drop, validation, calls extract→analyze APIs
  File(s): components/FileUpload.tsx
  Result: Drag-and-drop zone with Card component, validates MIME type (PDF only) and file size (10MB),
    calls /api/extract with FormData then /api/analyze with JSON body, error handling for both API
    responses and network failures, disabled state support. 13 unit tests passing.
  ────────────────────────────────────────
  Step: 11 ✅
  Action: AnalysisLoader: step-by-step loading animation
  File(s): components/AnalysisLoader.tsx
  Result: 3-step loader (uploading/extracting/analyzing) with complete/active/pending status icons,
    CheckCircle2 for complete, Loader2 spinner for active, Circle for pending. Accessible role="status".
    8 unit tests passing.
  ────────────────────────────────────────
  Step: 12 ✅
  Action: ExportButton: JSON download
  File(s): components/ExportButton.tsx
  Result: Creates JSON blob from DocumentAnalysis, generates timestamped filename (analysis-YYYY-MM-DDTHH-MM-SS.json),
    triggers download via programmatic anchor click, disabled when data is null. 5 unit tests passing.

  Phase 4 Summary:
    TDD approach: RED → GREEN → REFACTOR for all 4 steps.
    Total: 26 unit tests passing across 3 test suites (13 + 8 + 5).
    Testing infrastructure updated: vitest.config.ts with jsdom environment, @vitejs/plugin-react,
      vitest.setup.ts with @testing-library/jest-dom/vitest.
    New dev dependencies: @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom.
    Build verification: npx tsc --noEmit clean, npm run build clean.
    Files created: components/FileUpload.tsx, components/__tests__/FileUpload.test.tsx,
      components/AnalysisLoader.tsx, components/__tests__/AnalysisLoader.test.tsx,
      components/ExportButton.tsx, components/__tests__/ExportButton.test.tsx, vitest.setup.ts.
    Files modified: app/layout.tsx, app/page.tsx, vitest.config.ts, package.json.
  ---
  Phase 5: Dashboard Components (8 steps)

  All components use shadcn/ui (Card, Badge, Table, Alert, Separator, Tooltip) with color coding per CLAUDE.md.
  ┌──────┬───────────────────────┬───────────────────────────────────────────────────────────────────────┬────────┐
  │ Step │       Component       │                             Key Features                              │  Risk  │
  ├──────┼───────────────────────┼───────────────────────────────────────────────────────────────────────┼────────┤
  │ 13   │ AnalysisDashboard.tsx │ Grid layout wrapper (1→2 cols responsive)                             │ Low    │
  ├──────┼───────────────────────┼───────────────────────────────────────────────────────────────────────┼────────┤
  │ 14   │ SummaryCard.tsx       │ Doc type badge (color-coded), summary text                            │ Low    │
  ├──────┼───────────────────────┼───────────────────────────────────────────────────────────────────────┼────────┤
  │ 15   │ RiskFlags.tsx         │ Severity alerts: high=red, medium=yellow, low=blue                    │ Low    │
  ├──────┼───────────────────────┼───────────────────────────────────────────────────────────────────────┼────────┤
  │ 16   │ EntitiesAndDates.tsx  │ Two-column: entities with tooltips + dates with importance badges     │ Low    │
  ├──────┼───────────────────────┼───────────────────────────────────────────────────────────────────────┼────────┤
  │ 17   │ FinancialItems.tsx    │ Currency formatting, color-coded amounts (payment=green, penalty=red) │ Low    │
  ├──────┼───────────────────────┼───────────────────────────────────────────────────────────────────────┼────────┤
  │ 18   │ ObligationsTable.tsx  │ Table with status badges, responsive card fallback on mobile          │ Medium │
  ├──────┼───────────────────────┼───────────────────────────────────────────────────────────────────────┼────────┤
  │ 19   │ KeyTerms.tsx          │ Terms with definitions, grouped by category                           │ Low    │
  ├──────┼───────────────────────┼───────────────────────────────────────────────────────────────────────┼────────┤
  │ 20   │ ActionItems.tsx       │ Checklist-style list                                                  │ Low    │
  └──────┴───────────────────────┴───────────────────────────────────────────────────────────────────────┴────────┘
  ---
  Phase 6: shadcn/ui Setup (1 step) ✅ COMPLETED
  Step: 21 ✅
  Action: Install via CLI: Card, Badge, Button, Table, Alert, Separator, Tooltip, Skeleton
  Result: All 8 shadcn/ui components installed via `npx shadcn@latest add`. New-york style, neutral base color,
    CSS variables enabled. components.json configured with @/ aliases. lib/utils.ts created with cn() helper
    (clsx + tailwind-merge). globals.css updated with full shadcn/ui CSS variable theme (light + dark mode).
    Dependencies added: radix-ui, class-variance-authority, clsx, tailwind-merge, tw-animate-css.
    Files created: components.json, lib/utils.ts, components/ui/{card,badge,button,table,alert,separator,tooltip,skeleton}.tsx.
    Files modified: app/globals.css, package.json, package-lock.json.

  ---
  Phase 7: Integration & Verification (2 steps)
  ┌──────┬─────────────────────────────────────────────────────────────────────────────────────┬────────┐
  │ Step │                                       Action                                        │  Risk  │
  ├──────┼─────────────────────────────────────────────────────────────────────────────────────┼────────┤
  │ 22   │ Wire page.tsx state: FileUpload → AnalysisLoader → AnalysisDashboard + ExportButton │ Medium │
  ├──────┼─────────────────────────────────────────────────────────────────────────────────────┼────────┤
  │ 23   │ npx tsc --noEmit + npm run build + manual PDF testing                               │ Medium │
  └──────┴─────────────────────────────────────────────────────────────────────────────────────┴────────┘
  ---
  Phase 8: Deployment (2 steps)
  ┌──────┬───────────────────────────────────────┬──────┐
  │ Step │                Action                 │ Risk │
  ├──────┼───────────────────────────────────────┼──────┤
  │ 24   │ .env.local template + .gitignore      │ Low  │
  ├──────┼───────────────────────────────────────┼──────┤
  │ 25   │ README with setup/deploy instructions │ Low  │
  └──────┴───────────────────────────────────────┴──────┘
  ---
  Dependency Graph

  Phase 1 ✅ → Phase 2 ✅ → Phase 3 ✅ → Phase 4 ✅ → Phase 5 → Phase 7 → Phase 8
                                           ↑
                                    Phase 6 ✅ (shadcn/ui install - done early)

  Critical Path: Bootstrap → Types → API Routes → Page + FileUpload → Dashboard → Integration

  Parallelizable: Steps 10-12 (after step 9), Steps 14-20 (all dashboard components)

  ---
  Key Risks & Mitigations
  Risk: Claude JSON parsing failures
  Severity: High
  Mitigation: System prompt enforces JSON-only; strip backticks; try-catch with fallback error message
  ────────────────────────────────────────
  Risk: Image-only PDFs (no OCR)
  Severity: Medium
  Mitigation: Validate extracted text ≥ 50 chars; show "scanned PDFs not supported"
  ────────────────────────────────────────
  Risk: Rate limiter memory leak
  Severity: Medium
  Mitigation: Cleanup expired entries every 5 min; evict entries > 2 hours old
  ────────────────────────────────────────
  Risk: ANTHROPIC_API_KEY missing in prod
  Severity: High
  Mitigation: Validate at route start; clear error message in UI
  ────────────────────────────────────────
  Risk: File upload security
  Severity: Medium
  Mitigation: Validate type + extension + size; never store files; process & discard
  ---
  Recommended Execution Order

  1. Phase 1 + Phase 6 together (bootstrap + install shadcn/ui components)
  2. Phase 2 (types - fast, unlocks everything else)
  3. Phase 3 (API routes - testable independently via curl)
  4. Phase 4 + Phase 5 (UI components, many parallelizable)
  5. Phase 7 (integration + verification)
  6. Phase 8 (deployment prep)