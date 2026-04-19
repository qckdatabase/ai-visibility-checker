import { useState } from "react";
import { Check, KeyRound, Sparkles, Bell, Users, Shield } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AdminSettings = () => {
  const [name, setName] = useState("Quinn Adams");
  const [email, setEmail] = useState("admin@qck.co");
  const [workspace, setWorkspace] = useState("QCK Internal");
  const [domain, setDomain] = useState("qck.co");

  const [models, setModels] = useState({
    "GPT-4o": true,
    "Claude 3.5": true,
    "Gemini Pro": true,
    Perplexity: false,
    "Llama 3": false,
  });

  const [notify, setNotify] = useState({
    weekly: true,
    drops: true,
    competitor: false,
    digest: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <AdminShell
      eyebrow="Configuration"
      title="Settings"
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
      {/* Profile */}
      <SettingsCard
        icon={Users}
        accent="prism-1"
        title="Profile"
        description="How you appear to your team."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" value={name} onChange={setName} />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
        </div>
        <div className="flex items-center gap-4 pt-2">
          <div className="size-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-mono font-semibold">
            {name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">Avatar</p>
            <p className="text-xs text-muted-foreground">
              We use your initials. Upload coming soon.
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Workspace */}
      <SettingsCard
        icon={Shield}
        accent="prism-2"
        title="Workspace"
        description="Your store identity for visibility audits."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Workspace name" value={workspace} onChange={setWorkspace} />
          <Field label="Primary domain" value={domain} onChange={setDomain} />
        </div>
      </SettingsCard>

      {/* AI models */}
      <SettingsCard
        icon={Sparkles}
        accent="prism-3"
        title="AI Models"
        description="Choose which models to query during visibility checks."
      >
        <div className="grid sm:grid-cols-2 gap-2">
          {Object.entries(models).map(([m, enabled]) => (
            <Toggle
              key={m}
              label={m}
              hint={enabled ? "Active" : "Disabled"}
              checked={enabled}
              onChange={(v) => setModels((s) => ({ ...s, [m]: v }))}
            />
          ))}
        </div>
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard
        icon={Bell}
        accent="prism-4"
        title="Notifications"
        description="Get alerted when something changes."
      >
        <div className="space-y-2">
          <Toggle
            label="Weekly visibility report"
            hint="Every Monday at 9:00"
            checked={notify.weekly}
            onChange={(v) => setNotify((s) => ({ ...s, weekly: v }))}
          />
          <Toggle
            label="Visibility drop alerts"
            hint="When score falls > 5 points"
            checked={notify.drops}
            onChange={(v) => setNotify((s) => ({ ...s, drops: v }))}
          />
          <Toggle
            label="Competitor mentions"
            hint="When a competitor outranks you"
            checked={notify.competitor}
            onChange={(v) => setNotify((s) => ({ ...s, competitor: v }))}
          />
          <Toggle
            label="Daily query digest"
            hint="Summary of last 24h"
            checked={notify.digest}
            onChange={(v) => setNotify((s) => ({ ...s, digest: v }))}
          />
        </div>
      </SettingsCard>

      {/* API keys */}
      <SettingsCard
        icon={KeyRound}
        accent="prism-5"
        title="API Access"
        description="Programmatic access to QCK reports."
      >
        <div className="p-4 rounded-2xl border hairline bg-surface-muted/40 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Live key
            </p>
            <p className="font-mono text-sm truncate">qck_live_••••••••••••••••8f2a</p>
          </div>
          <Button variant="outline" size="sm">Rotate</Button>
        </div>

        <div className="rounded-2xl border border-dashed hairline p-4 text-xs text-muted-foreground">
          <span className="text-foreground font-medium">Tip:</span> rotate keys
          quarterly. The previous key remains valid for 24 hours after rotation.
        </div>
      </SettingsCard>

      {/* Danger zone */}
      <section className="p-6 rounded-3xl border border-prism-3/30 bg-prism-3/5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-prism-3 mb-1">
          Danger zone
        </p>
        <h2 className="text-lg font-semibold tracking-tight mb-2">Delete workspace</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-prose">
          Permanently remove this workspace, all stored audits and historical
          query logs. This cannot be undone.
        </p>
        <Button variant="outline" size="sm" className="border-prism-3/40 text-prism-3 hover:bg-prism-3/10">
          Delete workspace
        </Button>
      </section>
    </AdminShell>
  );
};

const SettingsCard = ({
  icon: Icon,
  accent,
  title,
  description,
  children,
}: {
  icon: typeof Users;
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <label className="block">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      {label}
    </span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full px-4 py-3 rounded-2xl bg-surface border hairline focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all text-sm"
    />
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
