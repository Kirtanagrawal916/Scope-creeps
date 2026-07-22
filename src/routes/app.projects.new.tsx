import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/lib/projects.server";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/app/projects/new")({
  component: NewProjectPage,
  head: () => ({ meta: [{ title: "New project — ScopeGuard" }] }),
});

function NewProjectPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const project = await createProject({
        data: {
          name: String(data.get("name") ?? "").trim(),
          client: String(data.get("client") ?? "").trim(),
          budget: Number(data.get("budget") ?? 0),
          hourlyRate: Number(data.get("hourlyRate") ?? 0),
          hoursAllocated: Number(data.get("hoursAllocated") ?? 0),
          contract: String(data.get("contract") ?? "").trim(),
        },
      });
      // Navigate to the newly created project using the real DB ID
      await nav({ to: "/app/projects/$id", params: { id: project.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/app/projects">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Projects
          </Link>
        </Button>
        <h1 className="font-display text-3xl font-semibold tracking-tight">New project</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Upload a contract and ScopeGuard will extract the scope, exclusions, and timeline.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="panel p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12px]" htmlFor="name">
                  Project name <span className="text-destructive">*</span>
                </Label>
                <Input id="name" name="name" required placeholder="Atlas Commerce Platform" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]" htmlFor="client">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Input id="client" name="client" required placeholder="Atlas Retail Group" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]" htmlFor="budget">
                  Budget (₹)
                </Label>
                <Input id="budget" name="budget" type="number" min={0} placeholder="48000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]" htmlFor="hourlyRate">
                  Hourly rate (₹/h)
                </Label>
                <Input id="hourlyRate" name="hourlyRate" type="number" min={0} placeholder="150" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[12px]" htmlFor="hoursAllocated">
                  Hours allocated
                </Label>
                <Input
                  id="hoursAllocated"
                  name="hoursAllocated"
                  type="number"
                  min={0}
                  placeholder="320"
                />
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <Label className="text-[12px]">Contract</Label>
            <div className="mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/40 px-6 py-10 text-center transition-colors hover:bg-accent/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 text-[14px] font-medium">Drop your SOW here</div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                PDF, DOCX, or Google Doc · Up to 20MB
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-4">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Choose file
              </Button>
            </div>
          </div>

          <div className="panel p-6">
            <Label className="text-[12px]" htmlFor="contract">
              Contract summary / Notes for the AI
            </Label>
            <Textarea
              id="contract"
              name="contract"
              className="mt-2"
              rows={3}
              placeholder="Anything the model should know — e.g. exclusions, sensitivities, client tone."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" asChild>
              <Link to="/app/projects">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create project"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
