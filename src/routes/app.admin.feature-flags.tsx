import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ToggleLeft, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { listFeatureFlags, setFeatureFlag, createFeatureFlag } from "@/lib/feature-flags.server";

export const Route = createFileRoute("/app/admin/feature-flags")({
  loader: async () => {
    const flags = await listFeatureFlags();
    return { flags };
  },
  component: FeatureFlagsPage,
  head: () => ({ meta: [{ title: "Feature Flags — Admin — ScopeGuard" }] }),
});

function FeatureFlagsPage() {
  const router = useRouter();
  const { flags } = Route.useLoaderData();

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleToggle(key: string, enabled: boolean) {
    setError(null);
    setSavingKey(key);
    try {
      await setFeatureFlag({ data: { key, enabled } });
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update flag.");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      await createFeatureFlag({
        data: { key: newKey.trim().toLowerCase().replace(/\s+/g, "_"), label: newLabel.trim() },
      });
      await router.invalidate();
      setNewKey("");
      setNewLabel("");
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create flag.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell
      title="Feature Flags"
      subtitle="Turn modules on or off workspace-wide."
      action={
        <Button size="sm" variant="outline" onClick={() => setShowAddForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          Add flag
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-[color:var(--destructive)]/30 bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] px-4 py-2.5 text-[13px] text-[color:var(--destructive)]">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="panel mb-5 flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[160px] flex-1 space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">Label</label>
            <Input
              placeholder="e.g. Slack Integration"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
          <div className="min-w-[160px] flex-1 space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">
              Key (letters, numbers, underscores)
            </label>
            <Input
              placeholder="e.g. slack_integration"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={creating || !newKey.trim() || !newLabel.trim()}
          >
            {creating ? "Adding…" : "Add"}
          </Button>
        </div>
      )}

      {flags.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
          <ToggleLeft className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-[15px] font-medium">No feature flags yet</div>
        </div>
      ) : (
        <div className="panel divide-y divide-border">
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-foreground">{flag.label}</div>
                {flag.description && (
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{flag.description}</div>
                )}
                <div className="mt-1 text-[11px] text-muted-foreground/70">key: {flag.key}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[12px] text-muted-foreground">
                  {flag.enabled ? "Enabled" : "Disabled"}
                </span>
                <Switch
                  checked={flag.enabled}
                  disabled={savingKey === flag.key}
                  onCheckedChange={(checked) => handleToggle(flag.key, checked)}
                  aria-label={`Toggle ${flag.label}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
