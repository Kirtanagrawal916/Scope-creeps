import mongoose from "mongoose";
import dns from "dns";
import fs from "fs";
import path from "path";
import { logger } from "./logger";

// Manual environment loader helper
function loadEnvFile() {
  if (process.env.MONGODB_URI) {
    return;
  }
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        if (line.trim().startsWith("#") || !line.includes("=")) {
          continue;
        }
        const index = line.indexOf("=");
        const key = line.substring(0, index).trim();
        let val = line.substring(index + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.substring(1, val.length - 1);
        }
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    } catch (e) {
      logger.warn("Failed to load .env file manually:", e);
    }
  }
}

// Load env file on module evaluation
loadEnvFile();

const MONGODB_URI = process.env.MONGODB_URI;

if (process.env.MONGODB_OVERRIDE_DNS === "true" && MONGODB_URI?.startsWith("mongodb+srv://")) {
  try {
    logger.log("Applying Google/Cloudflare public DNS override for MongoDB Atlas resolution...");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (err) {
    logger.warn("Failed to set public DNS servers for MongoDB Atlas resolution:", err);
  }
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = { conn: null, promise: null };
}

const cached = globalThis.mongooseCache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    logger.log("Connecting to MongoDB...");
    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      logger.log("Successfully connected to MongoDB");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
