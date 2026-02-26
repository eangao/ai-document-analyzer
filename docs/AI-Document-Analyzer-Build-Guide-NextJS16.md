# AI Document Analyzer — Complete Build Guide (Next.js 16)

> **For**: Elmar Angao | **Timeline**: 5 evenings (2-3 hrs each)
> **Stack**: Next.js 16 + TypeScript + Tailwind CSS + Claude API + Vercel
> **Structure**: No `src/` directory — everything at root level
> **Purpose**: Portfolio piece → Freelance client magnet → Future SaaS product

---

## What You're Building

Upload a PDF (contract, invoice, report) → AI extracts structured data, generates a summary, identifies key terms/dates/obligations → displays results in a clean dashboard.

**Why this specific project:**
- Mirrors your Jurisora work (AI-assisted document extraction) — you already understand the domain
- Demonstrates the exact skill clients pay $75-150/hr for
- Can become a SaaS product later
- Deployable on Vercel in your existing stack

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Next.js 16 (App Router + Turbopack) + Tailwind  │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Upload  │→│ Loading  │→│ Results Dashboard│  │
│  │ Screen  │  │ State    │  │ (Tabs/Sections) │  │
│  └─────────┘  └──────────┘  └────────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ API Route
┌────────────────────▼────────────────────────────┐
│                   BACKEND                        │
│  Next.js Route Handlers (App Router)             │
│                                                   │
│  /api/analyze                                     │
│  1. Receive PDF file                              │
│  2. Extract text (pdf-parse)                      │
│  3. Send to Claude API with structured prompt     │
│  4. Return structured JSON to frontend            │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              CLAUDE API (claude-sonnet-4-5)        │
│  System prompt: "You are a document analyzer..."  │
│  Returns: JSON with summary, entities, dates,     │
│           obligations, risk flags                  │
└─────────────────────────────────────────────────┘
```

**MVP Decision: No database.** Results are returned and displayed in real-time. No login, no saved history. Add Prisma + PostgreSQL later when you turn this into a SaaS.

---

## Pre-requisites

Before starting, make sure you have:
- **Node.js 20.9.0+** (Next.js 16 minimum — run `node -v` to check)
- **Anthropic API key** from https://console.anthropic.com/settings/keys
- **Cursor IDE** with Claude Code
- **Git** configured + GitHub account

If your Node.js is older:
```bash
nvm install 22
nvm use 22
```

---

## Next.js 16 Key Differences (vs 14/15)

1. **Turbopack is the default bundler** — no flags needed. Just `next dev` and `next build`.
2. **`middleware.ts` → `proxy.ts`** — renamed. We don't use it in this project.
3. **Async `params` and `searchParams`** — must `await` them: `const { slug } = await props.params`
4. **React 19.2** — View Transitions, `useEffectEvent`, Activity components.
5. **React Compiler (stable)** — auto-memoizes components. Optional opt-in.
6. **Config is TypeScript** — `next.config.ts` instead of `.js`.

For this project, #1, #3, and #6 matter most.

---

## Day 1 (Evening 1): Project Setup + PDF Upload + Text Extraction

### Step 1: Scaffold the Project

```bash
npx create-next-app@latest ai-doc-analyzer
```

When prompted:
```
✔ Would you like to use TypeScript? → Yes
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes
✔ Would you like your code inside a `src/` directory? → NO
✔ Would you like to use App Router? → Yes
✔ Would you like to use Turbopack for next dev? → Yes
✔ Would you like to customize the import alias? → Yes → @/*
```

```bash
cd ai-doc-analyzer
```

Verify Next.js 16:
```bash
npx next --version
# Should show 16.x.x
```

### Step 2: Install Dependencies

```bash
npm install pdf-parse @anthropic-ai/sdk lucide-react
npm install -D @types/pdf-parse
```

### Step 3: Environment Variables

Create `.env.local` in project root:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

### Step 4: Next.js 16 Config

Your `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16 — no config needed
};

export default nextConfig;
```

### Step 5: PDF Upload API Route

Create: `app/api/extract/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
// @ts-expect-error - pdf-parse types are incomplete
import pdfParse from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const pdfData = await pdfParse(buffer);

    return NextResponse.json({
      text: pdfData.text,
      pages: pdfData.numpages,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract text from PDF" },
      { status: 500 }
    );
  }
}
```

### Step 6: Upload Component

Create: `components/FileUpload.tsx`

```tsx
"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";

interface FileUploadProps {
  onFileProcessed: (data: {
    text: string;
    pages: number;
    fileName: string;
    fileSize: number;
  }) => void;
  isLoading: boolean;
}

export default function FileUpload({
  onFileProcessed,
  isLoading,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (selectedFile: File) => {
      setError(null);

      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File must be under 10MB");
        return;
      }

      setFile(selectedFile);

      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        onFileProcessed(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setFile(null);
      }
    },
    [onFileProcessed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center
          transition-all duration-200 cursor-pointer
          ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 bg-white"
          }
          ${isLoading ? "pointer-events-none opacity-60" : ""}
        `}
        onClick={() => {
          if (!isLoading) document.getElementById("file-input")?.click();
        }}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-gray-600 font-medium">Processing document...</p>
          </div>
        ) : file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <span className="text-gray-700 font-medium">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="ml-2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-gray-400" />
            <div>
              <p className="text-gray-700 font-medium">
                Drop your PDF here or click to browse
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Contracts, invoices, reports — up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
```

### Step 7: Home Page (Basic)

Replace `app/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";

interface ExtractedData {
  text: string;
  pages: number;
  fileName: string;
  fileSize: number;
}

export default function Home() {
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileProcessed = (data: ExtractedData) => {
    setExtractedData(data);
    setIsLoading(false);
    console.log("Extracted text length:", data.text.length);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            AI Document Analyzer
          </h1>
          <p className="text-lg text-gray-500">
            Upload any PDF — get instant structured analysis powered by AI
          </p>
        </div>

        <FileUpload
          onFileProcessed={handleFileProcessed}
          isLoading={isLoading}
        />

        {extractedData && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Text Extracted Successfully
            </h2>
            <p className="text-sm text-gray-500">
              {extractedData.pages} pages •{" "}
              {extractedData.text.length.toLocaleString()} characters extracted
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Claude AI analysis coming in Day 2...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
```

### Step 8: Test

```bash
npm run dev
```

Open `http://localhost:3000`, upload a PDF, confirm text extraction works.

**End of Day 1:** Working upload that extracts text from PDFs.

---

## Day 2 (Evening 2): Claude API Integration + Structured Analysis

### Step 1: TypeScript Types

Create: `types/analysis.ts`

```typescript
export interface Entity {
  name: string;
  role: string;
}

export interface KeyDate {
  date: string;
  description: string;
}

export interface FinancialItem {
  description: string;
  amount: string;
  type: "payment" | "fee" | "penalty" | "total" | "tax" | "discount";
}

export interface Obligation {
  party: string;
  obligation: string;
  deadline: string;
}

export interface RiskFlag {
  severity: "high" | "medium" | "low";
  description: string;
  section: string;
}

export interface KeyTerm {
  term: string;
  explanation: string;
}

export interface DocumentAnalysis {
  summary: string;
  documentType: string;
  keyEntities: Entity[];
  keyDates: KeyDate[];
  financialItems: FinancialItem[];
  obligations: Obligation[];
  riskFlags: RiskFlag[];
  keyTerms: KeyTerm[];
  actionItems: string[];
}

export interface AnalysisResponse {
  analysis: DocumentAnalysis;
  tokensUsed: {
    input: number;
    output: number;
  };
}
```

### Step 2: Rate Limiter

Create: `lib/rate-limit.ts`

```typescript
const requests = new Map<string, number[]>();

export function rateLimit(
  ip: string,
  limit: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = requests.get(ip) || [];
  const recentRequests = timestamps.filter((t) => t > windowStart);

  if (recentRequests.length >= limit) {
    return false;
  }

  recentRequests.push(now);
  requests.set(ip, recentRequests);
  return true;
}
```

### Step 3: Analysis API Route

Create: `app/api/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const ANALYSIS_SCHEMA = `{
  "summary": "2-3 sentence executive summary of the document",
  "documentType": "contract | invoice | report | letter | legal | financial | other",
  "keyEntities": [
    { "name": "Entity name (person, company, org)", "role": "Their role in the document" }
  ],
  "keyDates": [
    { "date": "The date as written in document", "description": "What this date refers to" }
  ],
  "financialItems": [
    { "description": "What the amount is for", "amount": "Currency amount as string", "type": "payment | fee | penalty | total | tax | discount" }
  ],
  "obligations": [
    { "party": "Who is responsible", "obligation": "What they must do", "deadline": "By when (or 'Not specified')" }
  ],
  "riskFlags": [
    { "severity": "high | medium | low", "description": "What the risk is", "section": "Where in the document" }
  ],
  "keyTerms": [
    { "term": "Important term or clause name", "explanation": "What it means in plain English" }
  ],
  "actionItems": ["Specific action item extracted from the document"]
}`;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429 }
      );
    }

    const { text, fileName } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text to analyze" },
        { status: 400 }
      );
    }

    const truncatedText =
      text.length > 80000
        ? text.substring(0, 80000) + "\n\n[TRUNCATED]"
        : text;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4096,
      system:
        "You are an expert document analyst. You extract structured data from business documents (contracts, invoices, reports, legal documents). You are thorough, accurate, and flag potential risks. Always respond with valid JSON only — no markdown formatting, no backticks, no explanation text before or after the JSON.",
      messages: [
        {
          role: "user",
          content: `Analyze this document and extract structured information.

DOCUMENT NAME: ${fileName}

DOCUMENT TEXT:
---
${truncatedText}
---

Return ONLY a valid JSON object matching this exact schema (no markdown, no backticks, no explanation):

${ANALYSIS_SCHEMA}

Rules:
- If a field has no relevant data, use an empty array []
- For "documentType", pick the closest match
- For "riskFlags", identify concerning items (unfavorable terms, penalties, ambiguous language, missing clauses)
- For "keyTerms", explain legal/technical jargon in plain English
- Keep the summary concise but informative
- All dates should be in the format they appear in the document
- Financial amounts should include currency symbols as written`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const cleanJson = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const analysis = JSON.parse(cleanJson);

    return NextResponse.json({
      analysis,
      tokensUsed: {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI returned invalid format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
```

### Step 4: Update Home Page for Full Flow

Replace `app/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import type { DocumentAnalysis } from "@/types/analysis";

interface ExtractedData {
  text: string;
  pages: number;
  fileName: string;
  fileSize: number;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [docInfo, setDocInfo] = useState<{
    fileName: string;
    pages: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileProcessed = async (data: ExtractedData) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setDocInfo({ fileName: data.fileName, pages: data.pages });
    setLoadingStep("AI is analyzing your document...");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.text,
          fileName: data.fileName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const result = await res.json();
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setDocInfo(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            AI Document Analyzer
          </h1>
          <p className="text-lg text-gray-500">
            Upload any PDF — get instant structured analysis powered by AI
          </p>
        </div>

        {!analysis ? (
          <>
            <FileUpload
              onFileProcessed={handleFileProcessed}
              isLoading={isLoading}
            />
            {isLoading && (
              <p className="text-center text-blue-600 mt-4 animate-pulse">
                {loadingStep}
              </p>
            )}
            {error && (
              <p className="text-center text-red-500 mt-4">{error}</p>
            )}
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-500">
                {docInfo?.fileName} — {docInfo?.pages} pages
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Analyze another document
              </button>
            </div>

            {/* Day 3: Replace with <AnalysisDashboard analysis={analysis} /> */}
            <pre className="bg-white p-6 rounded-xl border overflow-auto text-sm">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
