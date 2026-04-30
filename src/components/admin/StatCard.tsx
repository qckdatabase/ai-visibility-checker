import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: number;
  hint?: string;
  accent?: "prism-1" | "prism-2" | "prism-3" | "prism-4";
}

const StatCard = ({ label, value, delta, hint, accent = "prism-1" }: StatCardProps) => {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="relative p-6 rounded-3xl bg-surface border hairline glass-edge overflow-hidden">
      <div
        aria-hidden
        className="absolute top-0 right-0 size-32 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: `hsl(var(--${accent}))` }}
      />
      <div className="relative">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-3xl font-semibold tabular-nums tracking-tight mt-2">
          {value}
        </p>
        <div className="flex items-center justify-between mt-3">
          {typeof delta === "number" ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full",
                positive
                  ? "bg-success-surface text-success"
                  : "bg-warning-surface text-warning",
              )}
            >
              {positive ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {positive ? "+" : ""}
              {delta}%
            </span>
          ) : (
            <span />
          )}
          {hint && (
            <span className="text-[11px] text-muted-foreground">{hint}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
