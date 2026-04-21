import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  KeyRound,
  Gauge,
  Bell,
  ShieldAlert,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api/admin";

const AdminSettings = () => {
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["admin", "config"],
    queryFn: adminApi.config,
  });

  const updateConfig = useMutation({
    mutationFn: adminApi.updateConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "config"] }),
  });

  const configAction = useMutation({
    mutationFn: adminApi.configAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "config"] }),
  });

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
  const [saving, setSaving] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [purgeDone, setPurgeDone] = useState(false);

  useEffect(() => {
    if (!config) return;
    setRateLimit(String(config.rateLimitChecksPerHour));
    setMaxResults(String(config.rateLimitMaxResults));
    setScanTimeout(String(config.rateLimitScanTimeoutMs));
    setRetention(String(config.queryRetentionDays));
    setFlags({
      publicChecker: config.flagPublicChecker,
      requireSignup: config.flagRequireSignup,
      competitorTracking: config.flagCompetitorTracking,
      autoBlockAbuse: config.flagAutoBlockAbuse,
    });
    setAlerts({
      modelDown: config.alertModelDown,
      errorSpike: config.alertErrorSpike,
      queueBackup: config.alertQueueBackup,
      abuseDetected: config.alertAbuseDetected,
      weeklyDigest: config.alertWeeklyDigest,
    });
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig.mutateAsync({
        rateLimitChecksPerHour: Number(rateLimit),
        rateLimitMaxResults: Number(maxResults),
        rateLimitScanTimeoutMs: Number(scanTimeout),
        queryRetentionDays: Number(retention),
        flagPublicChecker: flags.publicChecker,
        flagRequireSignup: flags.requireSignup,
        flagCompetitorTracking: flags.competitorTracking,
        flagAutoBlockAbuse: flags.autoBlockAbuse,
        alertModelDown: alerts.modelDown,
        alertErrorSpike: alerts.errorSpike,
        alertQueueBackup: alerts.queueBackup,
        alertAbuseDetected: alerts.abuseDetected,
        alertWeeklyDigest: alerts.weeklyDigest,
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggle = async () => {
    await configAction.mutateAsync({
      action: config?.maintenanceMode ? "disable_maintenance" : "enable_maintenance",
    });
  };

  const handlePurgeCache = async () => {
    setPurgeLoading(true);
    try {
      await configAction.mutateAsync({ action: "purge_cache" });
      setPurgeDone(true);
      window.setTimeout(() => setPurgeDone(false), 2000);
    } finally {
      setPurgeLoading(false);
    }
  };

  const [openaiRotateOpen, setOpenaiRotateOpen] = useState(false);
  const [newOpenaiKey, setNewOpenaiKey] = useState("");
  const [openaiRotateLoading, setOpenaiRotateLoading] = useState(false);
  const [openaiRotateError, setOpenaiRotateError] = useState("");
  const handleRotateOpenAI = async () => {
    setOpenaiRotateError("");
    setOpenaiRotateLoading(true);
    try {
      await updateConfig.mutateAsync({ openaiApiKey: newOpenaiKey });
      setNewOpenaiKey("");
      setOpenaiRotateOpen(false);
    } catch (err) {
      setOpenaiRotateError(err instanceof Error ? err.message : "Failed to update key");
    } finally {
      setOpenaiRotateLoading(false);
    }
  };

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordLoading(true);
    try {
      await updateConfig.mutateAsync({ adminPassword: newPassword });
      setNewPassword("");
      setPasswordOpen(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AdminShell
      eyebrow="System"
      title="System configuration"
      actions={
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saved ? (
            <>
              <Check className="size-3.5" />
              Saved
            </>
          ) : saving ? (
            "Saving…"
          ) : (
            "Save changes"
          )}
        </Button>
      }
    >
      {/* System health */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Retention" value={config ? `${config.queryRetentionDays}d` : "—"} accent="prism-4" />
        <Stat label="Admin password" value={config?.adminPasswordSet ? "Set" : "Not set"} accent="prism-2" />
        <Stat label="Maintenance mode" value={config?.maintenanceMode ? "Active" : "Off"} accent="prism-3" tone={config?.maintenanceMode ? undefined : "ok"} />
        <Stat label="Server version" value={config?.serverVersion ?? "—"} accent="prism-1" />
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

      {/* OpenAI API Key */}
      <SettingsCard
        icon={KeyRound}
        accent="prism-4"
        title="OpenAI API Key"
        description="Used for GPT-4o pipeline calls. Rotating the key requires no restart."
      >
        <div className="space-y-4">
          {config ? (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  OpenAI
                </p>
                <p className="font-mono text-sm truncate">
                  {config.openaiApiKeyStatus === "not_set"
                    ? "Not configured"
                    : config.openaiApiKeyMasked}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                    config.openaiApiKeyStatus === "active"
                      ? "bg-prism-5/10 text-prism-5 border-prism-5/20"
                      : "bg-prism-3/10 text-prism-3 border-prism-3/20",
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {config.openaiApiKeyStatus === "active" ? "Active" : "Not set"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenaiRotateOpen((v) => !v)}
                >
                  {openaiRotateOpen ? "Cancel" : "Rotate"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-8 w-32 rounded-xl bg-surface-muted animate-pulse" />
          )}

          {openaiRotateOpen && (
            <div className="space-y-3 p-4 rounded-2xl border hairline bg-surface-muted/40">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  New OpenAI API Key
                </span>
                <input
                  value={newOpenaiKey}
                  onChange={(e) => setNewOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="mt-1 w-full px-4 py-3 rounded-2xl bg-surface border hairline focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all text-sm font-mono"
                />
              </label>
              {openaiRotateError && (
                <p className="text-xs text-prism-3">{openaiRotateError}</p>
              )}
              <Button
                size="sm"
                variant="primary"
                onClick={handleRotateOpenAI}
                disabled={openaiRotateLoading || !newOpenaiKey}
              >
                {openaiRotateLoading ? "Saving…" : "Save new key"}
              </Button>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Admin password */}
      <SettingsCard
        icon={ShieldAlert}
        accent="prism-3"
        title="Admin password"
        description="Shared password for the operator console."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Console password</p>
              <p className="text-xs text-muted-foreground">
                {config?.adminPasswordSet ? "Password is set" : "Not configured"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasswordOpen((v) => !v)}
            >
              {passwordOpen ? "Cancel" : "Change"}
            </Button>
          </div>

          {passwordOpen && (
            <div className="space-y-3 p-4 rounded-2xl border hairline bg-surface-muted/40">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  New password (min 8 chars)
                </span>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="mt-1 w-full px-4 py-3 rounded-2xl bg-surface border hairline focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all text-sm"
                />
              </label>
              {passwordError && (
                <p className="text-xs text-prism-3">{passwordError}</p>
              )}
              <Button
                size="sm"
                variant="primary"
                onClick={handleChangePassword}
                disabled={passwordLoading || newPassword.length < 8}
              >
                {passwordLoading ? "Saving…" : "Update password"}
              </Button>
            </div>
          )}
        </div>
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
            onClick={handleMaintenanceToggle}
            disabled={configAction.isPending}
          >
            {config?.maintenanceMode ? "Disable maintenance mode" : "Enable maintenance mode"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePurgeCache}
            disabled={purgeLoading || purgeDone}
          >
            {purgeDone ? (
              <>
                <Check className="size-3.5" />
                Purged
              </>
            ) : purgeLoading ? (
              "Purging…"
            ) : (
              "Purge query cache"
            )}
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

export default AdminSettings;
