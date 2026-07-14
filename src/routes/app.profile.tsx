import { createFileRoute, useRouteContext, useRouter } from "@tanstack/react-router";
import { Mail, MapPin, FolderKanban } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/auth.server";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — ScopeGuard" }] }),
});

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  workspaceName?: string;
}

function EditProfileModal({
  user,
  onSuccess,
}: {
  user: UserProfile | null;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") ?? "");
    const lastName = String(form.get("lastName") ?? "");

    try {
      const response = await updateProfile({
        data: { firstName, lastName },
      });

      if (response.success) {
        onSuccess();
        setOpen(false);
      } else {
        setErrorMessage(response.message || "Failed to update profile.");
      }
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-3">
          Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update your personal details below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user?.firstName || ""}
                className="col-span-3 bg-background/60"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user?.lastName || ""}
                className="col-span-3 bg-background/60"
              />
            </div>
            {errorMessage && (
              <div className="col-span-4 text-center text-[13px] text-destructive font-medium">
                {errorMessage}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProfilePage() {
  const router = useRouter();
  const { user } = useRouteContext({ from: "/app" }) as {
    user: UserProfile | null;
  };
  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase()
    : "U";
  const fullName = user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "User";

  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-3xl">
        <div className="panel overflow-hidden">
          <div className="h-32 bg-hero-gradient" />
          <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
            <div className="-mt-10 flex items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-card">
                <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-semibold tracking-tight">{fullName}</h1>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  Member · {user?.workspaceName || "Workspace"}
                </div>
              </div>
            </div>
            <EditProfileModal user={user} onSuccess={() => router.invalidate()} />
          </div>

          <div className="grid gap-4 border-t border-border p-6 md:grid-cols-3">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {user?.email || "No email"}
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
