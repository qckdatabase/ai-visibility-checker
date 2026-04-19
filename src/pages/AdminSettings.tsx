import { useState } from "react";
import {
  Check,
  KeyRound,
  Gauge,
  Bell,
  ShieldAlert,
  Server,
  Database,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { systemHealth } from "@/lib/adminMockData";

const numberFmt = new Intl.NumberFormat("en-US");

const AdminSettings = () => {
  const [rateLimit, setRateLimit] = useState("60");
  const [maxResults, setMaxResults] = useState("10");
  const [scanTimeout, setScanTimeout] = useState("8000");
  const [retention, setRetention] = useState("90");

  const [flags, setFlags] = useState({
    publicChecker: true,
    requireSignup: false,
    competitorTracking: true,
    autoBlockAbuse: true,
  });

  const [alerts, setAlerts] = useState({
    modelDown: true,
    errorSpike: true,
    queueBackup: true,
    abuseDetected: true,
    weeklyDigest: false,
  });

  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <AdminShell
      eyebrow="System"
      title="System configuration"
      actions={
        <Button variant="primary" size="sm" onClick={handleSave}>
          {saved ? (
            <>
              <Check className="size-3.5" />
              Saved
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      }
    >
      {/* System health */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Uptime · 30d" value={`${systemHealth.uptime}%`} accent="prism-5" tone="ok" />
        <Stat label="API P95 latency" value={`${systemHealth.apiLatencyP95} ms`} accent="prism-1" />
        <Stat label="Error rate" value={`${systemHealth.errorRate}%`} accent="prism-4" />
        <Stat label="Queue depth" value={numberFmt.format(systemHealth.queueDepth)} accent="prism-2" />
      </section>

      {/* Rate limits & quotas */}
      <SettingsCard
        icon={Gauge}
        accent="prism-1"
        title="Rate limits & quotas"
        description="System-wide limits applied to every visibility check."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Checks / hour / IP"
            value={rateLimit}
            onChange={setRateLimit}
            suffix="checks"
          />
          <Field
            label="Max results returned"
            value={maxResults}
            onChange={setMaxResults}
            suffix="entries"
          />
          <Field
            label="Per-model scan timeout"
            value={scanTimeout}
            onChange={setScanTimeout}
            suffix="ms"
          />
          <Field
            label="Audit log retention"
            value={retention}
            onChange={setRetention}
            suffix="days"
          />
        </div>
      </SettingsCard>

      {/* Feature flags */}
      <SettingsCard
        icon={ShieldAlert}
        accent="prism-2"
        title="Feature flags"
        description="Toggle product behaviors across the entire platform."
      >
        <Toggle
          label="Public visibility checker"
          hint="Anyone can run a free check on the landing page"
          checked={flags.publicChecker}
          onChange={(v) => setFlags((s) => ({ ...s, publicChecker: v }))}
        />
        <Toggle
          label="Capture email before showing results"
          hint="Optional lead-capture step on the results sidebar"
          checked={flags.requireSignup}
          onChange={(v) => setFlags((s) => ({ ...s, requireSignup: v }))}
        />
        <Toggle
          label="Competitor tracking"
          hint="Store top-10 competitors per audit for trend analysis"
          checked={flags.competitorTracking}
          onChange={(v) => setFlags((s) => ({ ...s, competitorTracking: v }))}
        />
        <Toggle
          label="Auto-block abusive IPs"
          hint="Suspend after 50 failed checks in 5 minutes"
          checked={flags.autoBlockAbuse}
          onChange={(v) => setFlags((s) => ({ ...s, autoBlockAbuse: v }))}
        />
      </SettingsCard>

      {/* Operator alerts */}
      <SettingsCard
        icon={Bell}
        accent="prism-3"
        title="Operator alerts"
        description="Where the on-call team gets pinged."
      >
        <Toggle
          label="Model goes down"
          hint="Page on-call via PagerDuty"
          checked={alerts.modelDown}
          onChange={(v) => setAlerts((s) => ({ ...s, modelDown: v }))}
        />
        <Toggle
          label="Error rate spike > 5%"
          hint="Slack #qck-ops"
          checked={alerts.errorSpike}
          onChange={(v) => setAlerts((s) => ({ ...s, errorSpike: v }))}
        />
        <Toggle
          label="Queue backup > 500"
          hint="Slack #qck-ops"
          checked={alerts.queueBackup}
          onChange={(v) => setAlerts((s) => ({ ...s, queueBackup: v }))}
        />
        <Toggle
          label="Abuse pattern detected"
          hint="Email security@qck.co"
          checked={alerts.abuseDetected}
          onChange={(v) => setAlerts((s) => ({ ...s, abuseDetected: v }))}
        />
        <Toggle
          label="Weekly platform digest"
          hint="Sent every Monday 09:00 UTC"
          checked={alerts.weeklyDigest}
          onChange={(v) => setAlerts((s) => ({ ...s, weeklyDigest: v }))}
        />
      </SettingsCard>

      {/* Provider keys */}
      <SettingsCard
        icon={KeyRound}
        accent="prism-4"
        title="Provider API keys"
        description="Keys QCK uses to query each model provider."
      >
        {[
          { name: "OpenAI", masked: "sk-proj-••••••••••••••••3a91", status: "Active" },
          { name: "Anthropic", masked: "sk-ant-••••••••••••••••f04c", status: "Active" },
          { name: "Google AI", masked: "AIza••••••••••••••••0d72", status: "Active" },
          { name: "Perplexity", masked: "pplx-••••••••••••••••8c11", status: "Active" },
        ].map((k) => (
          <div
            key={k.name}
            className="p-4 rounded-2xl border hairline bg-surface-muted/40 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                {k.name}
              </p>
              <p className="font-mono text-sm truncate">{k.masked}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-prism-5/10 text-prism-5 border border-prism-5/20">
                <span className="size-1.5 rounded-full bg-current" />
                {k.status}
              </span>
              <Button variant="outline" size="sm">Rotate</Button>
            </div>
          </div>
        ))}
      </SettingsCard>

      {/* Infrastructure */}
      <SettingsCard
        icon={Server}
        accent="prism-5"
        title="Infrastructure"
        description="Where QCK runs."
      >
        <ReadonlyRow label="Region" value="us-east-1 · eu-west-1 (failover)" />
        <ReadonlyRow label="App version" value="v2.4.18" />
        <ReadonlyRow label="Database" value="Postgres 16 · primary + 2 replicas" icon={Database} />
        <ReadonlyRow label="Cache" value="Redis 7 cluster · 8 nodes" />
      </SettingsCard>

      {/* Danger zone */}
      <section className="p-6 rounded-3xl border border-prism-3/30 bg-prism-3/5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-prism-3 mb-1">
          Danger zone
        </p>
        <h2 className="text-lg font-semibold tracking-tight mb-2">
          Maintenance mode
        </h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-prose">
          Temporarily disable all visibility checks platform-wide. The landing
          page will show a maintenance banner and the API will return HTTP 503.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-prism-3/40 text-prism-3 hover:bg-prism-3/10"
          >
            Enable maintenance mode
          </Button>
          <Button variant="ghost" size="sm">
            Purge query cache
          </Button>
        </div>
      </section>
    </AdminShell>
  );
};

const Stat = ({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent: "prism-1" | "prism-2" | "prism-4" | "prism-5";
  tone?: "ok";
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
    <p
      className={cn(
        "text-2xl font-semibold tabular-nums tracking-tight mt-1.5",
        tone === "ok" && "text-prism-5",
      )}
    >
      {value}
    </p>
  </div>
);

const SettingsCard = ({
  icon: Icon,
  accent,
  title,
  description,
  children,
}: {
  icon: typeof Bell;
  accent: "prism-1" | "prism-2" | "prism-3" | "prism-4" | "prism-5";
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="grid lg:grid-cols-[280px_1fr] gap-5 p-6 rounded-3xl bg-surface border hairline">
    <div className="flex flex-col">
      <div
        className="size-10 rounded-2xl flex items-center justify-center mb-3"
        style={{
          background: `hsl(var(--${accent}) / 0.12)`,
          color: `hsl(var(--${accent}))`,
        }}
      >
        <Icon className="size-4" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

const Field = ({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) => (
  <label className="block">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      {label}
    </span>
    <div className="mt-1 flex items-center px-4 py-3 rounded-2xl bg-surface border hairline focus-within:ring-2 focus-within:ring-foreground/10 focus-within:border-foreground/20 transition-all">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        className="flex-1 bg-transparent border-none outline-none text-sm font-mono tabular-nums focus:ring-0 p-0"
      />
      {suffix && (
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground ml-2">
          {suffix}
        </span>
      )}
    </div>
  </label>
);

const Toggle = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-4 p-3.5 rounded-2xl border hairline bg-surface hover:bg-surface-muted/50 transition-colors text-left"
  >
    <div className="min-w-0">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
    <span
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
    </span>
  </button>
);

const ReadonlyRow = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Database;
}) => (
  <div className="flex items-center justify-between p-3.5 rounded-2xl border hairline bg-surface">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="size-3.5 text-muted-foreground" />}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="text-sm font-mono text-muted-foreground">{value}</span>
  </div>
);

export default AdminSettings;
