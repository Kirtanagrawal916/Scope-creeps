// Priority 5: Dynamic Feature Flags Engine & Rollout Controller

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number; // 0 to 100
  targetAudience: "ALL" | "BETA_USERS" | "ADMINS_ONLY";
  updatedAt: string;
  updatedBy: string;
}

class FeatureFlagsManager {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    this.seedDefaultFlags();
  }

  private seedDefaultFlags() {
    const defaults: FeatureFlag[] = [
      {
        id: "flag-1",
        name: "AI Scope Intelligence V2",
        key: "enable_ai_scope_v2",
        description:
          "Enables Gemini 2.5 Flash deep scope comparison and contract clause breakdown.",
        enabled: true,
        rolloutPercent: 100,
        targetAudience: "ALL",
        updatedAt: new Date().toISOString(),
        updatedBy: "System Default",
      },
      {
        id: "flag-2",
        name: "Gmail Inbox Sync Engine",
        key: "enable_gmail_sync",
        description: "Allows automated background fetching of client emails via Gmail OAuth.",
        enabled: true,
        rolloutPercent: 100,
        targetAudience: "ALL",
        updatedAt: new Date().toISOString(),
        updatedBy: "System Default",
      },
      {
        id: "flag-3",
        name: "Redis Queue Workers",
        key: "enable_redis_queue",
        description:
          "Offloads export jobs and AI token accounting to Redis background queue workers.",
        enabled: true,
        rolloutPercent: 100,
        targetAudience: "ALL",
        updatedAt: new Date().toISOString(),
        updatedBy: "System Default",
      },
      {
        id: "flag-4",
        name: "Advanced Prompts & Cost Optimizer",
        key: "enable_prompt_optimizer",
        description: "Optimizes prompt length and token usage before calling AI models.",
        enabled: false,
        rolloutPercent: 25,
        targetAudience: "BETA_USERS",
        updatedAt: new Date().toISOString(),
        updatedBy: "System Default",
      },
      {
        id: "flag-5",
        name: "Maintenance Mode",
        key: "maintenance_mode",
        description: "Locks non-admin user operations for scheduled system updates.",
        enabled: false,
        rolloutPercent: 0,
        targetAudience: "ADMINS_ONLY",
        updatedAt: new Date().toISOString(),
        updatedBy: "System Default",
      },
    ];

    defaults.forEach((f) => this.flags.set(f.key, f));
  }

  getFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  async toggleFlag(key: string, enabled: boolean, updatedBy = "Admin"): Promise<FeatureFlag> {
    const flag = this.flags.get(key);
    if (!flag) throw new Error(`Feature flag '${key}' not found.`);

    flag.enabled = enabled;
    flag.updatedAt = new Date().toISOString();
    flag.updatedBy = updatedBy;

    // Trigger Audit Log entry automatically
    const { auditLogs } = await import("./auditLogs");
    auditLogs.recordLog({
      action: "FEATURE_FLAG_TOGGLED",
      actor: updatedBy,
      severity: "WARN",
      details: `Feature flag '${flag.name}' (${key}) was turned ${enabled ? "ON" : "OFF"}.`,
      metadata: { key, enabled, rolloutPercent: flag.rolloutPercent },
    });

    return flag;
  }

  async updateRollout(
    key: string,
    rolloutPercent: number,
    updatedBy = "Admin",
  ): Promise<FeatureFlag> {
    const flag = this.flags.get(key);
    if (!flag) throw new Error(`Feature flag '${key}' not found.`);

    flag.rolloutPercent = rolloutPercent;
    flag.updatedAt = new Date().toISOString();
    flag.updatedBy = updatedBy;

    const { auditLogs } = await import("./auditLogs");
    auditLogs.recordLog({
      action: "FEATURE_FLAG_ROLLOUT_UPDATED",
      actor: updatedBy,
      severity: "INFO",
      details: `Rollout percentage for '${flag.name}' set to ${rolloutPercent}%.`,
      metadata: { key, rolloutPercent },
    });

    return flag;
  }
}

export const featureFlags = new FeatureFlagsManager();