```

**End of Day 2:** Upload PDF → full structured AI analysis as JSON.

---

## Day 3 (Evening 3): Results Dashboard UI

### Dashboard Components

Create all files in `components/dashboard/`:

**`components/dashboard/SummaryCard.tsx`**

```tsx
interface SummaryCardProps {
  summary: string;
  documentType: string;
}

const typeColors: Record<string, string> = {
  contract: "bg-blue-100 text-blue-800",
  invoice: "bg-green-100 text-green-800",
  report: "bg-purple-100 text-purple-800",
  legal: "bg-red-100 text-red-800",
  financial: "bg-yellow-100 text-yellow-800",
  letter: "bg-gray-100 text-gray-800",
  other: "bg-gray-100 text-gray-800",
};

export default function SummaryCard({ summary, documentType }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Summary</h2>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
            typeColors[documentType] || typeColors.other
          }`}
        >
          {documentType}
        </span>
      </div>
      <p className="text-gray-600 leading-relaxed">{summary}</p>
    </div>
  );
}
```

**`components/dashboard/RiskFlags.tsx`**

```tsx
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { RiskFlag } from "@/types/analysis";

const icons = {
  high: <AlertTriangle className="w-5 h-5 text-red-500" />,
  medium: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  low: <Info className="w-5 h-5 text-blue-500" />,
};

const colors = {
  high: "border-red-200 bg-red-50",
  medium: "border-yellow-200 bg-yellow-50",
  low: "border-blue-200 bg-blue-50",
};

export default function RiskFlags({ risks }: { risks: RiskFlag[] }) {
  if (risks.length === 0) return null;

  const sorted = [...risks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Risk Flags ({risks.length})
      </h2>
      <div className="space-y-3">
        {sorted.map((risk, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-lg border ${colors[risk.severity]}`}
          >
            {icons[risk.severity]}
            <div>
              <p className="text-sm font-medium text-gray-800">{risk.description}</p>
              <p className="text-xs text-gray-500 mt-1">Section: {risk.section}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**`components/dashboard/EntitiesAndDates.tsx`**

