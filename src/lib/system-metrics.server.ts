/**
 * system-metrics.server.ts — Admin-only System Metrics (Phase 3).
 *
 * Read-only project-health snapshot. Reuses the existing User, EmailThread,
 * Analysis and Notification models plus requireAdmin() — no new
 * metrics-collection layer, no writes, no per-user Analytics logic touched.
 *
 * Explicitly out of scope for this phase (later phases): AI Usage detail,
 * API Metrics, Export Usage, Audit Logs, Feature Flags.
 */
import os from "os";
import mongoose from "mongoose";
import { createServerFn } from "@tanstack/react-start";
import { connectToDatabase } from "./db";
import { User } from "../models/User";
import { EmailThread } from "../models/EmailThread";
import { Analysis } from "../models/Analysis";
import { Notification } from "../models/Notification";
import { requireAdmin } from "./authorize.server";

export type SystemMetrics = {
  totalUsers: number;
  activeUsers: number;
  totalEmailsProcessed: number;
  totalAiRequests: number;
  totalNotifications: number;
  unreadNotifications: number;
  database: {
    status: "disconnected" | "connected" | "connecting" | "disconnecting";
  };
  server: {
    uptimeSeconds: number;
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
    /** 1-minute load average. null on platforms without os.loadavg (Windows). */
    loadAverage1m: number | null;
  };
};

// mongoose.connection.readyState: 0=disconnected 1=connected 2=connecting 3=disconnecting
const READY_STATE_MAP = ["disconnected", "connected", "connecting", "disconnecting"] as const;

export const getSystemMetrics = createServerFn({ method: "GET" }).handler(
  async (): Promise<SystemMetrics> => {
    await requireAdmin();
    await connectToDatabase();

    const [
      totalUsers,
      activeUsers,
      totalEmailsProcessed,
      totalAiRequests,
      totalNotifications,
      unreadNotifications,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      EmailThread.countDocuments(),
      Analysis.countDocuments(),
      Notification.countDocuments(),
      Notification.countDocuments({ isRead: false }),
    ]);

    const mem = process.memoryUsage();

    return {
      totalUsers,
      activeUsers,
      totalEmailsProcessed,
      totalAiRequests,
      totalNotifications,
      unreadNotifications,
      database: {
        status: READY_STATE_MAP[mongoose.connection.readyState as 0 | 1 | 2 | 3] ?? "disconnected",
      },
      server: {
        uptimeSeconds: Math.round(process.uptime()),
        memory: {
          rssMb: Math.round(mem.rss / 1024 / 1024),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        },
        loadAverage1m: process.platform === "win32" ? null : Number(os.loadavg()[0].toFixed(2)),
      },
    };
  },
);
