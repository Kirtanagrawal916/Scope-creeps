import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
        <span className="font-mono text-[11px] font-bold">SG</span>
      </div>
      {showWord && (
        <span className="font-display text-[16px] font-semibold tracking-[-0.02em]">
          ScopeGuard
        </span>
      )}
    </div>
  );
}
