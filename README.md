<div align="center">

# 🛡️ SecScan

### Website Security Scanner

**A modern defensive cybersecurity tool for analyzing publicly accessible website security configurations.**

Scan • Analyze • Score • Report

<br>

[![Next.js](https://img.shields.io/badge/Next.js-16.3.6-000000?style=for-the-badge\&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge\&logo=tailwindcss\&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge\&logo=sqlite\&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

<br><br>

**🔐 Defensive Security · 📊 Risk Scoring · 🧪 Safe Testing · 📋 Detailed Reports**

</div>

---

## 🚀 What is SecScan?

**SecScan** is a full-stack website security scanner built with **Next.js, React, TypeScript and Node.js**.

It analyzes publicly accessible security configurations of authorized websites and identifies common security weaknesses and configuration issues.

SecScan can inspect:

* 🔒 HTTPS & TLS configuration
* 🛡️ Security headers
* 🍪 Cookie security
* 🌐 CORS configuration
* 🔎 DNS records
* 🔀 Redirect behavior
* ⚙️ Technology exposure
* 📄 `security.txt`
* 🤖 `robots.txt`

After scanning, SecScan generates a **0–100 security score** and a detailed report containing findings, evidence, severity, impact and recommended remediation.

> **SecScan is designed for defensive security analysis — not exploitation.**

---

# ✨ Why SecScan?

Security configuration is often overlooked.

A website can be online, functional and visually secure while still exposing unnecessary information or missing important security controls.

SecScan brings multiple checks into one dashboard:

```text
        🌐 Target Website
               │
               ▼
       ┌───────────────┐
       │   Preflight   │
       │ DNS + HTTP    │
       └───────┬───────┘
               │
               ▼
    ┌─────────────────────┐
    │    SecScan Engine   │
    └──────────┬──────────┘
               │
     ┌─────────┼─────────┐
     ▼         ▼         ▼
   TLS      Headers     DNS
     │         │         │
     ▼         ▼         ▼
 Cookies     CORS    Redirects
     │         │         │
     └─────────┼─────────┘
               ▼
       Technology Detection
               │
               ▼
        Security Findings
               │
               ▼
        ┌──────────────┐
        │ Score 0–100  │
        └──────┬───────┘
               ▼
       📊 Security Report
```

---

# 🔥 Features

## 🔍 Security Scanner

### HTTPS / TLS

* HTTPS availability
* HTTP → HTTPS redirect
* TLS protocol version
* Cipher information
* Certificate issuer
* Certificate expiry
* Hostname validation

### 🛡️ Security Headers

Checks commonly recommended browser security headers including:

* Content-Security-Policy
* Strict-Transport-Security
* X-Content-Type-Options
* X-Frame-Options
* Referrer-Policy
* Permissions-Policy
* Cross-Origin-Opener-Policy
* Cross-Origin-Resource-Policy

### 🍪 Cookie Security

Analyzes cookie attributes such as:

* `Secure`
* `HttpOnly`
* `SameSite`
* Domain scope
* Long-lived cookies

### 🌐 CORS

Analyzes publicly observable CORS behavior including:

* Wildcard origins
* Reflected origins
* Credential handling
* Preflight responses
* Potentially dangerous methods

### 🔎 DNS

Checks:

* A
* AAAA
* CNAME
* MX
* NS
* TXT
* SPF
* DMARC

DNS lookups use **DNS-over-HTTPS**.

### 🔀 Redirect Analysis

Examines:

* Redirect chains
* Redirect count
* Redirect loops
* External-domain redirects
* Final destination

### ⚙️ Technology Detection

Attempts to identify publicly exposed technologies such as:

* Web servers
* Frameworks
* CMS platforms
* JavaScript libraries
* CDN-related signatures

### 📄 security.txt

Checks for:

```text
/.well-known/security.txt
```

Based on **RFC 9116**.

Checks available fields such as:

* Contact
* Policy
* Encryption
* Expires

### 🤖 robots.txt

Analyzes:

```text
/robots.txt
```

for:

* Disallow rules
* Allow rules
* Sitemap URLs
* Potentially sensitive path exposure

---

# 📊 Security Scoring

SecScan converts scan results into a **0–100 security score**.

Severity weights:

| Severity         | Weight |
| ---------------- | -----: |
| 🔴 High          |      4 |
| 🟠 Medium        |      3 |
| 🟡 Low           |      2 |
| 🔵 Informational |      1 |

The score is calculated from the weighted ratio of passing checks.

```text
Score =
(Passing Check Weight / Total Scorable Check Weight) × 100
```

`not-verified` checks are excluded from the calculation.

### Score interpretation

|  Score | Status                           |
| -----: | -------------------------------- |
| 90–100 | Strong Configuration             |
|  70–89 | Good                             |
|  50–69 | Needs Improvement                |
|   0–49 | Significant Configuration Issues |

> The score is a configuration-oriented indicator, not a guarantee that a website is secure.

---

# 📋 Findings

Every finding follows a standardized structure:

```ts
{
  checkId: string;
  category: string;
  title: string;
  severity: "informational" | "low" | "medium" | "high";
  status: "pass" | "fail" | "informational" | "not-verified";
  evidence: string;
  description: string;
  impact: string;
  recommendation: string;
}
```

Each issue can include:

### 🔎 Evidence

What SecScan observed from the target.

### ⚠️ Impact

Why the configuration may matter.

### 💡 Recommendation

A practical remediation suggestion.

---

# 🧠 Smart Scan Engine

SecScan performs a **preflight check before running the scanner modules**.

### Preflight flow

```text
1. Validate URL
       ↓
2. DNS resolution
       ↓
3. HTTP reachability
       ↓
4. Target available?
       ↓
   ┌───┴───┐
   │       │
  YES      NO
   │       │
   ▼       ▼
 Scan     Stop
```

This helps prevent:

* Fake results
* Scanning unreachable targets
* Misleading reports
* Unnecessary requests

If a target cannot be reached, SecScan reports the failure instead of generating fabricated findings.

---

# 🛡️ Built-in Safety Controls

SecScan is intentionally designed around **safe, non-destructive testing**.

### Default protections

* ⏱️ 10-second request timeout
* 🔀 Maximum 10 redirects
* 📦 Maximum 10 MB response size
* 🚫 Private IP protection
* 🚫 Localhost blocked by default
* 🧪 Optional local testing mode
* ✅ Preflight before scanner modules
* ❌ No brute force
* ❌ No credential attacks
* ❌ No exploitation
* ❌ No denial-of-service testing
* ❌ No malware or payload delivery

---

# 🖥️ Dashboard

SecScan includes an interactive dashboard containing:

* 📊 Overall security statistics
* 🎯 Security score
* 📈 Score trends
* 🥧 Severity distribution
* 🕘 Recent scans
* ⚡ Quick actions
* 📋 Scan history

---

# 📄 Security Reports

Each completed scan generates a detailed report.

Reports include:

```text
Target
  ↓
Security Score
  ↓
Passed Checks
  ↓
Security Findings
  ↓
Severity Breakdown
  ↓
Evidence
  ↓
Impact
  ↓
Recommended Fix
```

---

# 🕘 Scan History

SecScan stores previous scan results locally using SQLite.

History includes:

* Target URL
* Scan date
* Security score
* Finding count
* Severity counts
* Scan status
* Scan duration

---

# ⚙️ Settings

The application provides configurable scanner preferences including:

* Light / Dark / System theme
* Request timeout
* Maximum redirects
* User-Agent
* Local scan permission
* Notifications
* Auto-save preferences

Browser settings are persisted using:

```text
localStorage
```

---

# 🛠️ Tech Stack

| Technology         | Purpose               |
| ------------------ | --------------------- |
| **Next.js 16**     | Full-stack framework  |
| **React 19**       | User interface        |
| **TypeScript**     | Type-safe development |
| **Tailwind CSS 4** | Styling               |
| **Recharts**       | Dashboard charts      |
| **Lucide React**   | Icons                 |
| **Zod**            | Request validation    |
| **better-sqlite3** | Local database        |
| **Node.js TLS**    | TLS inspection        |
| **DNS-over-HTTPS** | DNS analysis          |
| **ESLint**         | Code quality          |

---

# 🚀 Quick Start

## Requirements

Before running SecScan, install:

* Node.js **18.18+**
* npm **9+**
* Git

Check your versions:

```bash
node -v
npm -v
git --version
```

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/hassan11a/SecScan-Website-Security-Scanner.git
```

Move into the project:

```bash
cd SecScan-Website-Security-Scanner
```

If the application is inside a subfolder:

```bash
cd scanner-app
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Start Development Server

```bash
npm run dev
```

You should see:

```text
▲ Next.js
- Local: http://localhost:3000
✓ Ready
```

---

## 4️⃣ Open SecScan

Open:

```text
http://localhost:3000
```

Main pages:

| URL          | Page              |
| ------------ | ----------------- |
| `/dashboard` | Dashboard         |
| `/scanner`   | New Security Scan |
| `/history`   | Scan History      |
| `/settings`  | Settings          |
| `/scan/[id]` | Scan Report       |

---

# ⚡ First Scan

You can start your first authorized scan in a few seconds:

```text
1. Open /scanner
        ↓
2. Enter an authorized URL
        ↓
3. Click "Start Security Scan"
        ↓
4. SecScan performs preflight
        ↓
5. Scanner modules execute
        ↓
6. Findings are generated
        ↓
7. Security score is calculated
        ↓
8. Report is displayed
```

For example:

```text
https://example.com
```

Only scan websites you own or have explicit permission to test.

---

# 📁 Project Structure

```text
SecScan-Website-Security-Scanner/
│
├── README.md
├── LICENSE
├── .gitignore
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
│
├── public/
│
├── data/
│   └── scanner.db
│
└── src/
    │
    ├── app/
    │   ├── dashboard/
    │   ├── scanner/
    │   ├── scan/
    │   │   └── [id]/
    │   ├── history/
    │   ├── settings/
    │   │
    │   └── api/
    │       ├── scan/
    │       ├── scans/
    │       └── report/
    │           └── [id]/
    │
    ├── components/
    │   ├── Navigation.tsx
    │   └── ui/
    │
    ├── lib/
    │   ├── Database.ts
    │   ├── security.ts
    │   ├── utils.ts
    │   │
    │   └── scanner/
    │       ├── index.ts
    │       ├── base.ts
    │       ├── headers/
    │       ├── tls/
    │       ├── cookies/
    │       ├── dns/
    │       ├── cors/
    │       ├── redirects/
    │       ├── technology/
    │       ├── security-txt/
    │       └── robots/
    │
    └── types/
        └── index.ts
```

---

# 🔌 API Reference

## `POST /api/scan`

Starts a security scan.

### Request

```json
{
  "url": "https://example.com",
  "allowLocal": false
}
```

### Response

```json
{
  "scanId": "scan-example",
  "url": "https://example.com",
  "securityScore": 82,
  "status": "completed",
  "totalChecks": 36,
  "passedChecks": 30,
  "findings": []
}
```

---

## `GET /api/scans`

Returns previous scans.

```text
GET /api/scans?limit=10&offset=0
```

---

## `GET /api/report/[id]`

Returns a complete scan report.

```text
GET /api/report/{scanId}
```

---

# 🏗️ Architecture

```text
                         ┌──────────────────┐
                         │     Browser      │
                         │ React / Next.js  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    API Routes    │
                         │   Zod Validate   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Scan Engine     │
                         │  Orchestrator    │
                         └────────┬─────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
          TLS/SSL             Headers                DNS
             │                    │                    │
             ▼                    ▼                    ▼
          Cookies               CORS              Redirects
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  │
                                  ▼
                       Technology Detection
                                  │
                                  ▼
                         Finding Aggregator
                                  │
                                  ▼
                          Score Calculator
                                  │
                                  ▼
                             SQLite DB
                                  │
                                  ▼
                         📊 Security Report
```

---

# 🗃️ Database

SecScan uses:

```text
better-sqlite3
```

Database:

```text
data/scanner.db
```

The database is automatically created when required.

The database contains information such as:

* Scan ID
* Target URL
* Start/end time
* Duration
* Security score
* Check counts
* Severity counts
* Scan findings
* Scan status

> `data/scanner.db` should remain ignored by Git.

---

# ⚙️ Configuration

Default scanner configuration:

```ts
{
  timeout: 10000,
  maxRedirects: 10,
  maxResponseSize: 10 * 1024 * 1024,
  rateLimit: 100,
  userAgent: "SecurityScanner/1.0"
}
```

No required environment variables are needed for basic local development.

---

# 🧰 Development Commands

| Command         | Description              |
| --------------- | ------------------------ |
| `npm install`   | Install dependencies     |
| `npm run dev`   | Start development server |
| `npm run build` | Create production build  |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

Recommended verification:

```bash
npm run lint
npm run build
```

---

# 🧯 Troubleshooting

### Port 3000 is already in use

Run:

```bash
npm run dev -- -p 3001
```

Then open:

```text
http://localhost:3001
```

### `npm` is not recognized

Install Node.js and restart the terminal.

### `better-sqlite3` installation issue

Try:

```bash
npm install
```

On Windows, ensure the required native build dependencies are available.

### Target unreachable

Make sure:

* URL is correct
* Website is publicly reachable
* DNS resolves correctly
* Target is not blocking the request

This behavior is intentional because SecScan does not generate fake scan results.

### Reset scan history

Stop the application and remove:

```text
data/scanner.db
```

The database will be recreated automatically.

---

# 🔐 Security & Responsible Use

SecScan is intended for:

### ✅ Allowed

* Your own websites
* Authorized penetration-testing environments
* Staging environments
* Security labs
* Educational testing
* Websites where you have explicit permission

### ❌ Not Intended For

* Unauthorized scanning
* Brute-force attacks
* Credential attacks
* Denial-of-service testing
* Exploit delivery
* Malware
* Destructive testing

> **Always obtain authorization before scanning a target you do not own.**

The project is designed to provide **defensive visibility**, not offensive exploitation.

---

# 🗺️ Roadmap

### Current

* [x] Security headers
* [x] HTTPS / TLS analysis
* [x] Cookie analysis
* [x] DNS analysis
* [x] CORS analysis
* [x] Redirect analysis
* [x] Technology detection
* [x] security.txt analysis
* [x] robots.txt analysis
* [x] Security scoring
* [x] Dashboard
* [x] Scan history
* [x] SQLite persistence

### Planned

* [ ] PDF report export
* [ ] HTML report export
* [ ] Scheduled scans
* [ ] Recurring monitoring
* [ ] Real-time WebSocket progress
* [ ] Limited website crawling
* [ ] PostgreSQL support
* [ ] Authentication
* [ ] Multi-user workspaces
* [ ] Email notifications
* [ ] Webhook integrations
* [ ] CWE mapping
* [ ] Expanded OWASP coverage

---

# 🤝 Contributing

Contributions are welcome.

### 1. Fork

Fork the repository.

### 2. Create a branch

```bash
git checkout -b feature/new-security-check
```

### 3. Make your changes

Keep the implementation focused and defensive.

### 4. Commit

```bash
git commit -m "Add new security check"
```

### 5. Push

```bash
git push origin feature/new-security-check
```

### 6. Open a Pull Request

Please keep contributions aligned with the project's defensive-security purpose.

---

# 📜 License

This project is licensed under the **MIT License**.

See:

```text
LICENSE
```

for complete license terms.

---

# 🙏 Built With

SecScan is powered by open-source technologies including:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts
* Lucide
* Zod
* SQLite
* Node.js

---

<div align="center">

## 🛡️ SecScan

**Scan smarter. Understand better. Secure responsibly.**

Built for **defensive cybersecurity, security awareness and authorized testing.**

<br>

⭐ **If you find SecScan useful, consider giving the repository a star.**

<br>

[🐛 Report a Bug](https://github.com/hassan11a/SecScan-Website-Security-Scanner/issues)
  •  
[💡 Request a Feature](https://github.com/hassan11a/SecScan-Website-Security-Scanner/issues)

<br><br>

**Made with ❤️ for Cybersecurity**

</div>
