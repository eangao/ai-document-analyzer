# AI Document Analyzer

Upload any PDF document and get instant AI-powered structured analysis — summaries, key entities, dates, obligations, risk flags, and action items.

**Live Demo**: [https://ai-document-analyzer-ea.vercel.app](https://ai-document-analyzer-ea.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Claude API](https://img.shields.io/badge/Claude-Sonnet%204.5-purple?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

---

## 🎯 Features

- **Executive Summary** — AI-generated 2-3 sentence overview with document type detection
- **Entity Extraction** — Automatically identifies key parties and their roles
- **Date Detection** — Extracts all dates with contextual descriptions
- **Financial Analysis** — Identifies payments, fees, penalties, taxes, and totals with color coding
- **Obligation Mapping** — Clear table of who owes what, by when
- **Risk Flagging** — Highlights concerning terms, unfavorable clauses, and missing information (severity: high/medium/low)
- **Key Terms Glossary** — Legal and technical jargon explained in plain English
- **Action Items** — Extracted next steps and required actions
- **JSON Export** — Download full analysis results for integration or record-keeping
- **Real-time Processing** — No database, no login required — instant results

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Language** | TypeScript (strict mode) |
| **AI Model** | Claude Sonnet 4.5 (Anthropic API) |
| **UI Components** | shadcn/ui + Tailwind CSS |
| **PDF Processing** | unpdf |
| **Icons** | lucide-react |
| **Deployment** | Vercel |
| **Testing** | Vitest + React Testing Library (667 tests) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.9.0+ (Next.js 16 requirement)
- Anthropic API key from [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

### Installation

```bash
# Clone the repository
git clone git@github-personal:eangao/ai-document-analyzer.git
cd ai-document-analyzer

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DEMO_MODE=true  # Enable cost control (5K char limit vs 80K) - recommended for portfolio demos
```

**Environment Variables Explained:**
- `ANTHROPIC_API_KEY` — **Required**. Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/settings/keys)
- `DEMO_MODE` — **Optional**. Set to `true` to enable cost protection (reduces API token usage by ~80%)

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build for Production

```bash
npm run build
npm start
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 📄 Sample Documents for Testing

The repository includes **7 sample PDFs** in `docs/sample documents/` to test the analyzer:

| Document Type | Filename | What It Tests |
|---------------|----------|---------------|
| **Contract** | `sample-contract.pdf` | Multi-party agreements, obligations, dates, risk flags |
| **Invoice** | `sample-invoice.pdf` | Financial items, payment terms, line items, totals |
| **Report** | `sample-report.pdf` | Executive summaries, data analysis, findings |
| **Legal (NDA)** | `sample-nda-legal.pdf` | Legal terminology, confidentiality clauses, penalties |
| **Financial Statement** | `sample-financial-statement.pdf` | Complex financial data, accounting terms, balance sheets |
| **Business Letter** | `sample-business-letter.pdf` | Simple document structure, minimal entities |
| **Employee Handbook** | `sample-employee-handbook.pdf` | Policies, procedures, obligations, multi-section documents |

**How to Use:**
1. Run the app locally (`npm run dev`) or visit the [live demo](https://ai-document-analyzer-ea.vercel.app)
2. Upload any sample document from `docs/sample documents/`
3. Observe how the AI extracts entities, dates, obligations, risk flags, and financial items
4. Compare results across different document types

**Note:** These are synthetic samples created for demonstration purposes. Results showcase the analyzer's capabilities across various business document formats.

---

## 📁 Project Structure

```
ai-document-analyzer/
├── app/
│   ├── api/
│   │   ├── extract/route.ts       # PDF text extraction endpoint
│   │   └── analyze/route.ts       # Claude API analysis endpoint
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Main application page
│   └── globals.css                # Global styles
├── components/
│   ├── FileUpload.tsx             # Drag & drop PDF upload
│   ├── AnalysisLoader.tsx         # Step-by-step loading animation
│   ├── ExportButton.tsx           # JSON export functionality
│   ├── RateLimitAlert.tsx         # Countdown timer for rate-limited users
│   ├── ui/                        # shadcn/ui components (managed by CLI)
│   └── dashboard/
│       ├── AnalysisDashboard.tsx  # Main dashboard layout
│       ├── SummaryCard.tsx        # Document summary + type badge
│       ├── RiskFlags.tsx          # Risk severity alerts
│       ├── EntitiesAndDates.tsx   # Key parties and dates grid
│       ├── FinancialItems.tsx     # Financial breakdown
│       ├── ObligationsTable.tsx   # Obligations table
│       ├── KeyTerms.tsx           # Terms glossary
│       └── ActionItems.tsx        # Action items checklist
├── types/
│   └── analysis.ts                # TypeScript interfaces
├── lib/
│   ├── rate-limit.ts              # Dual-layer rate limiter (3 req/hour per IP + 50 req/day global)
│   ├── error-messages.ts          # User-friendly error message generation
│   ├── error-parser.ts            # Frontend error type discrimination
│   └── demo-mode.ts               # Cost control configuration
└── next.config.ts                 # Next.js 16 TypeScript config
```

---

## 🎨 Features Deep Dive

### Document Types Supported

- Contracts
- Invoices
- Reports
- Legal documents
- Financial statements
- Letters
- General business documents

### Analysis Components

**Risk Severity Color Coding:**
- 🔴 **High** — Critical issues requiring immediate attention
- 🟡 **Medium** — Notable concerns to review
- 🔵 **Low** — Minor observations

**Financial Item Types:**
- 💰 **Payment** — Regular payments (green)
- 💵 **Fee** — Service fees (blue)
- ⚠️ **Penalty** — Late fees, penalties (red)
- 📊 **Total** — Summary amounts (bold)
- 🏦 **Tax** — Tax amounts (yellow)
- 🎁 **Discount** — Discounts applied (purple)

---

## 🧪 Testing

The project includes comprehensive test coverage (**667 tests**, 93.6% coverage):

- **Component Tests** — All React components including RateLimitAlert countdown timer
- **API Tests** — Dual-layer rate limiting, error message generation, DEMO_MODE truncation
- **Utility Tests** — Error parser (39 tests), demo mode (21 tests), rate limiter (39 tests)
- **Integration Tests** — Full user workflows, error handling, export functionality
- **Accessibility Tests** — WCAG 2.1 Level A/AA compliance across all components

**Test Distribution:**
- Rate limiting: 39 tests (per-IP hourly + global daily limits)
- Error messages: 53 tests (100% coverage on user-facing messages)
- Error parser: 39 tests (type-safe error discrimination)
- RateLimitAlert: 30 tests (countdown timer, styling, accessibility)
- Demo mode: 21 tests (cost control configuration)

**Coverage:** 93.6% statements | 87% branches | 92.7% functions

---

## 🔒 Security & Cost Protection

### Multi-Layer Rate Limiting

This application implements **three layers of cost protection** to prevent unexpected API charges:

1. **Per-IP Hourly Limit:** 3 requests per hour per IP address
   - Prevents individual users from exhausting API quota
   - Resets on a rolling 1-hour window
   - Returns friendly error with countdown timer

2. **Global Daily Cap:** 50 requests per day across all users
   - Hard limit to prevent runaway costs
   - Resets daily at UTC midnight
   - Displays "high traffic" message when reached

3. **Demo Mode Toggle:** Configurable text truncation
   - `DEMO_MODE=true` — 5,000 characters (~80% cost reduction)
   - `DEMO_MODE=false` — 80,000 characters (full analysis)
   - Applied before Claude API call to save tokens

### User Experience

When rate limits are reached, users see:
- **Clear error messages** explaining what happened and why
- **Countdown timers** showing exact retry time (MM:SS format)
- **Portfolio context** acknowledging this is a demo limitation
- **Different styling** for per-IP (amber) vs global (blue) limits

**Example Messages:**
- Per-IP: *"You've reached your personal limit of 3 documents per hour. Retry available in 47 minutes."*
- Global: *"This demo is experiencing high traffic. Try again tomorrow morning (UTC)."*

### Security Features

- **File Validation:** PDF-only, 10MB maximum file size
- **Input Sanitization:** All user inputs validated and sanitized
- **No Data Persistence:** No database, no stored files — privacy by design
- **Type-Safe Errors:** Discriminated union types for frontend error handling

### Estimated Monthly Cost

With current limits and `DEMO_MODE=true`:
- **Per-IP limit:** 3 req/hour = 96% reduction vs unlimited
- **Global cap:** 50 req/day maximum
- **Demo mode:** 5K chars = ~80% token reduction per request
- **Total:** ~$0.45/month maximum (vs potentially unlimited)

---

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/eangao/ai-document-analyzer)

1. Click "Deploy" button above or go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY` = your Anthropic API key
   - `DEMO_MODE` = `true` (recommended for portfolio demos to control costs)
4. Click **Deploy**

Your app will be live at `your-project.vercel.app`

---

## 🛣 Roadmap

**MVP (Current):**
- ✅ PDF upload and text extraction
- ✅ Claude AI structured analysis
- ✅ Professional dashboard UI
- ✅ JSON export
- ✅ Comprehensive testing

**Future Enhancements:**
- 📝 RAG (Retrieval-Augmented Generation) — Upload multiple documents, ask questions across them
- 🔐 User authentication (NextAuth.js)
- 💾 Database integration (Prisma + PostgreSQL)
- 📊 Analysis history and saved documents
- 🌐 Multi-language support
- 💳 SaaS monetization (Stripe integration)
- 📧 Email reports
- 🔄 Batch processing

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Built By

**Elmar Angao**
Full Stack Developer | AI Integration Specialist

Specializing in Next.js, TypeScript, and AI-powered applications using Claude API and modern web technologies.

📧 **Contact:** [elmarcera@gmail.com](mailto:elmarcera@gmail.com)
💼 **Portfolio:** [Coming Soon]
🔗 **LinkedIn:** [linkedin.com/in/elmar-angao](https://linkedin.com/in/elmar-angao)
🐙 **GitHub:** [github.com/eangao](https://github.com/eangao)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) — The React Framework for Production
- [Anthropic](https://www.anthropic.com/) — Claude AI API
- [shadcn/ui](https://ui.shadcn.com/) — Beautifully designed components
- [Vercel](https://vercel.com/) — Deployment platform

---

**⭐ If you find this project useful, please consider giving it a star on GitHub!**
