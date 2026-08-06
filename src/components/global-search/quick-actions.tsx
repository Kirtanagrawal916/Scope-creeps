import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Copy, Check, Pin, Archive, CheckCheck, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { executeQuickAction, type SearchResultItem } from "@/lib/search.server";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  item: SearchResultItem;
  onItemUpdated?: () => void;
  className?: string;
}

export function QuickActions({ item, onItemUpdated, className }: QuickActionsProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const fullUrl = `${window.location.origin}${item.url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (item.type !== "analysis") return;
    setLoading(true);
    try {
      const res = await executeQuickAction({
        data: { id: item.id, action: "toggle_pin" },
      });
      toast.success(res.message);
      onItemUpdated?.();
    } catch {
      toast.error("Failed to pin analysis");
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveProject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (item.type !== "project") return;
    setLoading(true);
    try {
      const res = await executeQuickAction({
        data: { id: item.id, action: "archive_project" },
      });
      toast.success(res.message);
      onItemUpdated?.();
    } catch {
      toast.error("Failed to archive project");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (item.type !== "notification") return;
    setLoading(true);
    try {
      const res = await executeQuickAction({
        data: { id: item.id, action: "mark_read" },
      });
      toast.success(res.message);
      onItemUpdated?.();
    } catch {
      toast.error("Failed to mark notification read");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity",
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">Copy Link</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px]">
            Copy Link
          </TooltipContent>
        </Tooltip>

        {item.type === "analysis" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={loading}
                className={cn(
                  "h-7 w-7 text-muted-foreground hover:text-foreground",
                  item.pinned && "text-amber-500 hover:text-amber-600",
                )}
                onClick={handleTogglePin}
              >
                <Pin className="h-3.5 w-3.5" />
                <span className="sr-only">{item.pinned ? "Unpin" : "Pin"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              {item.pinned ? "Unpin Analysis" : "Pin Analysis"}
            </TooltipContent>
          </Tooltip>
        )}

        {item.type === "project" && !item.archived && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={loading}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleArchiveProject}
              >
                <Archive className="h-3.5 w-3.5" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              Archive Project
            </TooltipContent>
          </Tooltip>
        )}

        {item.type === "notification" && item.unread && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={loading}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleMarkRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="sr-only">Mark as Read</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              Mark as Read
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: item.url as never });
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">Open</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px]">
            Open
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
