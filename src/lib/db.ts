import mongoose from "mongoose";
import dns from "dns";
import { logger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI;

if (process.env.MONGODB_OVERRIDE_DNS === "true" && MONGODB_URI?.startsWith("mongodb+srv://")) {
  try {
    logger.log("Applying Google/Cloudflare public DNS override for MongoDB Atlas resolution...");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (err) {
    logger.warn("Failed to set public DNS servers for MongoDB Atlas resolution:", err);
  }
}

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
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
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    logger.log("Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
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
