import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-[0_0_20px_-4px_var(--primary)]">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-primary-foreground">
          <path
            d="M12 2L4 5.5V11.5C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 11.5V5.5L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 12L11 14L15 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showWord && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">ScopeGuard</span>
      )}
    </div>
  );
}
