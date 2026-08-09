import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Attempts to connect to MongoDB if MONGODB_URI is configured.
 * Never throws — the DB module isn't implemented yet, so the server must
 * still be able to start without a database. Both the "not configured"
 * and "configured but unreachable" cases print a warning and continue.
 */
export async function connectDB() {
  if (!env.mongoUri) {
    console.warn(
      "[db] MONGODB_URI not set — skipping MongoDB connection. Database-dependent features will not work until it's configured.",
    );
    return;
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log("[db] MongoDB connected");
  } catch (error) {
    console.warn(
      `[db] MongoDB connection failed — continuing without a database. Reason: ${error.message}`,
    );
  }
}
