# ScopeGuard

> **Contract-Aware AI Workspace Protection for Freelancers & Agencies**

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.168-ff4154?logo=reactquery)](https://tanstack.com/start)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://vercel.com/)

---

## 🌐 Live Demo

- **Production Application URL:** https://scope-creeps-nine.vercel.app/
- **Diagnostic Health Check:** https://scope-creeps-nine.vercel.app/health

---

## 📦 GitHub Repository

- **Repository:** https://github.com/Kirtanagrawal916/Scope-creeps

---

## 🖼️ Screenshots

> Screenshots will be added soon.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Why ScopeGuard?](#-why-scopeguard)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Authentication Setup](#-authentication-setup)
- [MongoDB Setup](#-mongodb-setup)
- [Gemini AI Setup](#-gemini-ai-setup)
- [Available npm Scripts](#-available-npm-scripts)
- [Production Deployment](#-production-deployment)
- [Production Environment Variables](#-production-environment-variables)
- [Production OAuth Callback URLs](#-production-oauth-callback-urls)
- [Security Features](#-security-features)
- [Testing & Verification](#-testing--verification)
- [Health Diagnostics](#-health-diagnostics)
- [Troubleshooting](#-troubleshooting)
- [Deployment Checklist](#-deployment-checklist)
- [Git Workflow](#-git-workflow)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**ScopeGuard** is a contract-aware workspace protection platform tailored for freelancers, agencies, and software consultants. It acts as an automated perimeter guard for client communications—comparing incoming email threads or feature requests against active Statements of Work (SOW), identifying out-of-scope requests, estimating financial and timeline impacts, and generating calm, professional response drafts.

---

## 💡 Why ScopeGuard?

Freelancers and software agencies lose thousands of rupees each month to unbilled **scope creep**—gradual, undocumented feature requests introduced during active development. 

ScopeGuard solves this by providing:
- **Contract Awareness:** Automatically checks client communications against baseline deliverables.
- **Quantified Risk:** Instantly estimates extra billing hours, timeline delays, and recommended cost additions.
- **Client Harmony:** Drafts firm, polite responses that protect revenue without alienating client relationships.

---

## ✨ Key Features

- **AI Contract Scope Analysis:** Real-time analysis of client requests against active Statements of Work (SOW).
- **Multi-Provider Authentication:** Email/password login with support for Google OAuth 2.0 and GitHub OAuth.
- **Sliding Session Architecture:** Secure JWT session tokens stored in HTTP-only cookies (`session_token`) with CSRF protection.
- **Inbox & Alert Feed:** Risk-categorized email thread viewer (`low`, `medium`, `high` risk indicators).
- **Project & Workspace Management:** Track budgets (in ₹), hourly rates, scope items, out-of-scope boundaries, and contract text.
- **Global Search & Command Palette:** Keyboard-navigable quick search across projects, threads, and analyses (`Cmd/Ctrl + K`).
- **Multi-Format Export Engine:** Export scope reports in PDF, CSV, XLSX, DOCX, JSON, or ZIP format.
- **System Health Diagnostics:** Built-in `/health` diagnostic dashboard verifying DB connection, JWT, and OAuth status.
- **Admin Control Center:** Platform analytics, audit logs, feature flags, and user administration (`/app/admin/*`).

---

## ⚙️ How It Works

```
1. Create Project & Scope  -->  2. Paste Client Request  -->  3. AI Scope Analysis  -->  4. Generate Client Reply
 (Upload SOW/Contract)          (Email or Message)           (Detect Extra Hours)       (Send Professional Draft)
```

1. **Project & SOW Creation:** Define active projects, client names, baseline scope items, and contract terms.
2. **Client Request Analysis:** Input new client requests or sync email threads into the analysis engine.
3. **Scope Creep Detection:** Google Gemini AI compares the request against active contract deliverables.
4. **Cost & Timeline Impact:** Calculates additional hours required, timeline delay in days, and suggested billing adjustments (in ₹).
5. **AI Reply Generation:** Produces customizable client response drafts negotiating change orders or billing updates.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [TanStack Start](https://tanstack.com/start) (React 19 + TypeScript + SSR + Server Functions) |
| **Bundler** | Vite 8 + Nitro Engine |
| **Styling** | TailwindCSS v4 + Framer Motion + Lucide React |
| **Database** | MongoDB Atlas + Mongoose ORM |
| **Authentication** | Custom JWT (`jose`), `bcryptjs`, Google OAuth 2.0, GitHub OAuth |
| **AI Engine** | `@google/genai` (Google Gemini Flash API) |
| **Export Engine** | `jsPDF`, `jspdf-autotable`, `fflate` |
| **Deployment** | Vercel (Primary Full-Stack Host) + Render (Optional Express Backend) |

---

## 🏗️ Architecture

ScopeGuard uses a modern serverless full-stack architecture powered by TanStack Start:

- **Client Layer:** React 19 SPA with SSR hydration, file-based routing, and optimistic UI updates.
- **Server Function Layer:** Type-safe RPC handlers executing on Node.js serverless functions (Vercel / Nitro).
- **Data Layer:** Browser-safe Mongoose models with connection pooling connecting to MongoDB Atlas.
- **Auth Layer:** Dual OAuth 2.0 flow & email/password authentication using HTTP-only cookies and JWTs.

---

## 📁 Project Structure

```
Scope-creeps/
├── src/
│   ├── components/         # UI components, layout shells, modals, theme toggles
│   ├── config/             # Application configuration constants
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Core logic & server functions
│   │   ├── ai/             # Gemini API client & prompt definitions
│   │   ├── export-engine/  # PDF, CSV, XLSX, DOCX export generators
│   │   ├── analyses.server.ts # Scope analysis server functions
│   │   ├── auth.server.ts  # Server-only auth logic, JWT & OAuth handlers
│   │   ├── auth.ts         # Client-safe server function wrappers
│   │   ├── db.ts           # Browser-safe MongoDB connection pool
│   │   └── jwt.ts          # JWT signing & verification
│   ├── models/             # Browser-safe Mongoose schema definitions
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   ├── Analysis.ts
│   │   ├── EmailThread.ts
│   │   ├── FeatureFlag.ts
│   │   ├── Notification.ts
│   │   └── AuditLog.ts
│   ├── routes/             # TanStack Start file-based routes
│   │   ├── __root.tsx
│   │   ├── index.tsx       # Landing page
│   │   ├── login.tsx       # Authentication page
│   │   ├── register.tsx    # Workspace creation page
│   │   ├── health.tsx      # Diagnostic health check
│   │   ├── auth.callback.tsx # OAuth callback route
│   │   └── app.*.tsx       # Protected application workspace routes
│   ├── server.ts           # SSR server entry wrapper
│   └── start.ts            # TanStack Start instance & CSRF middleware
├── server/                 # Optional standalone Express API backend
├── DEPLOYMENT.md           # Step-by-step production deployment guide
├── vercel.json             # Vercel deployment configuration
├── render.yaml             # Render service deployment manifest
└── package.json
```

---

## 📋 Prerequisites

Ensure you have the following installed on your local development machine:

- **Node.js:** `Node.js >= 18.0.0` (v20 or v22 LTS recommended)
- **Package Manager:** `npm` (required for lockfile compliance with `package-lock.json`)
- **Database:** MongoDB Atlas cluster or a local MongoDB database

---

## 🚀 Quick Start

Follow these steps to run ScopeGuard locally:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Kirtanagrawal916/Scope-creeps.git
   cd Scope-creeps
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Create Environment File:**
   ```bash
   cp .env.example .env
   ```

4. **Configure Environment Variables:**
   Open `.env` and set your database and secret placeholders:
   ```ini
   MONGODB_URI=YOUR_MONGODB_URI
   JWT_SECRET=YOUR_JWT_SECRET
   SESSION_SECRET=YOUR_SESSION_SECRET
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

6. **Open Application in Browser:**
   Navigate to [http://localhost:8080](http://localhost:8080) in your browser.

---

## ⚙️ Environment Variables

### Reference Environment Variable Table

| Variable Name | Required | Purpose | Local Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Runtime environment mode | `development` |
| `APP_URL` | Yes | Application base URL | `http://localhost:8080` |
| `MONGODB_URI` | Yes | MongoDB Atlas Connection URI | `mongodb+srv://...` |
| `MONGODB_OVERRIDE_DNS` | No | Set `true` if network restricts DNS SRV | `false` |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens | `YOUR_JWT_SECRET` |
| `SESSION_SECRET` | Yes | Secret key for session security | `YOUR_SESSION_SECRET` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Client ID | `YOUR_GOOGLE_CLIENT_ID` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth 2.0 Client Secret | `YOUR_GOOGLE_CLIENT_SECRET` |
| `GOOGLE_CALLBACK_URL` | Optional | Google OAuth Callback URL | `http://localhost:8080/auth/callback?provider=google` |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth App Client ID | `YOUR_GITHUB_CLIENT_ID` |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth App Client Secret | `YOUR_GITHUB_CLIENT_SECRET` |
| `GITHUB_CALLBACK_URL` | Optional | GitHub OAuth Callback URL | `http://localhost:8080/auth/callback?provider=github` |
| `GEMINI_API_KEY` | Optional | Google Gemini API key | `YOUR_GEMINI_API_KEY` |

> ⚠️ **SECURITY NOTE:** Never commit real secrets to Git. Replace secret values with secure placeholders in `.env.example`.

---

## 🔐 Authentication Setup

### 1. Email/Password Authentication
- Requires no external provider configuration beyond a connected MongoDB database and `JWT_SECRET`.
- Passwords are salted and hashed using `bcryptjs`.

### 2. Google OAuth Setup
1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application Type: Web Application).
3. Add **Authorized Redirect URIs**:
   - **Local:** `http://localhost:8080/auth/callback?provider=google`
   - **Production:** `https://scope-creeps-nine.vercel.app/auth/callback?provider=google`
4. Copy credentials into `.env`:
   ```ini
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
   GOOGLE_CALLBACK_URL=http://localhost:8080/auth/callback?provider=google
   ```

### 3. GitHub OAuth Setup
1. Go to [GitHub Developer Settings -> OAuth Apps](https://github.com/settings/developers).
2. Register a new OAuth Application.
3. Set **Authorization Callback URL**:
   - **Local:** `http://localhost:8080/auth/callback?provider=github`
   - **Production:** `https://scope-creeps-nine.vercel.app/auth/callback?provider=github`
4. Copy credentials into `.env`:
   ```ini
   GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
   GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
   GITHUB_CALLBACK_URL=http://localhost:8080/auth/callback?provider=github
   ```

---

## 🍃 MongoDB Setup

1. **Create MongoDB Atlas Cluster:** Set up a database cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Network Access & Security Note:**
   - Under **Security -> Network Access**, click **Add IP Address** and add `0.0.0.0/0` (Allow Access from Anywhere).
   - **Why `0.0.0.0/0` is needed:** Vercel serverless functions invoke queries across dynamic outbound IP ranges in Cloud environments.
   - **Security Warning:** `0.0.0.0/0` allows connections from any IP address. Use strong database credentials, least-privilege database users, and restrict network access whenever your deployment infrastructure supports fixed outbound IPs.
3. **Database Credentials:** Add your Atlas connection string to `MONGODB_URI` in `.env`.
4. **DNS Override** (`MONGODB_OVERRIDE_DNS`):
   - Keep `MONGODB_OVERRIDE_DNS=false` by default.
   - Set `MONGODB_OVERRIDE_DNS=true` if your local network blocks default DNS SRV queries.

---

## 🤖 Gemini AI Setup

Contract scope analysis and automated response generation use Google Gemini AI:

1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Set the key in `.env`:
   ```ini
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```
3. If no key is provided, ScopeGuard falls back to deterministic rule-based analysis without failing.

---

## 📜 Available npm Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite development server at `http://localhost:8080` |
| `npm run build` | Compiles production server and client bundles via Nitro/Vite |
| `npm run preview` | Previews compiled production build locally |
| `npm run lint` | Runs ESLint checks for code quality and React standards |
| `npm run format` | Runs Prettier to format source files |
| `npm run backend:dev` | Starts standalone Express backend via Nodemon |
| `npm run backend:start` | Runs standalone Express backend via Node.js |

---

## 🌐 Production Deployment

### Vercel Deployment (Primary Platform)

Vercel is the recommended platform for deploying the full-stack TanStack Start application.

#### Option A: Git-Connected Workflow (Recommended)
1. Import your GitHub repository (`https://github.com/Kirtanagrawal916/Scope-creeps`) into the [Vercel Dashboard](https://vercel.com/new).
2. Vercel automatically detects Vite and builds the application on every push to your production branch (`main`).
3. Add production environment variables in **Vercel Dashboard -> Project Settings -> Environment Variables**.

#### Option B: Vercel CLI
Alternatively, deploy directly from your command line:
1. **Authenticate Vercel CLI:**
   ```bash
   npx vercel login
   ```
2. **Deploy to Production:**
   ```bash
   npx vercel --prod
   ```

### Render Deployment (Optional Standalone Backend)

If deploying the standalone Express backend (`server/server.js`):

1. Connect your repository on [Render Dashboard](https://dashboard.render.com).
2. Select **Web Service**.
3. Build Command: `npm install` | Start Command: `node server/server.js` | Health Check Path: `/api/health`

---

## 🔒 Production Environment Variables

Ensure these environment variable names are set on your production platform:

- `NODE_ENV=production`
- `APP_URL=https://scope-creeps-nine.vercel.app`
- `MONGODB_URI=YOUR_MONGODB_URI`
- `JWT_SECRET=YOUR_JWT_SECRET`
- `SESSION_SECRET=YOUR_SESSION_SECRET`
- `GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL=https://scope-creeps-nine.vercel.app/auth/callback?provider=google`
- `GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL=https://scope-creeps-nine.vercel.app/auth/callback?provider=github`

---

## 🔗 Production OAuth Callback URLs

Ensure these exact callback URLs are registered in your provider dashboards:

- **Google Cloud Console Redirect URI:**
  `https://scope-creeps-nine.vercel.app/auth/callback?provider=google`
- **GitHub OAuth App Callback URL:**
  `https://scope-creeps-nine.vercel.app/auth/callback?provider=github`

---

## 🛡️ Security Features

- **HTTP-Only Cookies:** Auth tokens stored in `session_token` cookie with `httpOnly: true`, `sameSite: "lax"`, and `secure: true` in production.
- **CSRF Protection:** Server function calls filtered by TanStack Start CSRF middleware.
- **Password Security:** Salted password hashing via `bcryptjs`.
- **Browser-Safe ORM:** Mongoose models loaded dynamically on Node.js server environments to prevent leaking DB credentials or Node built-ins to the client.
- **Ownership Scoping:** Database queries enforced with `{ owner: userId }` filters to prevent IDOR vulnerabilities.

---

## 🧪 Testing & Verification

Run these validation commands before pushing changes:

```bash
# 1. Type Safety Check
npx tsc --noEmit

# 2. Linting & Formatting Check
npm run lint

# 3. Production Build Compilation Check
npm run build
```

---

## 🏥 Health Diagnostics

ScopeGuard includes a live health check endpoint to inspect database connectivity, JWT loading, and environment status:

- **Local Route:** [http://localhost:8080/health](http://localhost:8080/health)
- **Production Route:** [https://scope-creeps-nine.vercel.app/health](https://scope-creeps-nine.vercel.app/health)

---

## ❓ Troubleshooting

1. **OAuth Buttons Do Nothing:** Verify client bundle loads without `mongoose` SyntaxErrors by running `npx tsc --noEmit`.
2. **MongoDB Connection Failures:** Check if you are on a restricted corporate VPN. Set `MONGODB_OVERRIDE_DNS=false` if on VPN, or `MONGODB_OVERRIDE_DNS=true` on home networks with DNS SRV issues.
3. **OAuth Redirect Mismatch:** Ensure `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL` match your actual app domain (including protocol `https://` and query string `?provider=...`).

---

## ✅ Deployment Checklist

- [ ] `npx tsc --noEmit` completes with 0 errors.
- [ ] `npm run lint` completes with 0 errors.
- [ ] `npm run build` compiles cleanly.
- [ ] `MONGODB_URI` connects to production MongoDB Atlas.
- [ ] `JWT_SECRET` and `SESSION_SECRET` are unique 64-character strings.
- [ ] Google & GitHub production callback URLs registered.
- [ ] Health check endpoint `/health` returns operational status.

---

## 🌿 Git Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Commit changes with clear, descriptive commit messages.
3. **Never force-push or amend pushed commits** on shared or connected deployment branches.
4. Open a Pull Request for review.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to help improve ScopeGuard.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
