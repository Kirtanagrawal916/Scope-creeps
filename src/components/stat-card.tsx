import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function useCountUp(target: number, duration = 1.2) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const rounded = useTransform(mv, (latest) => Math.round(latest));
  useEffect(() => {
    const controls = animate(mv, target, { duration, ease: [0.16, 1, 0.3, 1] });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [target]);
  return display;
}

export function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  delta,
  icon: Icon,
  trend,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}) {
  const display = useCountUp(value);
  const formatted = display.toLocaleString();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="panel group relative overflow-hidden p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-muted-foreground transition-colors group-hover:text-foreground">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-[28px] font-semibold tracking-tight text-foreground tabular-nums">
          {prefix}
          {formatted}
          {suffix}
        </span>
      </div>
      {delta && (
        <div
          className={cn(
            "mt-1 text-[12px] font-medium tabular-nums",
            trend === "up" && "text-[color:var(--success)]",
            trend === "down" && "text-[color:var(--destructive)]",
            trend === "neutral" && "text-muted-foreground",
          )}
        >
          {delta}
        </div>
      )}
    </motion.div>
  );
}
