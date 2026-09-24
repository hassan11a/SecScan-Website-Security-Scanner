<div align="center">

# 🛡️ SecScan — Website Security Scanner

**Professional website security scanner for authorized defensive testing.**

Audit security headers, TLS/SSL, cookies, DNS, CORS, redirects, technology stack,
security.txt and robots.txt — with scored reports, history and interactive dashboards.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-features) · [Quick Start](#-quick-start) · [Folder Structure](#-folder-structure) · [Pages](#-pages--routes) · [API](#-api-reference) · [Scanners](#-scan-modules) · [Security](#-security--ethics)

</div>

---

## ⚠️ Authorized Testing Only

> This tool is for **defensive security testing** of websites **you own** or have **explicit written permission** to test.
> Unauthorized scanning may violate laws including the **Computer Fraud and Abuse Act (CFAA)** and similar legislation worldwide.
> SecScan only performs **safe, non-intrusive** probes. It does **not** exploit, brute-force, flood, or run malware.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [How to Open the App](#-how-to-open-the-app)
- [Folder Structure](#-folder-structure)
- [Pages & Routes](#-pages--routes)
- [API Reference](#-api-reference)
- [Scan Modules](#-scan-modules)
- [Security Score Explained](#-security-score-explained)
- [Database Schema](#-database-schema)
- [Configuration](#-configuration)
- [Project Architecture](#-project-architecture)
- [Development Commands](#-development-commands)
- [Troubleshooting](#-troubleshooting)
- [Security & Ethics](#-security--ethics)
- [Roadmap](#-roadmap)

---

## 🔍 Overview

SecScan is a full-stack **Next.js** application that scans websites for common
security misconfigurations and produces a **weighted security score (0–100)**
with detailed findings — each finding includes **evidence**, **impact**, and a
concrete **remediation recommendation**.

### Why SecScan?

| Problem with other scanners | How SecScan solves it |
|---|---|
| Fake / placeholder results for dead hosts | **Preflight reachability check** — scan aborts if target is offline |
| Hard-coded certificate info | **Live TLS handshake** via Node `tls` — real protocol, cipher, issuer, expiry |
| Generic copy-paste recommendations | Every finding carries **live evidence** from the actual HTTP response |
| No history / reporting | SQLite persistence + dashboard, history, and exportable reports |

---

## ✨ Features

### Scan Engine
- ✅ **9 dedicated scanner modules** running against live targets
- ✅ **Preflight DNS + HTTP reachability** — no fabricated findings for unreachable sites
- ✅ **Real TLS certificate inspection** (protocol version, cipher suite, issuer, expiry, hostname match)
- ✅ **Weighted security scoring** (High ×4, Medium ×3, Low ×2, Info ×1)
- ✅ **Standardized findings** — evidence, description, impact, recommendation on every check
- ✅ Safe request controls: **10s timeout**, **max 10 redirects**, **10 MB response cap**
- ✅ Blocks **localhost / private IPs** unless explicitly enabled for lab testing

### User Interface
- ✅ **Dashboard** — animated stat cards, SVG score ring, severity pie chart, score trend (Recharts)
- ✅ **Scanner page** — URL input, live step-by-step progress, 9-module overview
- ✅ **Scan report** — tabbed findings by category with pass/fail badges
- ✅ **History** — paginated list with score chips, status, duration
- ✅ **Settings** — theme (Light/Dark/System), scanner limits, persisted to `localStorage`
- ✅ Responsive, accessible navigation with mobile menu
- ✅ Loading skeletons, hover animations, glass-sticky save bar

### Data & API
- ✅ SQLite via `better-sqlite3` (auto-creates `data/scanner.db`)
- ✅ REST API for scan, list, and report retrieval
- ✅ Zod input validation on every POST

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16.3.6** (App Router, Turbopack) |
| UI | **React 19.2.8** |
| Language | **TypeScript 5** |
| Styling | **Tailwind CSS 4** + custom animations |
| Charts | **Recharts 3** (pie, area) |
| Icons | **Lucide React** |
| Validation | **Zod 4** |
| Database | **better-sqlite3 13** |
| TLS inspection | Node.js **`node:tls`** |
| DNS (DoH) | **Google DNS-over-HTTPS** |
| Linting | **ESLint 9** + `eslint-config-next` |

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Check |
|---|---|---|
| **Node.js** | **18.18+** (20 LTS recommended) | `node -v` |
| **npm** | 9+ (bundled with Node) | `npm -v` |
| **Git** (optional) | any | `git --v` |

> **Windows note:** If scripts are blocked, run PowerShell as your user once:
> ```powershell
> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### Step 1 — Clone the repository

```bash
git clone https://github.com/hassan11a/SecScan-Website-Security-Scanner.git
cd SecScan-Website-Security-Scanner
```

> If the app lives inside a subfolder (e.g. `scanner-app/`), enter that folder:
> ```bash
> cd scanner-app
> ```

### Step 2 — Install dependencies

```bash
npm install
```

This installs Next.js, React, Tailwind, Recharts, better-sqlite3, Zod, Lucide, etc.
(`node_modules/` is **not** committed to git — always run this after clone.)

### Step 3 — Start the development server

```bash
npm run dev
```

Expected output:

```
▲ Next.js 16.3.6
- Local:        http://localhost:3000
✓ Ready in ~1.5s
```

### Step 4 — Open the app in your browser

| URL | What you see |
|---|---|
| **http://localhost:3000** | Redirects to **Dashboard** |
| **http://localhost:3000/scanner** | Start a new scan |
| **http://localhost:3000/history** | Past scans |
| **http://localhost:3000/settings** | Preferences |

**To stop the server:** press `Ctrl + C` in the terminal.

---

## 💻 How to Open the App (step-by-step for beginners)

### Method 1 — Terminal (recommended)

**Windows (PowerShell):**
```powershell
# 1. Open the project folder
cd "G:\path\to\SecScan-Website-Security-Scanner\scanner-app"

# 2. Install packages (first time only)
npm install

# 3. Start the app
npm run dev
```

**macOS / Linux (Terminal):**
```bash
cd /path/to/SecScan-Website-Security-Scanner/scanner-app
npm install
npm run dev
```

Then open **Chrome / Edge / Firefox** and go to:

```
http://localhost:3000
```

### Method 2 — VS Code

1. Open **VS Code** → **File → Open Folder…** → select `scanner-app/`
2. Open **Terminal** (`Ctrl + ` ` ` ` or **Terminal → New Terminal**)
3. Type:
   ```bash
   npm install
   npm run dev
   ```
4. When you see `http://localhost:3000`, **Ctrl+click** the link (or paste it in the browser)

### Method 3 — Production build (faster, for demos)

```bash
npm run build   # optimized production build
npm run start   # serves the production build on port 3000
```

Then open **http://localhost:3000** as above.

### First scan in 30 seconds

1. Open **http://localhost:3000/scanner**
2. Type a URL you are allowed to test, e.g. `https://example.com`
3. Click **Start Security Scan**
4. Watch the live progress (reachability → 9 modules)
5. You are redirected to the report automatically when it finishes
6. Explore **Dashboard** for charts and **History** for past runs

---

## 📁 Folder Structure

```
SecScan-Website-Security-Scanner/
│
├── README.md                  ← this file
├── .gitignore                 ← ignores node_modules, .next, data/*.db, .env*
│
├── package.json               ← scripts + dependencies
├── package-lock.json          ← locked dependency tree
├── tsconfig.json              ← TypeScript configuration
├── next.config.ts             ← Next.js configuration
├── postcss.config.mjs         ← Tailwind CSS 4 via PostCSS
├── eslint.config.mjs          ← ESLint (Next.js core web vitals)
│
├── public/                    ← static assets served at /
│   ├── favicon.ico
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── data/                      ← auto-created at runtime (GIT-IGNORED)
│   └── scanner.db             ← SQLite database with all scan history
│
└── src/
    │
    ├── app/                   ← Next.js App Router (pages + API)
    │   ├── layout.tsx         ← Root HTML layout (Inter font, metadata)
    │   ├── page.tsx           ← "/" → redirects to /dashboard
    │   ├── globals.css        ← Tailwind import + animations + scrollbars
    │   ├── favicon.ico
    │   │
    │   ├── dashboard/
    │   │   └── page.tsx       ← Dashboard: stats, charts, recent scans
    │   │
    │   ├── scanner/
    │   │   └── page.tsx       ← New scan form + live progress UI
    │   │
    │   ├── scan/
    │   │   └── [id]/
    │   │       └── page.tsx   ← Detailed scan report (tabs, findings)
    │   │
    │   ├── history/
    │   │   └── page.tsx       ← Paginated scan history list
    │   │
    │   ├── settings/
    │   │   └── page.tsx       ← Theme, scanner limits, data management
    │   │
    │   └── api/               ← REST API route handlers (server-only)
    │       ├── scan/
    │       │   └── route.ts       POST  → create + run a scan
    │       ├── scans/
    │       │   └── route.ts       GET   → list scans (limit/offset)
    │       └── report/
    │           └── [id]/
    │               └── route.ts   GET   → single scan report by scanId
    │
    ├── components/            ← React UI components
    │   ├── Navigation.tsx     ← Top nav (Dashboard/Scanner/History/Settings)
    │   └── ui/                ← Reusable primitives
    │       ├── Alert.tsx
    │       ├── Badge.tsx
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Input.tsx
    │       ├── Label.tsx
    │       ├── Progress.tsx
    │       ├── Select.tsx
    │       ├── Separator.tsx
    │       ├── Switch.tsx
    │       └── Tabs.tsx
    │
    ├── lib/                   ← Business logic (TypeScript)
    │   ├── Database.ts        ← SQLite connection + CRUD (server-only)
    │   ├── security.ts        ← URL validation, private-IP block, SCAN_CONFIG
    │   ├── utils.ts           ← cn(), formatters, score labels, colors
    │   │
    │   └── scanner/           ← ⭐ Scan engine
    │       ├── index.ts       ← Orchestrator: preflight + run all modules
    │       ├── base.ts        ← BaseScanner class + shared fetch helpers
    │       ├── headers/       ← Security headers (CSP, HSTS, XFO, …)
    │       ├── tls/           ← HTTPS + live TLS handshake inspection
    │       ├── cookies/       ← Secure / HttpOnly / SameSite analysis
    │       ├── dns/           ← A, AAAA, MX, NS, TXT, SPF, DMARC (DoH)
    │       ├── cors/          ← Origin reflection & credential checks
    │       ├── redirects/     ← Redirect chain, loops, external hops
    │       ├── technology/    ← Server, framework, CMS, CDN detection
    │       ├── security-txt/  ← RFC 9116 /.well-known/security.txt
    │       └── robots/        ← robots.txt disallow / sitemap review
    │
    └── types/
        └── index.ts           ← Shared TypeScript interfaces & unions
```

### What each top-level folder is for

| Folder | Purpose | Edit when… |
|---|---|---|
| `src/app/` | Pages (routes) + API endpoints | Adding a new page or endpoint |
| `src/components/` | Reusable UI | Building buttons, cards, nav |
| `src/lib/scanner/` | Scan modules | Adding a new security check |
| `src/lib/` | Helpers, DB, scoring | Changing rules or persistence |
| `src/types/` | Shared types | Changing finding/scan shapes |
| `public/` | Images, logos | Branding assets |
| `data/` | SQLite file (auto) | Never commit — wiped/recreated |
| root configs | Build & tooling | Rarely |

---

## 📄 Pages & Routes

| Route | Type | Description |
|---|---|---|
| `/` | Static | Redirects to `/dashboard` |
| `/dashboard` | Static (CSR) | Overview: total scans, avg score, severity pie, score trend, recent scans, quick actions |
| `/scanner` | Static (CSR) | URL form, live progress checklist, 9-module grid, authorization notice |
| `/scan/[id]` | Dynamic | Full report: score, counts, category tabs, every finding with evidence |
| `/history` | Static (CSR) | Paginated history with score chips, status badges, duration |
| `/settings` | Static (CSR) | Theme picker, timeout/redirects/user-agent, toggles, danger zone, sticky save bar |

**Navigation:** logo → Dashboard · center links · **New Scan** button (top-right).

---

## 🔌 API Reference

Base URL: `http://localhost:3000`

### `POST /api/scan`

Start a full security scan.

**Request body**

```json
{
  "url": "https://example.com",
  "allowLocal": false
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `url` | string | ✅ | http(s) URL, max 2048 chars |
| `allowLocal` | boolean | ❌ | Allow localhost / private IPs (lab only) |

**Success `200`**

```json
{
  "scanId": "scan-muey…-xmcv6t",
  "url": "https://example.com",
  "securityScore": 40,
  "status": "completed",
  "totalChecks": 36,
  "passedChecks": 19,
  "highCount": 1,
  "mediumCount": 5,
  "lowCount": 5,
  "informationalCount": …,
  "findings": [ { "checkId": "SEC-HDR-…", "status": "fail", … } ],
  "startTime": "…",
  "endTime": "…",
  "duration": 4721
}
```

**Errors**

| Status | When |
|---|---|
| `400` | Missing/invalid URL (Zod) |
| `500` | Unreachable target, DNS failure, or internal error — `message` explains why; **no fake findings** |

---

### `GET /api/scans`

List scans (newest first).

| Query | Default | Description |
|---|---|---|
| `limit` | `50` | Page size |
| `offset` | `0` | Pagination offset |

```
GET /api/scans?limit=10&offset=0
```

**Response**

```json
{
  "scans": [
    {
      "id": "…",
      "scanId": "scan-…",
      "url": "https://example.com",
      "dateTime": "2026-09-24T…",
      "securityScore": 40,
      "findingCount": 36,
      "status": "completed",
      "high_count": 1,
      "medium_count": 5,
      "low_count": 5,
      "informational_count": …,
      "passed_checks": 19,
      "duration": 4721
    }
  ],
  "total": 3,
  "limit": 10,
  "offset": 0
}
```

---

### `GET /api/report/[id]`

Fetch one report by **scanId** (not the internal UUID).

```
GET /api/report/scan-muey8ko5-xmcv6t
```

**Response:** full `ScanResult` (score, counts, `findings[]`, timestamps).
**`404`** if the scan ID does not exist.

---

## 🔎 Scan Modules

Each module returns standardized `ScanFinding[]` objects:

```ts
{
  checkId: string;        // e.g. "SEC-HDR-CSP"
  category: string;       // e.g. "Security Headers"
  title: string;
  severity: "informational" | "low" | "medium" | "high";
  status: "pass" | "fail" | "informational" | "not-verified";
  evidence: string;       // live value from the target
  description: string;
  impact: string;
  recommendation: string; // concrete fix
}
```

| # | Module | Directory | What it checks |
|---|---|---|---|
| 1 | **URL Validation** | (orchestrator) | Normalize URL, confirm reachability |
| 2 | **HTTPS / TLS** | `lib/scanner/tls/` | HTTPS availability, HTTP→HTTPS redirect, **live handshake**: TLS version, cipher, issuer, expiry, hostname |
| 3 | **Security Headers** | `lib/scanner/headers/` | CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP |
| 4 | **Cookies** | `lib/scanner/cookies/` | Secure, HttpOnly, SameSite, Domain scope, long-lived cookies |
| 5 | **DNS** | `lib/scanner/dns/` | A, AAAA, CNAME, MX, NS, TXT via DoH; SPF analysis (`+all`/`~all`/`-all`); DMARC policy |
| 6 | **CORS** | `lib/scanner/cors/` | OPTIONS preflight with foreign Origin; wildcard, reflected origin, credentials, dangerous methods |
| 7 | **Technology** | `lib/scanner/technology/` | Web server, backend framework, CMS, JS libs, CDN (word-boundary signatures — low false positives) |
| 8 | **security.txt** | `lib/scanner/security-txt/` | RFC 9116 file: Contact, Policy, Encryption, Expires |
| 9 | **robots.txt** | `lib/scanner/robots/` | Disallow/Allow paths, Sitemap URLs, sensitive path disclosure |
| 10 | **Redirects** | `lib/scanner/redirects/` | Chain length, loops, external-domain hops, final destination |

### Preflight (before any module runs)

1. **DNS-over-HTTPS** lookup (`dns.google`) — domain must resolve  
2. **HTTP GET** probe — must return a non-5xx response (HTTPS, then HTTP fallback)  
3. If both fail → **`TargetUnreachableError`** → scan marked `failed`, clear message, **zero fabricated checks**

---

## 📊 Security Score Explained

Score = **weighted ratio of passing checks** (0–100):

```
severity weights:  high = 4 · medium = 3 · low = 2 · informational = 1

score = round( Σ(weight of PASSED checks) / Σ(weight of all scorable checks) × 100 )
```

`not-verified` checks are **excluded** (they neither help nor hurt the score).

| Range | Label | Meaning |
|---:|---|---|
| **90–100** | Strong Configuration | Excellent hardening |
| **70–89** | Good | Minor gaps only |
| **50–69** | Needs Improvement | Notable misconfigurations |
| **0–49** | High Number of Configuration Issues | Significant hardening required |

---

## 🗃 Database Schema

File: `data/scanner.db` (auto-created on first API call)

```sql
CREATE TABLE scans (
  id                   TEXT PRIMARY KEY,          -- internal UUID
  scan_id              TEXT UNIQUE NOT NULL,      -- public ID used in URLs
  url                  TEXT NOT NULL,
  normalized_url       TEXT NOT NULL,
  start_time           TEXT NOT NULL,
  end_time             TEXT,
  duration             INTEGER,                   -- milliseconds
  status               TEXT DEFAULT 'in-progress',-- completed | failed | in-progress
  security_score       INTEGER,
  total_checks         INTEGER DEFAULT 0,
  passed_checks        INTEGER DEFAULT 0,
  informational_count  INTEGER DEFAULT 0,
  low_count            INTEGER DEFAULT 0,
  medium_count         INTEGER DEFAULT 0,
  high_count           INTEGER DEFAULT 0,
  findings             TEXT,                      -- JSON array of ScanFinding
  created_at           TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Indexes: `scan_id`, `created_at`.

> The database file is **git-ignored**. Delete `data/scanner.db` anytime to reset history — it will be recreated.

---

## ⚙️ Configuration

### Built-in defaults (`src/lib/security.ts`)

```ts
SCAN_CONFIG = {
  timeout: 10000,          // 10s per request
  maxRedirects: 10,        // follow at most 10 redirects
  maxResponseSize: 10MB,   // cap response body
  rateLimit: 100,
  userAgent: 'SecurityScanner/1.0 (+https://github.com/security-scanner)'
}
```

### Runtime settings (UI)

**Settings → Scanner Configuration** stores values in browser `localStorage`
(`secscan-settings`): theme, timeout, max redirects, user agent, allow-local,
notifications, auto-save.

### Environment variables

No required `.env` for local development. For production PostgreSQL (future),
add standard DB connection vars — SQLite works out of the box.

---

## 🏗 Project Architecture

```
Browser (React SPA pages)
        │
        │  POST /api/scan  { url }
        ▼
┌─────────────────────────────────────────────┐
│  API Route  (src/app/api/scan/route.ts)     │
│  1. Zod validate                           │
│  2. createScan()  → SQLite row 'in-progress'│
│  3. runScan()     → scanner orchestrator    │
│  4. updateScan()  → save score + findings   │
│  5. return JSON                             │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Orchestrator (lib/scanner/index.ts)        │
│  • preflight DNS+HTTP                       │
│  • loop: 9 modules sequentially             │
│  • aggregate findings                       │
│  • calculateSecurityScore()                 │
└──────────────────┬──────────────────────────┘
                   ▼
   headers · tls · cookies · dns · cors ·
   redirects · technology · security.txt · robots
                   │
                   ▼  live HTTP / DoH / TLS
              Target website
```

**Key rule:** SQLite (`better-sqlite3`) is only imported from **API routes**,
never from client components — keeps the browser bundle clean.

---

## 🧰 Development Commands

| Command | What it does |
|---|---|
| `npm install` | Install all dependencies |
| `npm run dev` | Start dev server → http://localhost:3000 |
| `npm run build` | Production build (type-check + optimize) |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

### Verify the pipeline

```bash
npm run lint
npm run build
npm run dev
```

---

## 🧯 Troubleshooting

| Symptom | Fix |
|---|---|
| `command not found: npm` | Install Node.js 18+ from [nodejs.org](https://nodejs.org), restart terminal |
| `Port 3000 is already used` | Stop the other process, or `npm run dev -- -p 3001` |
| `Cannot find module 'better-sqlite3'` | `npm install` again; on Windows ensure build tools (Visual C++ Redistributable) exist |
| `Execution of scripts is disabled` (Windows) | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Scan says **target unreachable** | Correct the URL; site must be publicly reachable — this is intentional (no fake data) |
| UI looks outdated | Hard refresh: **Ctrl + Shift + R** |
| Want a clean history | Stop server, delete `data/scanner.db`, start again |
| `next dev` warning about slow filesystem | Project on a network drive — move to local disk (e.g. `C:\`) |
| Type errors after pull | `npm install` then `npm run build` |

---

## 🔐 Security & Ethics

SecScan is built for **defensive** use:

| ✅ Allowed | ❌ Not allowed |
|---|---|
| Scanning **your** websites | Scanning third-party sites **without permission** |
| Scanning with **written authorization** | Brute force, credential stuffing |
| Lab / staging environments | Denial-of-service or flood testing |
| Reviewing headers, TLS, DNS, cookies | Exploit development or payload delivery |
| Localhost scans with **allowLocal** enabled | Malware distribution |

**Technical safeguards:**

- Private IP / localhost blocked by default  
- 10-second request timeout, 10 redirect cap, 10 MB body limit  
- Preflight must pass before any module runs  
- Findings marked `not-verified` when a check cannot complete — **never invented**  
- Custom `User-Agent`: `SecurityScanner/1.0`

---

## 🗺 Roadmap

- [ ] PDF / HTML export of reports (jspdf + html2canvas already in dependencies)
- [ ] Scheduled / recurring scans
- [ ] WebSocket live progress (replace client-side progress simulation)
- [ ] Multi-page crawl (limited depth)
- [ ] PostgreSQL adapter for production
- [ ] Auth + multi-user workspaces
- [ ] Webhook / email notifications on scan completion
- [ ] OWASP-based severity tuning and CWE mapping

---

## 📜 Scripts Reference (`package.json`)

```json
{
  "dev":    "next dev",
  "build":  "next build",
  "start":  "next start",
  "lint":   "eslint"
}
```

---

## 🤝 Contributing

1. Fork the repository  
2. Create a feature branch: `git checkout -b feature/amazing-check`  
3. Commit changes: `git commit -m "Add amazing security check"`  
4. Push: `git push origin feature/amazing-check`  
5. Open a Pull Request  

Please keep contributions **non-offensive** (no exploit PoCs, no DoS tooling).

---

## 📄 License

MIT — free to use for **authorized** security testing and education.
See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org) · [React](https://react.dev) · [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org) · [Lucide Icons](https://lucide.dev)
- [Google DNS-over-HTTPS](https://dns.google) · [RFC 9116 (security.txt)](https://www.rfc-editor.org/rfc/rfc9116)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)

---

<div align="center">

**Built with ❤️ for defensive security**

[Report Bug](https://github.com/hassan11a/SecScan-Website-Security-Scanner/issues) ·
[Request Feature](https://github.com/hassan11a/SecScan-Website-Security-Scanner/issues)

⭐ Star this repo if it helps you!

</div>
