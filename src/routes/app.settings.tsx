import { createFileRoute, useRouteContext, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { updateWorkspaceSettings } from "@/lib/auth";
import { APP_CONFIG } from "@/config/app.config";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — ScopeGuard" }] }),
});

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <div className="text-[14px] font-medium text-foreground">{label}</div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">{desc}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useRouteContext({ from: "/app" }) as {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      workspaceName?: string;
      defaultRate?: number;
      currency?: string;
      currencySymbol?: string;
      locale?: string;
      provider?: string;
      googleId?: string;
      githubId?: string;
      githubUsername?: string;
      lastLogin?: string | Date;
      authMethod?: string[];
    } | null;
  };

  const [selectedCurrency, setSelectedCurrency] = useState(
    user?.currency || APP_CONFIG.defaultCurrency,
  );

  const connectedProviders =
    user?.authMethod && user.authMethod.length > 0
      ? user.authMethod
      : [user?.provider || "email"];

  async function handleSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const form = new FormData(event.currentTarget);
    const workspaceName = String(form.get("workspaceName") ?? "");
    const rateRaw = String(form.get("defaultRate") ?? "").replace(/[^0-9.]/g, "");
    const defaultRate = rateRaw ? parseFloat(rateRaw) : undefined;
    const currencyObj = APP_CONFIG.supportedCurrencies.find((c) => c.code === selectedCurrency);

    try {
      const response = await updateWorkspaceSettings({
        data: {
          workspaceName,
          defaultRate,
          currency: selectedCurrency,
          currencySymbol: currencyObj?.symbol || "$",
          locale: currencyObj?.locale || "en-US",
        },
      });

      if (response.success) {
        toast.success("Workspace settings updated successfully");
        router.invalidate();
      } else {
        toast.error(response.message || "Failed to update settings.");
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "An error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  }

  const lastLoginStr = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Active session";

  return (
    <AppShell title="Settings" subtitle="Configure your workspace.">
      <div className="mx-auto max-w-3xl space-y-8">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <section className="panel p-6">
            <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Workspace Configuration
            </div>
            <Separator className="my-4" />
            <div className="divide-y divide-border">
              <Row label="Workspace name" desc="Displayed to your team and client reports.">
                <Input
                  name="workspaceName"
                  defaultValue={user?.workspaceName || "My Workspace"}
                  className="w-64"
                  required
                />
              </Row>
              <Row label="Default hourly rate" desc="Used for scope creep cost impact estimates.">
                <Input
                  name="defaultRate"
                  defaultValue={user?.defaultRate !== undefined ? user.defaultRate : APP_CONFIG.defaultHourlyRate}
                  className="w-32"
                  type="number"
                  min={0}
                />
              </Row>
              <Row label="Currency" desc="Format for all monetary calculations & exports.">
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_CONFIG.supportedCurrencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            </div>



            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </section>
        </form>

        <section className="panel p-6">
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            Authentication & Security
          </div>
          <Separator className="my-4" />
          <div className="divide-y divide-border">
            <Row label="Primary Auth Provider" desc="Initial sign-up mechanism for this account.">
              <div className="text-[13px] font-medium capitalize text-foreground bg-muted px-3 py-1 rounded-md">
                {user?.provider || "Email"}
              </div>
            </Row>
            <Row label="Connected Accounts" desc="Single Sign-On providers enabled for your email.">
              <div className="flex flex-wrap justify-end gap-1.5 max-w-xs">
                {connectedProviders.map((prov) => (
                  <span
                    key={prov}
                    className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                  >
                    {prov}
                  </span>
                ))}
              </div>
            </Row>
            <Row label="Last Login" desc="Timestamp of most recent authenticated session.">
              <div className="text-[13px] text-muted-foreground">{lastLoginStr}</div>
            </Row>
          </div>
        </section>

        <section className="panel p-6">
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            AI behavior
          </div>
          <Separator className="my-4" />
          <div className="divide-y divide-border">
            <Row label="Tone of replies" desc="How ScopeGuard drafts your responses.">
              <Input defaultValue="Firm, warm, direct" className="w-64" />
            </Row>
            <Row label="Auto-analyze new emails" desc="Score every inbound email against the SOW.">
              <Switch defaultChecked />
            </Row>
            <Row label="Include reasoning in replies" desc="Reference contract clauses in drafts.">
              <Switch defaultChecked />
            </Row>
          </div>
        </section>

        <section className="panel p-6">
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            Notifications
          </div>
          <Separator className="my-4" />
          <div className="divide-y divide-border">
            <Row
              label="Scope creep alerts"
              desc="Email + in-app when high-risk requests are detected."
            >
              <Switch defaultChecked />
            </Row>
            <Row label="Weekly digest" desc="Every Monday morning at 8am.">
              <Switch defaultChecked />
            </Row>
            <Row label="Product updates" desc="Occasional emails when we ship things.">
              <Switch />
            </Row>
          </div>
        </section>

        <section className="panel p-6">
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            Danger zone
          </div>
          <Separator className="my-4" />
          <Row
            label="Delete workspace"
            desc="This will permanently erase all projects and analyses."
          >
            <Button variant="destructive" size="sm">
              Delete workspace
            </Button>
          </Row>
        </section>
      </div>
    </AppShell>
  );
}
