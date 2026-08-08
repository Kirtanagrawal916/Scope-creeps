import fs from "fs";
import path from "path";
import { connectToDatabase } from "./db";

let isStartupValidated = false;

/**
 * Validates essential environment variables and tests MongoDB connectivity.
 * Runs once during initial request handling to prevent silent boot failures.
 */
export async function validateStartup() {
  if (isStartupValidated) {
    return;
  }
  isStartupValidated = true;

  console.log("\n+--------------------------------------------------------------+");
  console.log("| 🛡️  ScopeGuard Onboarding & Startup Diagnostics              |");
  console.log("+--------------------------------------------------------------+");

  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error("| ❌ [ERROR] Environment configuration (.env) file is missing! |");
    console.error("|                                                              |");
    console.error("| 👉 To configure your environment, please follow these steps: |");
    console.error("| 1. Copy the .env.example template to .env:                   |");
    console.error("|    cp .env.example .env                                      |");
    console.error("| 2. Open .env and set MONGODB_URI with your database details. |");
    console.error("| 3. Set JWT_SECRET to a random string.                        |");
    console.error("| 4. Re-run `npm run dev` to start the server.                 |");
    console.log("+--------------------------------------------------------------+\n");
    return;
  }

  let healthy = true;
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Validate MONGODB_URI
  if (!process.env.MONGODB_URI) {
    console.error("| ❌ [ERROR] MONGODB_URI is not defined in .env!               |");
    healthy = false;
  } else {
    console.log("| [SUCCESS] MONGODB_URI is set.                                |");
  }

  // 2. Validate JWT_SECRET
  if (!process.env.JWT_SECRET) {
    if (isProduction) {
      console.error("| ❌ [ERROR] JWT_SECRET is required in production!             |");
      healthy = false;
    } else {
      console.warn("| ⚠️  [WARNING] JWT_SECRET is not set. Using dev fallback key. |");
    }
  } else {
    console.log("| [SUCCESS] JWT_SECRET is configured.                          |");
  }

  // 3. Validate Google OAuth Configuration (Supports GOOGLE_CALLBACK_URL, CALLBACK_URL, or APP_URL fallback)
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    process.env.CALLBACK_URL ||
    (process.env.APP_URL ? `${process.env.APP_URL}/auth/callback?provider=google` : undefined);

  const oauthKeys = [googleClientId, googleClientSecret, googleCallbackUrl];
  const oauthPresentCount = oauthKeys.filter(Boolean).length;

  if (oauthPresentCount > 0 && oauthPresentCount < 3) {
    console.warn("| ⚠️  [WARNING] Google OAuth is partially configured:           |");
    if (!googleClientId) {
      console.warn("|    - Missing GOOGLE_CLIENT_ID                                |");
    }
    if (!googleClientSecret) {
      console.warn("|    - Missing GOOGLE_CLIENT_SECRET                            |");
    }
    if (!googleCallbackUrl) {
      console.warn("|    - Missing GOOGLE_CALLBACK_URL / CALLBACK_URL              |");
    }
    healthy = false;
  } else if (oauthPresentCount === 3) {
    console.log("| [SUCCESS] Google OAuth is fully configured and enabled.       |");
  } else {
    console.log("| [INFO] Google OAuth is disabled (optional credentials missing). |");
  }

  // 4. Test MongoDB Connectivity
  if (process.env.MONGODB_URI) {
    console.log("| Testing database connection...                               |");
    try {
      await connectToDatabase();
      console.log("| [SUCCESS] Successfully connected to MongoDB database.        |");
    } catch (err) {
      const dbErr = err as Error;
      console.error("| ❌ [ERROR] Database connection failed!                       |");
      console.error(`|    Details: ${dbErr.message || String(err)}`);
      console.log("|                                                              |");
      console.log("| 💡 Troubleshooting Database Failures:                        |");
      console.log("| 1. Ensure your MongoDB cluster credentials are valid in .env |");
      console.log("| 2. Check if your current IP address is whitelisted in Atlas  |");
      console.log("| 3. Are you behind a VPN or corporate firewall? If so,        |");
      console.log("|    outbound port 53 (DNS) may be blocked. Try setting:       |");
      console.log("|    MONGODB_OVERRIDE_DNS=false in your .env file.             |");
      console.log("| 4. If you have DNS resolution issues, set:                   |");
      console.log("|    MONGODB_OVERRIDE_DNS=true in your .env file.              |");
      healthy = false;
    }
  }

  if (healthy) {
    console.log("+--------------------------------------------------------------+");
    console.log("| [SUCCESS] All checks passed! ScopeGuard server is ready.     |");
    console.log("+--------------------------------------------------------------+\n");
  } else {
    console.log("+--------------------------------------------------------------+");
    console.log("| [WARNING] Startup completed with warnings/errors. Check logs. |");
    console.log("+--------------------------------------------------------------+\n");
  }
}
