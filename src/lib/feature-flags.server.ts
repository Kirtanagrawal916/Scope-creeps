/**
 * feature-flags.server.ts — Admin-only Feature Flags (Phase 4).
 *
 * No feature-flag system existed anywhere in the project (checked both this
 * app and the feat/gmail-ai-intelligence Express backend), so this is the
 * simplest architecture compatible with the existing stack: one Mongo
 * collection (FeatureFlag), keyed by a stable string `key`, with a boolean
 * `enabled`. Nothing is hardcoded — every value read by the UI comes from
 * this collection.
 *
 * DEFAULT_FLAGS below only *seeds* the three known modules on first read so
 * the admin isn't staring at an empty page — the persisted `enabled` value
 * always wins once a flag exists. Adding a "future module" later is just one
 * more entry in this array (or an admin-created custom flag via the UI) —
 * no schema or route changes required.
 *
 * NOTE: this phase implements the toggle + persistence layer only. Wiring
 * these flags into the actual Gmail OAuth flow, AI analysis calls, and
 * notification creation is a separate, larger cross-cutting change (those
 * live across multiple files and, for Gmail, a different backend entirely)
 * and was not requested here — see isFeatureEnabled() below as the intended
 * integration point for that future work.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { connectToDatabase } from "./db";
import { FeatureFlag } from "../models/FeatureFlag";
import { requireAdmin } from "./authorize.server";
import { AppError } from "./app-error";

export type SerializedFeatureFlag = {
  id: string;
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  updatedAt: string;
};

const DEFAULT_FLAGS = [
  {
    key: "gmail_integration",
    label: "Gmail Integration",
    description: "Gmail OAuth connection and inbox syncing.",
  },
  {
    key: "ai_analysis",
    label: "AI Analysis",
    description: "Gemini-powered scope analysis and reply drafting.",
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "In-app notification delivery.",
  },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any): SerializedFeatureFlag {
  return {
    id: String(doc._id),
    key: doc.key,
    label: doc.label,
    description: doc.description,
    enabled: doc.enabled,
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

/** Ensures the known default flags exist, without overwriting an existing value. */
async function ensureDefaultFlags() {
  await Promise.all(
    DEFAULT_FLAGS.map((flag) =>
      FeatureFlag.updateOne(
        { key: flag.key },
        { $setOnInsert: { ...flag, enabled: true } },
        { upsert: true },
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Zod Validation Schemas
// ---------------------------------------------------------------------------

const setFlagSchema = z.object({
  key: z.string().min(1, "Key is required"),
  enabled: z.boolean(),
});

const createFlagSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[a-z0-9_]+$/, "Key may only contain lowercase letters, numbers and underscores"),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/** Returns every feature flag, seeding the known defaults if missing. */
export const listFeatureFlags = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  await connectToDatabase();
  await ensureDefaultFlags();

  const flags = await FeatureFlag.find().sort({ createdAt: 1 }).lean();
  return flags.map(serialize);
});

/** Toggles an existing flag on/off. Throws 404 if the key doesn't exist. */
export const setFeatureFlag = createServerFn({ method: "POST" })
  .validator((data: unknown) => setFlagSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    await connectToDatabase();

    const flag = await FeatureFlag.findOneAndUpdate(
      { key: data.key },
      { enabled: data.enabled },
      { new: true },
    );
    if (!flag) throw new AppError(404, "Feature flag not found.");
    return serialize(flag);
  });

/** Creates a new custom flag for a future module. Defaults to disabled. */
export const createFeatureFlag = createServerFn({ method: "POST" })
  .validator((data: unknown) => createFlagSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    await connectToDatabase();

    const existing = await FeatureFlag.findOne({ key: data.key });
    if (existing) throw new AppError(400, "A flag with that key already exists.");

    const flag = await FeatureFlag.create({
      key: data.key,
      label: data.label,
      description: data.description,
      enabled: false,
    });
    return serialize(flag);
  });

// ---------------------------------------------------------------------------
// Integration point for future phases / other server modules
// ---------------------------------------------------------------------------

/**
 * Plain (non-RPC) helper other server-only modules can call to gate
 * behavior on a flag, e.g. `if (!(await isFeatureEnabled("ai_analysis"))) ...`.
 * Not called from anywhere yet — see file header note.
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  await connectToDatabase();
  const flag = await FeatureFlag.findOne({ key }).lean();
  return flag?.enabled ?? false;
}
