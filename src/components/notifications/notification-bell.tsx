/**
 * notification-bell.tsx — Header Notification Bell with Live Badge & Quick Popover.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Sparkles,
  FolderKanban,
  FileText,
  AlertTriangle,
  CheckCheck,
  Download,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  listNotifications,
  markAllAsRead,
  markAsRead,
  type SerializedNotification,
} from "@/lib/notifications.server";
import { toast } from "sonner";

export function getNotificationIcon(type: string, priority: string) {
  if (type === "high_risk" || priority === "high" || priority === "urgent") {
    return <AlertTriangle className="h-4 w-4 text-rose-500" />;
  }
  if (type === "project_created" || type === "project_updated" || type === "project_archived") {
    return <FolderKanban className="h-4 w-4 text-indigo-500" />;
  }
  if (type === "scope_analysis" || type === "analysis_completed") {
    return <Sparkles className="h-4 w-4 text-amber-500" />;
  }
  if (type === "export_completed" || type === "export_failed") {
    return <Download className="h-4 w-4 text-emerald-500" />;
  }
  if (type === "security" || type === "login") {
    return <Shield className="h-4 w-4 text-blue-500" />;
  }
  return <FileText className="h-4 w-4 text-slate-500" />;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<SerializedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchLatest = async () => {
    try {
      setIsLoading(true);
      const res = (await listNotifications({ data: { limit: 5 } })) as {
        notifications: SerializedNotification[];
        unreadCount: number;
      };
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // Fail silently if unauthorized or offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    // Poll every 30 seconds for live notifications updates
    const interval = setInterval(fetchLatest, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read.");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to mark notifications as read.");
    }
  };

  const handleItemClick = async (n: SerializedNotification) => {
    if (!n.isRead) {
      try {
        await markAsRead({ data: { id: n.id } });
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
        );
      } catch {
        // Ignore read status error
      }
    }
    setOpen(false);
    if (n.actionUrl) {
      navigate({ to: n.actionUrl });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 bg-card text-card-foreground border-border rounded-xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-accent/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-primary/10 text-primary font-semibold"
              >
                {unreadCount} unread
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="mr-1 h-3 w-3 text-primary" /> Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[340px] overflow-y-auto divide-y divide-border/40">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> Loading
              notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <Bell className="h-6 w-6 mx-auto mb-2 opacity-40" />
              <span>No notifications yet.</span>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleItemClick(n)}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-accent/50 ${
                  !n.isRead ? "bg-primary/5" : ""
                }`}
              >
                <div className="p-2 rounded-lg bg-accent shrink-0 mt-0.5">
                  {getNotificationIcon(n.type, n.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {n.createdAt}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                </div>
                {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </button>
            ))
          )}
        </div>

        <div className="p-2 bg-accent/20 border-t border-border/40 text-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            onClick={() => setOpen(false)}
            className="w-full text-xs h-7 text-primary hover:text-primary/90"
          >
            <Link to="/app/notifications">
              <span>View all notifications</span>
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
