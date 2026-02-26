# AI Document Analyzer

Upload any PDF document and get instant AI-powered structured analysis — summaries, key entities, dates, obligations, risk flags, and action items.

**Live Demo**: [Coming Soon - Deploying to Vercel]

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
| **PDF Processing** | pdf-parse |
| **Icons** | lucide-react |
| **Deployment** | Vercel |
| **Testing** | Jest + React Testing Library (333 tests) |

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
```

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
│   └── rate-limit.ts              # API rate limiter (5 req/min per IP)
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

The project includes comprehensive test coverage (333 tests):

- **API Integration Tests** (38 tests) — End-to-end API workflows, rate limiting, security
- **API Validation Tests** (62 tests) — Input validation, error handling, HTTP status codes
- **Accessibility Tests** (37 tests) — WCAG 2.1 Level A/AA compliance
- **Responsive Design Tests** (41 tests) — Mobile-first layouts, touch targets, dark mode

**Coverage:** All critical paths tested with focus on error handling, accessibility, and user experience.

---

## 🔒 Security & Rate Limiting

- **Rate Limiting:** 5 requests per minute per IP address
- **File Validation:** PDF-only, 10MB maximum file size
- **Text Truncation:** Documents limited to 80,000 characters for API processing
- **Input Sanitization:** All user inputs validated and sanitized
- **No Data Persistence:** No database, no stored files — privacy by design

---

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/eangao/ai-document-analyzer)

1. Click "Deploy" button above or go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variable in Vercel dashboard:
   - `ANTHROPIC_API_KEY` = your Anthropic API key
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
