import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, FolderKanban } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — ScopeGuard" }] }),
});

function ProfilePage() {
  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-3xl">
        <div className="panel overflow-hidden">
          <div className="h-32 bg-hero-gradient" />
          <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
            <div className="-mt-10 flex items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-card">
                <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">
                  AL
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  Alex Laurent
                </h1>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  Founder · Laurent Studio
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3">Edit profile</Button>
          </div>

          <div className="grid gap-4 border-t border-border p-6 md:grid-cols-3">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> alex@studio.com
            </div>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Brooklyn, NY
            </div>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <FolderKanban className="h-3.5 w-3.5" /> 12 active projects
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { l: "Projects", v: "12" },
            { l: "Revenue protected", v: "$148.2k" },
            { l: "Member since", v: "Aug 2024" },
          ].map((s) => (
            <div key={s.l} className="panel p-5">
              <div className="text-[12px] text-muted-foreground">{s.l}</div>
              <div className="mt-2 font-display text-xl font-semibold tabular-nums">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
