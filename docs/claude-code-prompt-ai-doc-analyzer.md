# Claude Code Prompt — AI Document Analyzer Build

> Copy-paste each prompt into Claude Code (Cursor IDE) in sequence.
> You have the ECC plugin installed. Use `/plan` before building, `/tdd` for tests, `/code-review` before committing.

---

## PROMPT 1: Project Scaffold + shadcn/ui Setup

```
/plan

I'm building an "AI Document Analyzer" — a Next.js 16 app where users upload a PDF and get AI-powered structured analysis (summary, key entities, dates, obligations, risk flags, financial items, action items) displayed in a clean dashboard.

Tech stack:
- Next.js 16 (App Router, Turbopack, TypeScript)
- Tailwind CSS + shadcn/ui for all UI components
- Claude API (@anthropic-ai/sdk) using claude-sonnet-4-5-20250514
- pdf-parse for PDF text extraction
- lucide-react for icons
- No database (MVP — results returned in real-time, no login/auth)
- No src/ directory — everything at root level
- Deploy to Vercel

Project structure:
ai-document-analyzer/
├── app/
│   ├── api/
│   │   ├── extract/route.ts       ← PDF text extraction endpoint
│   │   └── analyze/route.ts       ← Claude API analysis endpoint
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── FileUpload.tsx              ← Drag & drop PDF upload
│   ├── AnalysisLoader.tsx          ← Step-by-step loading animation
│   ├── ExportButton.tsx            ← JSON export
│   └── dashboard/
│       ├── AnalysisDashboard.tsx   ← Layout wrapper
│       ├── SummaryCard.tsx
│       ├── RiskFlags.tsx
│       ├── EntitiesAndDates.tsx
│       ├── FinancialItems.tsx
│       ├── ObligationsTable.tsx
│       ├── KeyTerms.tsx
│       └── ActionItems.tsx
├── types/
│   └── analysis.ts                 ← TypeScript interfaces
├── lib/
│   └── rate-limit.ts               ← Simple in-memory rate limiter
├── .env.local
└── next.config.ts

Create the implementation plan first. Do NOT start coding yet.
```

---

## PROMPT 2: Scaffold & Install

```
Scaffold the project now. Run these steps in order:

1. Run: npx create-next-app@latest ai-doc-analyzer
   Options: TypeScript=Yes, ESLint=Yes, Tailwind=Yes, src/=NO, App Router=Yes, Turbopack=Yes, import alias=@/*

2. cd ai-doc-analyzer

3. Install dependencies:
   npm install pdf-parse @anthropic-ai/sdk lucide-react
   npm install -D @types/pdf-parse

4. Initialize shadcn/ui:
   npx shadcn@latest init
   When prompted: style=New York, base color=Neutral, CSS variables=Yes

5. Add these shadcn components:
   npx shadcn@latest add card badge button table tabs alert separator skeleton tooltip

6. Create .env.local with:
   ANTHROPIC_API_KEY=your_api_key_here

7. Verify next.config.ts is clean TypeScript config (Turbopack is default in Next.js 16).

Confirm when all installations succeed before proceeding.
```

---

## PROMPT 3: Types + API Routes

```
Create the TypeScript types and both API routes.

FILE 1: types/analysis.ts
Define these interfaces:
- Entity { name: string; role: string }
- KeyDate { date: string; description: string }
- FinancialItem { description: string; amount: string; type: "payment"|"fee"|"penalty"|"total"|"tax"|"discount" }
- Obligation { party: string; obligation: string; deadline: string }
- RiskFlag { severity: "high"|"medium"|"low"; description: string; section: string }
- KeyTerm { term: string; explanation: string }
- DocumentAnalysis { summary, documentType, keyEntities, keyDates, financialItems, obligations, riskFlags, keyTerms, actionItems }
- AnalysisResponse { analysis: DocumentAnalysis; tokensUsed: { input: number; output: number } }

FILE 2: lib/rate-limit.ts
Simple in-memory rate limiter — 5 requests per minute per IP using a Map.

FILE 3: app/api/extract/route.ts
POST endpoint that:
- Accepts FormData with a "file" field
- Validates it's a PDF under 10MB
- Uses pdf-parse to extract text (add @ts-expect-error for pdf-parse types)
- Returns { text, pages, fileName, fileSize }

FILE 4: app/api/analyze/route.ts
POST endpoint that:
- Rate limits by IP (5/min)
- Receives { text, fileName } as JSON body
- Truncates text to 80,000 chars if needed
- Calls Claude API (claude-sonnet-4-5-20250514, max_tokens 4096)
- System prompt: expert document analyst, returns valid JSON only
- User prompt: provides the document text + JSON schema for structured extraction
- Schema extracts: summary, documentType, keyEntities, keyDates, financialItems, obligations, riskFlags, keyTerms, actionItems
- Cleans response (strips markdown backticks), parses JSON
- Returns { analysis, tokensUsed }
- Handles SyntaxError separately with "AI returned invalid format" message
```

---

## PROMPT 4: Upload Component

