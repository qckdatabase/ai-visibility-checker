import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, KeyRound, ShieldAlert } from "lucide-react";
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

  const configAction = useMutation({
    mutationFn: adminApi.configAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "config"] }),
  });

  const [purgeLoading, setPurgeLoading] = useState(false);
  const [purgeDone, setPurgeDone] = useState(false);

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

  const updateConfig = useMutation({
    mutationFn: adminApi.updateConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "config"] }),
  });

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
    <AdminShell eyebrow="System" title="System configuration">
      {/* Status */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat
          label="Maintenance mode"
          value={config?.maintenanceMode ? "Active" : "Off"}
          accent="prism-3"
        />
        <Stat
          label="Admin password"
          value={config?.adminPasswordSet ? "Set" : "Not set"}
          accent="prism-2"
        />
        <Stat
          label="Server version"
          value={config?.serverVersion ?? "—"}
          accent="prism-1"
        />
      </section>

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
                      ? "bg-success-surface text-success border-success/20"
                      : "bg-warning-surface text-warning border-warning/20",
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
                  <p className="text-xs text-warning">{openaiRotateError}</p>
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
                <p className="text-xs text-warning">{passwordError}</p>
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
      <section className="p-6 rounded-3xl border border-danger/30 bg-danger/5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-danger mb-1">
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
            className="border-danger/40 text-danger hover:bg-danger/10"
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
}: {
  label: string;
  value: string;
  accent: "prism-1" | "prism-2" | "prism-3" | "prism-4";
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
    <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1.5 text-foreground">
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
  icon: typeof KeyRound;
  accent: "prism-3" | "prism-4";
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

export default AdminSettings;
