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

  let healthy = true;
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Validate MONGODB_URI
  if (!process.env.MONGODB_URI) {
    console.error("| ❌ [Error] MONGODB_URI is not defined in .env!              |");
    healthy = false;
  } else {
    console.log("| ✅ MONGODB_URI is set.                                       |");
  }

  // 2. Validate JWT_SECRET
  if (!process.env.JWT_SECRET) {
    if (isProduction) {
      console.error("| ❌ [Error] JWT_SECRET is required in production!            |");
      healthy = false;
    } else {
      console.warn("| ⚠️  [Warning] JWT_SECRET is not set. Using dev fallback key. |");
    }
  } else {
    console.log("| ✅ JWT_SECRET is configured.                                 |");
  }

  // 3. Validate Google OAuth Configuration (Optional, but checked if partially configured)
  const oauthKeys = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.CALLBACK_URL,
  ];
  const oauthPresentCount = oauthKeys.filter(Boolean).length;

  if (oauthPresentCount > 0 && oauthPresentCount < 3) {
    console.warn("| ⚠️  [Warning] Google OAuth is partially configured:          |");
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.warn("|    - Missing GOOGLE_CLIENT_ID                                |");
    }
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      console.warn("|    - Missing GOOGLE_CLIENT_SECRET                            |");
    }
    if (!process.env.CALLBACK_URL) {
      console.warn("|    - Missing CALLBACK_URL                                    |");
    }
    healthy = false;
  } else if (oauthPresentCount === 3) {
    console.log("| ✅ Google OAuth is fully configured and enabled.             |");
  } else {
    console.log("| ℹ️  Google OAuth is disabled (optional credentials missing). |");
  }

  // 4. Test MongoDB Connectivity
  if (process.env.MONGODB_URI) {
    console.log("| Testing database connection...                               |");
    try {
      await connectToDatabase();
      console.log("| ✅ Successfully connected to MongoDB database.               |");
    } catch (err) {
      const dbErr = err as Error;
      console.error("| ❌ Database connection failed!                               |");
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
    console.log("| 🎉 All checks passed! ScopeGuard server is ready.            |");
    console.log("+--------------------------------------------------------------+\n");
  } else {
    console.log("+--------------------------------------------------------------+");
    console.log("| ⚠️  Startup completed with warnings/errors. Check logs.       |");
    console.log("+--------------------------------------------------------------+\n");
  }
}
