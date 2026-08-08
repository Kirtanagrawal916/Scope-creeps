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
  }, [target, duration, mv, rounded]);
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2 }}
      className="panel lift border-l-2 border-l-primary p-5 hover:border-l-primary"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-primary" strokeWidth={1.6} />
      </div>
      <div className="mt-5 font-display text-3xl font-semibold tracking-tight tabular-nums">
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </div>
      {delta && (
        <div
          className={cn(
            "mt-2 text-xs font-medium",
            trend === "up" && "text-success",
            trend === "down" && "text-destructive",
            trend === "neutral" && "text-muted-foreground",
          )}
        >
          {delta}
        </div>
      )}
    </motion.div>
  );
}
