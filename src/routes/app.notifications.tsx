import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Bell,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  ExternalLink,
  Sparkles,
  FolderKanban,
  FileText,
  AlertTriangle,
  Download,
  Shield,
  Loader2,
  CheckSquare,
  Square,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SmartEmptyState } from "@/components/smart-empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  bulkNotificationAction,
  type SerializedNotification,
} from "@/lib/notifications.server";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({
  loader: async () => {
    try {
      const res = (await listNotifications({ data: { limit: 100 } })) as {
        notifications: SerializedNotification[];
        unreadCount: number;
      };
      return {
        initialNotifications: res.notifications,
        unreadCount: res.unreadCount,
      };
    } catch {
      return { initialNotifications: [], unreadCount: 0 };
    }
  },
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — ScopeGuard" }] }),
});

function getIconForType(type: string, priority: string) {
  if (type === "high_risk" || priority === "high" || priority === "urgent") {
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  }
  if (type === "project_created" || type === "project_updated" || type === "project_archived") {
    return <FolderKanban className="h-4 w-4 text-primary" />;
  }
  if (type === "scope_analysis" || type === "analysis_completed") {
    return <Sparkles className="h-4 w-4 text-warning" />;
  }
  if (type === "export_completed" || type === "export_failed") {
    return <Download className="h-4 w-4 text-success" />;
  }
  if (type === "security" || type === "login") {
    return <Shield className="h-4 w-4 text-primary" />;
  }
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function NotificationsPage() {
  const { initialNotifications, unreadCount: initialUnread } = Route.useLoaderData();
  const [notifications, setNotifications] =
    useState<SerializedNotification[]>(initialNotifications);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const res = (await listNotifications({ data: { limit: 100 } })) as {
        notifications: SerializedNotification[];
        unreadCount: number;
      };
      setNotifications(res.notifications);
    } catch (err) {
      toast.error("Failed to refresh notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (statusFilter === "unread" && n.isRead) return false;
      if (statusFilter === "read" && !n.isRead) return false;

      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (priorityFilter !== "all" && n.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesMsg = n.message.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg) return false;
      }
      return true;
    });
  }, [notifications, statusFilter, typeFilter, priorityFilter, searchQuery]);

  // Date Grouping logic
  const groupedNotifications = useMemo(() => {
    const today: SerializedNotification[] = [];
    const yesterday: SerializedNotification[] = [];
    const thisWeek: SerializedNotification[] = [];
    const older: SerializedNotification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 6 * 86400000;

    filteredNotifications.forEach((n) => {
      const time = new Date(n.createdAtIso).getTime();
      if (time >= todayStart) {
        today.push(n);
      } else if (time >= yesterdayStart) {
        yesterday.push(n);
      } else if (time >= weekStart) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "This Week", items: thisWeek },
      { label: "Older", items: older },
    ].filter((g) => g.items.length > 0);
  }, [filteredNotifications]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Actions
  const handleMarkSelectedRead = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkNotificationAction({ data: { action: "mark_read", ids: selectedIds } });
      setNotifications((prev) =>
        prev.map((n) => (selectedIds.includes(n.id) ? { ...n, isRead: true } : n)),
      );
      setSelectedIds([]);
      toast.success("Selected notifications marked as read.");
    } catch {
      toast.error("Failed to update notifications.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkNotificationAction({ data: { action: "delete", ids: selectedIds } });
      setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
      setSelectedIds([]);
      toast.success("Selected notifications deleted.");
    } catch {
      toast.error("Failed to delete notifications.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark all as read.");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear ALL notifications?")) return;
    try {
      await clearAllNotifications();
      setNotifications([]);
      setSelectedIds([]);
      toast.success("All notifications cleared.");
    } catch {
      toast.error("Failed to clear notifications.");
    }
  };

  const handleSingleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead({ data: { id } });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      toast.success("Marked as read.");
    } catch {
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleSingleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification({ data: { id } });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      toast.success("Notification deleted.");
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell
      title="Notifications Center"
      subtitle="Track alerts, scope creep warnings, project activities, and report exports."
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="h-8 text-xs"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />{" "}
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark All Read
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters Bar */}
        <div className="panel p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-background"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as "all" | "unread" | "read")}
              >
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                  <SelectItem value="read">Read Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High & Urgent</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Types</SelectItem>
                  <SelectItem value="high_risk">High Risk Creep</SelectItem>
                  <SelectItem value="analysis_completed">Scope Analyses</SelectItem>
                  <SelectItem value="project_created">Project Events</SelectItem>
                  <SelectItem value="export_completed">Report Exports</SelectItem>
                  <SelectItem value="system">System Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {filteredNotifications.length > 0 && (
            <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                  <Checkbox
                    checked={
                      filteredNotifications.length > 0 &&
                      selectedIds.length === filteredNotifications.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                  <span>
                    Select All ({selectedIds.length} / {filteredNotifications.length})
                  </span>
                </label>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkSelectedRead}
                      className="h-7 text-xs"
                    >
                      <CheckCheck className="mr-1 h-3 w-3 text-primary" /> Mark Read
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteSelected}
                      className="h-7 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                <XCircle className="mr-1 h-3.5 w-3.5" /> Clear All Notifications
              </Button>
            </div>
          )}
        </div>

        {/* Grouped Notifications List */}
        {groupedNotifications.length === 0 ? (
          <SmartEmptyState
            icon={Bell}
            title="All notifications caught up"
            description={
              searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "No notifications matched your current filter criteria."
                : "Your workspace is clear! ScopeGuard will notify you when high-risk scope changes or alerts occur."
            }
            actionText={
              searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Reset Filters"
                : "Back to Dashboard"
            }
            onActionClick={
              searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? () => {
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setPriorityFilter("all");
                    setSearchQuery("");
                  }
                : undefined
            }
            actionTo={
              !(searchQuery || statusFilter !== "all" || typeFilter !== "all") ? "/app" : undefined
            }
          />
        ) : (
          groupedNotifications.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {group.label} ({group.items.length})
                </h3>
              </div>

              <div className="panel divide-y divide-border/40 overflow-hidden">
                {group.items.map((n) => {
                  const isSelected = selectedIds.includes(n.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.actionUrl) navigate({ to: n.actionUrl });
                      }}
                      className={`group relative flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-accent/40 ${
                        !n.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(n.id)} />
                      </div>

                      <div className="p-2.5 rounded-xl bg-accent shrink-0">
                        {getIconForType(n.type, n.priority)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-foreground truncate">
                              {n.title}
                            </span>
                            {n.priority === "high" || n.priority === "urgent" ? (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] px-1.5 py-0 font-semibold uppercase">
                                High Risk
                              </Badge>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {n.createdAt}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                          {n.message}
                        </p>

                        {n.actionUrl && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary group-hover:underline">
                            <span>View details</span>
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!n.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Mark as read"
                            onClick={(e) => handleSingleMarkRead(n.id, e)}
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete notification"
                          onClick={(e) => handleSingleDelete(n.id, e)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {!n.isRead && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
