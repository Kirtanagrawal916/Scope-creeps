import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Search, Users as UsersIcon, ArrowUpDown, Pencil } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { listAllUsers, updateUser, setUserActive } from "@/lib/users-admin.server";
import type { AdminManagedUser } from "@/lib/users-admin.server";

export const Route = createFileRoute("/app/admin/users")({
  loader: async () => {
    const users = await listAllUsers();
    return { users };
  },
  component: AdminUsersPage,
  head: () => ({ meta: [{ title: "Users — Admin — ScopeGuard" }] }),
});

type SortKey = "name" | "email" | "role" | "joined";

function RoleBadge({ role }: { role: AdminManagedUser["role"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        role === "admin"
          ? "text-[color:var(--success)] bg-[color-mix(in_oklab,var(--success)_12%,transparent)]"
          : "text-muted-foreground bg-accent",
      )}
    >
      {role === "admin" ? "Admin" : "User"}
    </span>
  );
}

function displayName(u: AdminManagedUser) {
  const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return name || u.email;
}

function initials(u: AdminManagedUser) {
  const name = displayName(u);
  const words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function AdminUsersPage() {
  const router = useRouter();
  const { users } = Route.useLoaderData();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<SortKey>("joined");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<AdminManagedUser | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      displayName(u).toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || (statusFilter === "active" ? u.isActive : !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "name") cmp = displayName(a).localeCompare(displayName(b));
    else if (sortBy === "email") cmp = a.email.localeCompare(b.email);
    else if (sortBy === "role") cmp = a.role.localeCompare(b.role);
    else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  async function handleToggleActive(user: AdminManagedUser) {
    setError(null);
    setSavingId(user.id);
    try {
      await setUserActive({ data: { id: user.id, isActive: !user.isActive } });
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user status.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleSaveEdit(form: {
    firstName: string;
    lastName: string;
    workspaceName: string;
    role: "user" | "admin";
  }) {
    if (!editingUser) return;
    setError(null);
    setSavingId(editingUser.id);
    try {
      await updateUser({ data: { id: editingUser.id, ...form } });
      await router.invalidate();
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AppShell title="Users" subtitle="Manage every account in the workspace.">
      {error && (
        <div className="mb-4 rounded-lg border border-[color:var(--destructive)]/30 bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] px-4 py-2.5 text-[13px] text-[color:var(--destructive)]">
          {error}
        </div>
      )}

      {/* Filters Row */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm sm:flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            className="pl-8 bg-background/50 backdrop-blur"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(val: "all" | "user" | "admin") => {
            setRoleFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[120px] h-9 text-[12px] bg-background/50 backdrop-blur">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(val: "all" | "active" | "inactive") => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[130px] h-9 text-[12px] bg-background/50 backdrop-blur">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Deactivated</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(val: SortKey) => setSortBy(val)}>
          <SelectTrigger className="w-[130px] h-9 text-[12px] bg-background/50 backdrop-blur">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="joined">Sort by Joined</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="email">Sort by Email</SelectItem>
            <SelectItem value="role">Sort by Role</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 text-[12px] bg-background/50 backdrop-blur"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortOrder === "asc" ? "Asc" : "Desc"}
        </Button>
      </div>

      {paginated.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
          <UsersIcon className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-[15px] font-medium">No users found</div>
          <p className="max-w-xs text-[13px] text-muted-foreground">
            Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="hidden grid-cols-[1.8fr_1fr_0.8fr_0.9fr_0.9fr_auto] items-center gap-4 border-b border-border bg-background/40 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:grid">
              <div>User</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div>Joined</div>
              <div />
            </div>
            <div className="divide-y divide-border">
              {paginated.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:px-5 md:grid md:grid-cols-[1.8fr_1fr_0.8fr_0.9fr_0.9fr_auto] md:items-center md:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-[11px] font-medium">
                      {initials(u)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium">{displayName(u)}</div>
                      <div className="truncate text-[12px] text-muted-foreground md:hidden">
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <div className="hidden truncate text-[13px] text-muted-foreground md:block">
                    {u.email}
                  </div>
                  <div>
                    <RoleBadge role={u.role} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={u.isActive}
                      disabled={savingId === u.id}
                      onCheckedChange={() => handleToggleActive(u)}
                      aria-label={u.isActive ? "Deactivate user" : "Activate user"}
                    />
                    <span className="text-[12px] text-muted-foreground">
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </div>
                  <div className="text-[13px] text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-[12px]"
                      onClick={() => setEditingUser(u)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      View / Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 text-[13px]">
              <span className="text-muted-foreground">
                Page {currentPage} of {totalPages} ({sorted.length} total users)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* key forces a clean remount (and fresh form state) whenever a different user is opened */}
      <EditUserDialog
        key={editingUser?.id ?? "none"}
        user={editingUser}
        saving={savingId === editingUser?.id}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveEdit}
      />
    </AppShell>
  );
}

function EditUserDialog({
  user,
  saving,
  onClose,
  onSave,
}: {
  user: AdminManagedUser | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: {
    firstName: string;
    lastName: string;
    workspaceName: string;
    role: "user" | "admin";
  }) => void;
}) {
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [workspaceName, setWorkspaceName] = useState(user?.workspaceName ?? "");
  const [role, setRole] = useState<"user" | "admin">(user?.role ?? "user");

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-muted-foreground">First name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-muted-foreground">Last name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">Workspace name</label>
            <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">Role</label>
            <Select value={role} onValueChange={(val: "user" | "admin") => setRole(val)}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Email and password aren&apos;t editable here — that&apos;s part of the account&apos;s
            own login flow.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave({ firstName, lastName, workspaceName, role })}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
