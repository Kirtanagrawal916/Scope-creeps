# ScopeGuard

Contract-aware AI workspace protection for freelancers. ScopeGuard compares client emails against your statement of work, flags out-of-scope requests, and drafts client replies.

---

## 🚀 Teammate Quick-Start & Onboarding

Follow these steps to set up ScopeGuard locally.

### 📋 Prerequisites

- **Node.js**: `Node.js >= 18.0.0` (Recommended: v20 or v22 Lts)
- **Package Manager**: `npm` (Use npm to ensure lockfile compliance with `package-lock.json`)
- **Database**: MongoDB (Atlas cloud cluster or a local MongoDB database)

### 🛠️ Step-by-Step Installation

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd Scope-creeps
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Copy `.env.example` to create `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and fill in the values:
     - **`MONGODB_URI`**: Put your connection string here.
     - **`JWT_SECRET`**: Set a secure development key (or use the default placeholder).
     - **`MONGODB_OVERRIDE_DNS`**: Set to `false` (default). If you are on a restricted network (corporate VPN or university Wi-Fi) that blocks public DNS port 53 outbound, keep it `false`. If you are on an unrestricted network and face MongoDB SRV lookup failures, change it to `true`.

4. **Set Up Google OAuth (Optional)**
   - To enable Google OAuth login, configure your credentials in `.env`:
     ```env
     GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     CALLBACK_URL=http://localhost:3000/auth/callback
     ```
   - Ensure `http://localhost:3000/auth/callback` is registered as an Authorized Redirect URI in your Google Cloud Console project.

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## 🧑‍💻 Developer Commands

- **Run Development Server**: `npm run dev`
- **Run Linter**: `npm run lint` (Checks styles and React standards)
- **Run TypeScript Check**: `npx tsc --noEmit` (Verifies type safety)
- **Format Code**: `npm run format` (Runs Prettier to format source files)

---

## 🏥 Developer Health Diagnostics

If you want to verify that your environment, database connectivity, and configuration parameters are fully ready, navigate to the Developer Health Dashboard:

- **Route**: [http://localhost:3000/health](http://localhost:3000/health)

This page displays an interactive status panel checking:

- MongoDB connectivity
- JWT secret loading status
- Essential environment variables mapping
- System/Node version info

---

## 🔍 Troubleshooting Login & Connection Issues

If clicking the **Log in** button does not log you in or freezes:

1. **Verify Your Terminal Logs**:
   - Look at the dev server console output. The backend has detailed diagnostic logs prefixing `[AUTH SERVER]`.
2. **Check DNS Configuration (`MONGODB_OVERRIDE_DNS`)**:
   - If you see DNS resolution failures (`ECONNREFUSED` or timeouts trying to resolve `.mongodb.net`), verify whether you are on a VPN or secured network.
   - If on a VPN/Corporate network: Set `MONGODB_OVERRIDE_DNS=false` in `.env`.
   - If on an unrestricted home network with SRV issues: Set `MONGODB_OVERRIDE_DNS=true` in `.env`.
3. **Check Browser Cookie Blockers**:
   - Ensure your browser allows local session cookies. ScopeGuard sets a `session_token` cookie under `localhost`.
   - If you test in Incognito or use privacy extensions that block third-party cookies, they might occasionally interfere with session validation.