```
Create components/FileUpload.tsx — a drag-and-drop PDF upload component.

Use shadcn/ui Card component as the drop zone wrapper. Use lucide-react icons (Upload, FileText, X, Loader2).

Props:
- onFileProcessed: (data: { text, pages, fileName, fileSize }) => void
- isLoading: boolean

Behavior:
- Drag & drop zone with visual feedback (border color change on drag)
- Click to browse files
- Validates PDF type and 10MB max size
- Shows file name after selection with X to remove
- Shows Loader2 spinner when isLoading
- Posts FormData to /api/extract
- Calls onFileProcessed with the response
- Shows error messages using shadcn Alert component

Make it look clean and professional. The drop zone should be prominent with good padding and rounded corners.
```

---

## PROMPT 5: Dashboard Components

```
Create all dashboard components in components/dashboard/. Use shadcn/ui components throughout — Card, Badge, Table, Separator, Tooltip where appropriate.

1. SummaryCard.tsx — Shows summary text + documentType as a shadcn Badge with color coding (blue=contract, green=invoice, purple=report, red=legal, yellow=financial)

2. RiskFlags.tsx — Sorts by severity (high→low). Each risk in a shadcn Alert variant. High=destructive red, Medium=yellow bg, Low=blue bg. Shows description + section reference. Use AlertTriangle/AlertCircle/Info icons.

3. EntitiesAndDates.tsx — Two-column grid (md:grid-cols-2). Left card: Key Parties with name + role. Right card: Key Dates with date (mono font, blue) + description. Use Users and Calendar icons.

4. FinancialItems.tsx — List with description, type badge, and amount. Color code amounts by type (green=payment, red=penalty, bold=total, purple=discount). Use DollarSign icon.

5. ObligationsTable.tsx — shadcn Table with columns: Party, Obligation, Deadline. Clean zebra striping.

6. KeyTerms.tsx — Term in bold + explanation below. Use Separator between items.

7. ActionItems.tsx — Checklist style with CheckCircle2 icons (green). Each item as a row.

8. AnalysisDashboard.tsx — Assembles all above in a vertical stack with gap-4 spacing. Only renders sections that have data (check array length > 0).

All components should receive typed props from types/analysis.ts. Show "(count)" next to each section header.
```

---

## PROMPT 6: Main Page + Loading Animation

```
Create components/AnalysisLoader.tsx — a step-by-step loading indicator with 3 steps:
1. "Extracting text from PDF..." (FileText icon)
2. "AI is analyzing the document..." (Brain icon)  
3. "Analysis complete!" (CheckCircle2 icon)

Use shadcn Card as wrapper. Active step pulses with animate-pulse. Completed steps show green. Future steps are gray/muted.

Then update app/page.tsx as the main page:

States: isLoading, loadingStep ("extracting"|"analyzing"|"done"), analysis (DocumentAnalysis|null), docInfo, error

Flow:
1. Show hero title "AI Document Analyzer" + subtitle
2. Show FileUpload component
3. On file processed → set loadingStep to "analyzing" → POST to /api/analyze → set analysis result
4. When analysis exists, show:
   - Header bar with fileName, page count, ExportButton, and "Analyze another" button
   - AnalysisDashboard with the analysis data
5. "Analyze another" resets all state

Also create components/ExportButton.tsx — uses shadcn Button with Download icon. Exports analysis as JSON file named "{filename}-analysis.json".

Update app/layout.tsx with proper metadata (title: "AI Document Analyzer — Instant PDF Analysis"), Inter font, and clean body styling.
```

---

## PROMPT 7: Review & Polish

```
/code-review

Review the entire project for:
1. TypeScript errors — run `npx tsc --noEmit`
2. Missing imports or shadcn components not installed
3. API route error handling completeness
4. Component prop types matching the analysis interfaces
5. Loading states and error states working correctly
6. Mobile responsiveness (all grids should stack on small screens)
7. Accessibility basics (labels, aria attributes on interactive elements)

Fix any issues found. Then run `npm run build` to verify no build errors.
```

---

## PROMPT 8: Pre-Deploy Cleanup

```
Final cleanup before deploying:

1. Make sure .env.local is in .gitignore
2. Create a professional README.md with:
   - Project title + description
   - Live demo link placeholder
   - Features list
   - Tech stack
   - Quick start instructions (clone, install, env setup, dev)
   - Built by section with my name: Elmar Angao, Full Stack Developer | AI Integration Specialist
   - Contact: elmarcera@gmail.com

3. Remove any console.log statements
4. Verify all API error responses return proper HTTP status codes
5. Run `npm run build` one final time — zero errors

Then initialize git:
git init
git add .
git commit -m "AI Document Analyzer MVP - Next.js 16 + shadcn/ui + Claude API"
```

---

## Quick Reference — ECC Commands to Use During Build

| When | Command |
|------|---------|
| Before starting any feature | `/plan` |
| When writing tests first | `/tdd` |
| Before committing | `/code-review` |
| If build breaks | `/build-fix` |
| To clean dead code | `/refactor-clean` |

---

## Notes

- If shadcn init fails, try: `npx shadcn-ui@latest init` (older package name)
- If pdf-parse gives type errors, use `@ts-expect-error` on the import
- Model string for Claude API: `claude-sonnet-4-5-20250514`
- No database, no auth — keep it simple for MVP
- Vercel deployment: just add ANTHROPIC_API_KEY in Vercel env settings