```tsx
import { Users, Calendar } from "lucide-react";
import type { Entity, KeyDate } from "@/types/analysis";

interface Props {
  entities: Entity[];
  dates: KeyDate[];
}

export default function EntitiesAndDates({ entities, dates }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          Key Parties ({entities.length})
        </h2>
        {entities.length > 0 ? (
          <div className="space-y-3">
            {entities.map((entity, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{entity.name}</span>
                <span className="text-sm text-gray-400">{entity.role}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No entities found</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          Key Dates ({dates.length})
        </h2>
        {dates.length > 0 ? (
          <div className="space-y-3">
            {dates.map((date, i) => (
              <div key={i} className="flex justify-between items-start gap-4">
                <span className="text-sm font-mono text-blue-600 whitespace-nowrap">{date.date}</span>
                <span className="text-sm text-gray-500 text-right">{date.description}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No dates found</p>
        )}
      </div>
    </div>
  );
}
```

**`components/dashboard/FinancialItems.tsx`**

```tsx
import { DollarSign } from "lucide-react";
import type { FinancialItem } from "@/types/analysis";

const typeColors: Record<string, string> = {
  payment: "text-green-600",
  fee: "text-blue-600",
  penalty: "text-red-600",
  total: "text-gray-900 font-bold",
  tax: "text-yellow-600",
  discount: "text-purple-600",
};

export default function FinancialItems({ items }: { items: FinancialItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-gray-400" />
        Financial Items ({items.length})
      </h2>
      <div className="divide-y divide-gray-100">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center py-3">
            <div>
              <p className="text-sm text-gray-700">{item.description}</p>
              <span className="text-xs text-gray-400 capitalize">{item.type}</span>
            </div>
            <span className={`text-lg font-mono ${typeColors[item.type] || "text-gray-700"}`}>
              {item.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**`components/dashboard/ObligationsTable.tsx`**

```tsx
import type { Obligation } from "@/types/analysis";

