import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormEvent } from "react";

export const Route = createFileRoute("/app/projects/new")({
  component: NewProjectPage,
  head: () => ({ meta: [{ title: "New project — ScopeGuard" }] }),
});

function NewProjectPage() {
  const nav = useNavigate();
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

        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            nav({ to: "/app/projects/$id", params: { id: "atlas-commerce" } });
          }}
          className="mt-8 space-y-5"
        >
          <div className="panel p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12px]">Project name</Label>
                <Input placeholder="Atlas Commerce Platform" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Client</Label>
                <Input placeholder="Atlas Retail Group" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Budget</Label>
                <Input placeholder="$48,000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Hourly rate</Label>
                <Input placeholder="$150" />
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
            <Label className="text-[12px]">Notes for the AI</Label>
            <Textarea
              className="mt-2"
              rows={3}
              placeholder="Anything the model should know — e.g. exclusions, sensitivities, client tone."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" asChild>
              <Link to="/app/projects">Cancel</Link>
            </Button>
            <Button type="submit">Create project</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
