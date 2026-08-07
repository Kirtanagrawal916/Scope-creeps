import {
  FolderKanban,
  Sparkles,
  Download,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { formatRelativeDate } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  type: "project" | "analysis" | "export" | "notification";
  title: string;
  description: string;
  timestamp: string; // ISO string or human relative
  rawDate: Date;
  link?: string;
  status?: string;
  badge?: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  limit?: number;
}

function getGroupLabel(date: Date): "Today" | "Yesterday" | "This Week" | "Older" {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) {
    return "Today";
  }
  if (date >= startOfYesterday) {
    return "Yesterday";
  }
  if (date >= startOfWeek) {
    return "This Week";
  }
  return "Older";
}

function getActivityIcon(type: ActivityItem["type"], status?: string) {
  if (type === "analysis") {
    if (status === "confirmed_scope_creep" || status === "high") {
      return <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />;
    }
    return <Sparkles className="h-3.5 w-3.5 text-amber-500" />;
  }
  if (type === "project") {
    return <FolderKanban className="h-3.5 w-3.5 text-indigo-500" />;
  }
  if (type === "export") {
    return <Download className="h-3.5 w-3.5 text-emerald-500" />;
  }
  return <Bell className="h-3.5 w-3.5 text-blue-500" />;
}

export function ActivityTimeline({ activities, limit = 10 }: ActivityTimelineProps) {
  const grouped = useMemo(() => {
    const sorted = [...activities]
      .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
      .slice(0, limit);

    const groups: Record<string, ActivityItem[]> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Older: [],
    };

    for (const item of sorted) {
      const label = getGroupLabel(item.rawDate);
      groups[label].push(item);
    }

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [activities, limit]);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border border-dashed rounded-xl border-border/60">
        <Clock className="h-8 w-8 mb-2 opacity-50 text-indigo-400" />
        <p className="text-xs font-medium">No recent activity logged yet.</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Activities will appear as you create projects and run scope scans.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([groupName, items]) => (
        <div key={groupName} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {groupName}
            </span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="relative pl-3 space-y-2.5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-border/50">
            {items.map((item) => (
              <div key={item.id} className="group relative flex items-start gap-3 text-xs">
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-xs group-hover:border-primary/50 transition-colors">
                  {getActivityIcon(item.type, item.status)}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground truncate">{item.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatRelativeDate(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate line-clamp-1">
                    {item.description}
                  </p>
                </div>

                {item.link && (
                  <Link
                    to={item.link as never}
                    className="shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    title="View details"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
