import { useState } from "react";
import { Cpu, Activity, AlertTriangle, CircleCheck, CircleX } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { aiModels, type ModelStatus } from "@/lib/adminMockData";

const statusMap: Record<
  ModelStatus["status"],
  { tone: string; label: string; icon: typeof CircleCheck }
> = {
  operational: {
    tone: "bg-prism-5/10 text-prism-5 border-prism-5/20",
    label: "Operational",
    icon: CircleCheck,
  },
  degraded: {
    tone: "bg-prism-4/10 text-prism-4 border-prism-4/20",
    label: "Degraded",
    icon: AlertTriangle,
  },
  down: {
    tone: "bg-prism-3/10 text-prism-3 border-prism-3/20",
    label: "Down",
    icon: CircleX,
  },
};

const AdminModels = () => {
  const [models, setModels] = useState<ModelStatus[]>(aiModels);

  const toggle = (id: string) =>
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    );

  const enabled = models.filter((m) => m.enabled).length;
  const degraded = models.filter((m) => m.status !== "operational").length;

  return (
    <AdminShell
      eyebrow="Management"
      title="AI Models"
      actions={<Button variant="outline" size="sm">Run health check</Button>}
    >
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Models enabled" value={`${enabled} / ${models.length}`} accent="prism-1" />
        <Stat label="Degraded" value={`${degraded}`} accent="prism-4" />
        <Stat label="Avg P95 latency" value="612 ms" accent="prism-2" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {models.map((m) => {
          const s = statusMap[m.status];
          const Icon = s.icon;
          return (
            <article
              key={m.id}
              className={cn(
                "p-6 rounded-3xl bg-surface border hairline transition-opacity",
                !m.enabled && "opacity-60",
              )}
            >
              <header className="flex items-start justify-between mb-5">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-2xl bg-surface-muted flex items-center justify-center">
                    <Cpu className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {m.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{m.provider}</p>
                  </div>
                </div>
                <Toggle checked={m.enabled} onChange={() => toggle(m.id)} />
              </header>

              <div className="flex items-center gap-2 mb-5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border hairline",
                    s.tone,
                  )}
                >
                  <Icon className="size-3" />
                  {s.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono text-muted-foreground bg-surface-muted">
                  <Activity className="size-3" />
                  {m.share}% of traffic
                </span>
              </div>

              <dl className="grid grid-cols-3 gap-3 mb-5">
                <Metric label="Latency" value={`${m.latency}ms`} />
                <Metric
                  label="Errors"
                  value={`${m.errorRate}%`}
                  tone={m.errorRate > 2 ? "warn" : "ok"}
                />
                <Metric label="Cost / 1K" value={`$${m.costPer1k.toFixed(2)}`} />
              </dl>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Configure
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  View logs
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </AdminShell>
  );
};

const Stat = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "prism-1" | "prism-2" | "prism-4";
}) => (
  <div className="p-5 rounded-3xl bg-surface border hairline relative overflow-hidden">
    <div
      aria-hidden
      className="absolute top-0 right-0 size-24 rounded-full blur-3xl opacity-20 pointer-events-none"
      style={{ background: `hsl(var(--${accent}))` }}
    />
    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      {label}
    </p>
    <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1.5">
      {value}
    </p>
  </div>
);

const Metric = ({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn";
}) => (
  <div className="p-3 rounded-2xl bg-surface-muted/50">
    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
      {label}
    </p>
    <p
      className={cn(
        "font-mono tabular-nums font-semibold text-sm mt-0.5",
        tone === "warn" && "text-warning",
        tone === "ok" && "text-foreground",
      )}
    >
      {value}
    </p>
  </div>
);

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) => (
  <button
    type="button"
    onClick={onChange}
    aria-pressed={checked}
    className={cn(
      "relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors",
      checked ? "bg-foreground" : "bg-surface-muted border hairline",
    )}
  >
    <span
      className={cn(
        "absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-all",
        checked ? "left-[18px]" : "left-0.5",
      )}
    />
  </button>
);

export default AdminModels;
