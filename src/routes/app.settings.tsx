import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — ScopeGuard" }] }),
});

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
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
  return (
    <AppShell title="Settings" subtitle="Configure your workspace.">
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="panel p-6">
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          <Separator className="my-4" />
          <div className="divide-y divide-border">
            <Row label="Workspace name" desc="Displayed to your team.">
              <Input defaultValue="Laurent Studio" className="w-64" />
            </Row>
            <Row label="Default hourly rate" desc="Used for scope creep cost estimates.">
              <Input defaultValue="$150" className="w-32" />
            </Row>
            <Row label="Currency" desc="Format for money everywhere.">
              <Input defaultValue="USD" className="w-32" />
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
            <Row label="Scope creep alerts" desc="Email + in-app when high-risk requests are detected.">
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
          <Row label="Delete workspace" desc="This will permanently erase all projects and analyses.">
            <Button variant="destructive" size="sm">Delete workspace</Button>
          </Row>
        </section>
      </div>
    </AppShell>
  );
}
