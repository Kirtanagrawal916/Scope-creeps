import { type LucideIcon, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface SmartEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionTo?: string;
  onActionClick?: () => void;
  secondaryActionText?: string;
  secondaryActionTo?: string;
}

export function SmartEmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionTo,
  onActionClick,
  secondaryActionText,
  secondaryActionTo,
}: SmartEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 backdrop-blur-sm space-y-4 max-w-lg mx-auto">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-md">
        <Icon className="h-7 w-7" />
        <div className="absolute -inset-1 rounded-2xl bg-primary/5 -z-10 blur-sm" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">{description}</p>
      </div>

      {(actionText || secondaryActionText) && (
        <div className="flex items-center gap-2 pt-2">
          {actionText && actionTo && (
            <Link to={actionTo as never}>
              <Button size="sm" className="gap-1.5 shadow-sm text-xs cursor-pointer">
                <span>{actionText}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}

          {actionText && onActionClick && !actionTo && (
            <Button
              size="sm"
              onClick={onActionClick}
              className="gap-1.5 shadow-sm text-xs cursor-pointer"
            >
              <span>{actionText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}

          {secondaryActionText && secondaryActionTo && (
            <Link to={secondaryActionTo as never}>
              <Button size="sm" variant="outline" className="text-xs cursor-pointer">
                {secondaryActionText}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