export default function ObligationsTable({ obligations }: { obligations: Obligation[] }) {
  if (obligations.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Obligations ({obligations.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b">
              <th className="pb-3 pr-4">Party</th>
              <th className="pb-3 pr-4">Obligation</th>
              <th className="pb-3">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {obligations.map((ob, i) => (
              <tr key={i}>
                <td className="py-3 pr-4 font-medium text-gray-700">{ob.party}</td>
                <td className="py-3 pr-4 text-gray-600">{ob.obligation}</td>
                <td className="py-3 text-gray-500 whitespace-nowrap">{ob.deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**`components/dashboard/KeyTerms.tsx`**

```tsx
import type { KeyTerm } from "@/types/analysis";

export default function KeyTerms({ terms }: { terms: KeyTerm[] }) {
  if (terms.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Key Terms ({terms.length})
      </h2>
      <div className="space-y-4">
        {terms.map((term, i) => (
          <div key={i}>
            <span className="font-medium text-gray-800">{term.term}</span>
            <p className="text-sm text-gray-500 mt-1">{term.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**`components/dashboard/ActionItems.tsx`**

```tsx
import { CheckCircle2 } from "lucide-react";

export default function ActionItems({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Action Items ({items.length})
      </h2>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <span className="text-sm text-gray-700">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Assemble the Dashboard

**`components/dashboard/AnalysisDashboard.tsx`**

```tsx
import type { DocumentAnalysis } from "@/types/analysis";
import SummaryCard from "./SummaryCard";
import RiskFlags from "./RiskFlags";
import EntitiesAndDates from "./EntitiesAndDates";
import FinancialItems from "./FinancialItems";
import ObligationsTable from "./ObligationsTable";
import KeyTerms from "./KeyTerms";
import ActionItems from "./ActionItems";

export default function AnalysisDashboard({
  analysis,
}: {
  analysis: DocumentAnalysis;
}) {
  return (
    <div className="space-y-4">
      <SummaryCard summary={analysis.summary} documentType={analysis.documentType} />
      <RiskFlags risks={analysis.riskFlags} />
      <EntitiesAndDates entities={analysis.keyEntities} dates={analysis.keyDates} />
      <FinancialItems items={analysis.financialItems} />
      <ObligationsTable obligations={analysis.obligations} />
      <KeyTerms terms={analysis.keyTerms} />
      <ActionItems items={analysis.actionItems} />
    </div>
  );
}
```

### Update page.tsx

In `app/page.tsx`:

1. Add import:
```tsx
import AnalysisDashboard from "@/components/dashboard/AnalysisDashboard";
```

2. Replace the `<pre>` block with:
```tsx
<AnalysisDashboard analysis={analysis} />
```

**End of Day 3:** Professional dashboard with all analysis sections.

---

## Day 4 (Evening 4): Polish — Export, Loading Animation, Metadata

### Export Button

Create: `components/ExportButton.tsx`

```tsx
"use client";

import { Download } from "lucide-react";
import type { DocumentAnalysis } from "@/types/analysis";

interface Props {
  analysis: DocumentAnalysis;
  fileName: string;
}

export default function ExportButton({ analysis, fileName }: Props) {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(".pdf", "")}-analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
    >
      <Download className="w-4 h-4" />
      Export JSON
    </button>
  );
}
```

### Loading Animation

Create: `components/AnalysisLoader.tsx`

```tsx
import { FileText, Brain, CheckCircle2 } from "lucide-react";

interface Props {
  step: "extracting" | "analyzing" | "done";
}

export default function AnalysisLoader({ step }: Props) {
  const steps = [
    { key: "extracting", label: "Extracting text from PDF...", icon: FileText },
    { key: "analyzing", label: "AI is analyzing the document...", icon: Brain },
    { key: "done", label: "Analysis complete!", icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="space-y-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === currentIndex;
          const isComplete = i < currentIndex;

          return (
            <div key={s.key} className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isComplete
                    ? "bg-green-100 text-green-600"
                    : isActive
                    ? "bg-blue-100 text-blue-600 animate-pulse"
                    : "bg-gray-100 text-gray-300"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-sm font-medium ${
                  isComplete
                    ? "text-green-600"
                    : isActive
                    ? "text-blue-600"
                    : "text-gray-300"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Update Layout

Update `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Document Analyzer — Instant PDF Analysis",
  description:
    "Upload any PDF document and get AI-powered structured analysis: summaries, key dates, obligations, risk flags, and action items.",
  openGraph: {
    title: "AI Document Analyzer",
    description: "Instant AI-powered PDF analysis",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### Wire Export into page.tsx

In `app/page.tsx`, update the results header:

```tsx
import ExportButton from "@/components/ExportButton";

// Replace the results header with:
<div className="flex items-center justify-between mb-6">
  <div className="text-sm text-gray-500">
    {docInfo?.fileName} — {docInfo?.pages} pages
  </div>
  <div className="flex items-center gap-3">
    <ExportButton analysis={analysis} fileName={docInfo?.fileName || "document"} />
    <button
      onClick={handleReset}
      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
    >
      Analyze another
    </button>
  </div>
</div>
```

**End of Day 4:** Polished UI with loading animation, JSON export, metadata.

---

## Day 5 (Evening 5): Deploy to Vercel + README

### Push to GitHub

```bash
git add .
git commit -m "AI Document Analyzer MVP - Next.js 16"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-doc-analyzer.git
git push -u origin main
```

### Deploy to Vercel

1. **vercel.com** → "Add New Project"
2. Import your GitHub repo
3. Add env variable: `ANTHROPIC_API_KEY` = your key
4. Click **Deploy**
5. Live at: `ai-doc-analyzer.vercel.app`

### README

Replace `README.md`:

```markdown
# AI Document Analyzer

Upload any PDF — get instant AI-powered structured analysis.

**Live Demo**: [ai-doc-analyzer.vercel.app](https://ai-doc-analyzer.vercel.app)

## Features
- Executive Summary with document type detection
- Entity Extraction — parties and their roles
- Date Detection — all dates with context
- Financial Analysis — amounts, fees, penalties, totals
- Obligation Mapping — who owes what, by when
- Risk Flagging — concerning terms and missing clauses
- Key Terms — legal/technical jargon in plain English
- Action Items — extracted next steps

## Tech Stack
- Next.js 16 (App Router + Turbopack)
- TypeScript
- Claude API (Anthropic) — Sonnet 4.5
- Tailwind CSS
- Vercel

## Quick Start

git clone https://github.com/YOUR_USERNAME/ai-doc-analyzer.git
cd ai-doc-analyzer
npm install

Create `.env.local`:
ANTHROPIC_API_KEY=your_key_here

npm run dev

## Built by Elmar Angao
Full Stack Developer | AI Integration Specialist
Next.js + TypeScript + Claude API

[LinkedIn](your-link) | [Email](mailto:elmarcera@gmail.com)
```

---

## Final File Structure

```
ai-doc-analyzer/
├── app/
│   ├── api/
│   │   ├── extract/
│   │   │   └── route.ts              ← PDF text extraction
│   │   └── analyze/
│   │       └── route.ts              ← Claude API analysis
│   ├── layout.tsx                     ← Metadata + fonts
│   ├── page.tsx                       ← Main page
│   ├── globals.css
│   └── favicon.ico
├── components/
│   ├── FileUpload.tsx                 ← Drag & drop upload
│   ├── AnalysisLoader.tsx             ← Loading animation
│   ├── ExportButton.tsx               ← JSON export
│   └── dashboard/
│       ├── AnalysisDashboard.tsx      ← Layout wrapper
│       ├── SummaryCard.tsx
│       ├── RiskFlags.tsx
│       ├── EntitiesAndDates.tsx
│       ├── FinancialItems.tsx
│       ├── ObligationsTable.tsx
│       ├── KeyTerms.tsx
│       └── ActionItems.tsx
├── types/
│   └── analysis.ts                    ← TypeScript interfaces
├── lib/
│   └── rate-limit.ts                  ← API rate limiting
├── public/
├── next.config.ts                     ← Next.js 16 TypeScript config
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.local                         ← API keys (NOT committed)
├── .gitignore
├── package.json
└── README.md
```

---

## After 5 Days You Have

- Live AI Document Analyzer on Vercel
- Next.js 16 + Turbopack + TypeScript (latest stack)
- Professional dashboard UI
- Portfolio-ready GitHub repo
- Proof of AI integration skills for freelance clients

---

## What's Next

**Week 2**: Upwork profile — this project is your centerpiece
**Week 3**: Add RAG (upload multiple docs, ask questions across them)
**Later**: NextAuth + Prisma + PostgreSQL + Stripe → monetize as SaaS

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `pdf-parse` type errors | `@ts-expect-error` comment handles this |
| Claude returns invalid JSON | Add `temperature: 0` to API call |
| Empty text from PDF | PDF is scanned/image-based. Use text-based PDFs. |
| API key not working | Check `.env.local` in root. Restart dev server. |
| Vercel deploy fails | Add `ANTHROPIC_API_KEY` in Vercel Settings → Env Variables |
| Turbopack issues | `next dev --webpack` as fallback |
| Import alias errors | Verify `tsconfig.json` has `"@/*": ["./*"]` in paths |
