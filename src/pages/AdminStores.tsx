import { useMemo, useState } from "react";
import { Search, RefreshCw, ExternalLink, MoreHorizontal } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { stores, type StoreRow } from "@/lib/adminMockData";

const HEALTHS = ["All", "healthy", "watch", "critical"];

const healthTone: Record<StoreRow["health"], string> = {
  healthy: "bg-prism-5/10 text-prism-5 border-prism-5/20",
  watch: "bg-prism-4/10 text-prism-4 border-prism-4/20",
  critical: "bg-prism-3/10 text-prism-3 border-prism-3/20",
};

const numberFmt = new Intl.NumberFormat("en-US");

const AdminStores = () => {
  const [q, setQ] = useState("");
  const [health, setHealth] = useState("All");

  const filtered = useMemo(
    () =>
      stores.filter((s) => {
        if (health !== "All" && s.health !== health) return false;
        if (q && !`${s.domain} ${s.owner} ${s.category}`.toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [q, health],
  );

  const avgVis = Math.round(
    stores.reduce((acc, s) => acc + s.visibility, 0) / stores.length,
  );
  const critical = stores.filter((s) => s.health === "critical").length;

  return (
    <AdminShell
      eyebrow="Management"
      title="Stores"
      actions={
        <Button variant="outline" size="sm">
          <RefreshCw className="size-3.5" />
          Re-audit all
        </Button>
      }
    >
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Stat label="Tracked stores" value={numberFmt.format(3624)} accent="prism-1" />
        <Stat label="Avg visibility" value={`${avgVis}`} accent="prism-2" />
        <Stat label="Critical" value={`${critical}`} accent="prism-3" />
        <Stat label="Audits today" value={numberFmt.format(8214)} accent="prism-4" />
      </section>

      <section className="p-3 bg-surface border hairline rounded-3xl flex flex-col lg:flex-row gap-2">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-muted/60">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by domain, owner or category…"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60 focus:ring-0 p-0"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border hairline bg-surface cursor-pointer">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Health
          </span>
          <select
            value={health}
            onChange={(e) => setHealth(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium focus:ring-0 capitalize cursor-pointer"
          >
            {HEALTHS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-3xl bg-surface border hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b hairline bg-surface-muted/40">
                <th className="text-left py-3.5 px-5 font-normal">Store</th>
                <th className="text-left py-3.5 px-5 font-normal">Owner</th>
                <th className="text-left py-3.5 px-5 font-normal">Category</th>
                <th className="text-left py-3.5 px-5 font-normal w-48">Visibility</th>
                <th className="text-right py-3.5 px-5 font-normal">Audits</th>
                <th className="text-left py-3.5 px-5 font-normal">Health</th>
                <th className="text-right py-3.5 px-5 font-normal">Last audit</th>
                <th className="px-5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b hairline last:border-0 hover:bg-surface-muted/40 transition-colors"
                >
                  <td className="py-3.5 px-5 font-medium">
                    <div className="flex items-center gap-2">
                      {s.domain}
                      <ExternalLink className="size-3 text-muted-foreground/60" />
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-muted-foreground">{s.owner}</td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] bg-surface-muted text-muted-foreground">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.visibility}%`,
                            background:
                              s.visibility >= 60
                                ? "hsl(var(--prism-5))"
                                : s.visibility >= 35
                                ? "hsl(var(--prism-4))"
                                : "hsl(var(--prism-3))",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono tabular-nums w-7 text-right">
                        {s.visibility}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                    {numberFmt.format(s.audits)}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border hairline capitalize",
                        healthTone[s.health],
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {s.health}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right text-xs text-muted-foreground">
                    {s.lastAudit}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      className="size-8 rounded-full hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center inline-flex"
                      aria-label="More"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                    No stores match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1.5">
      {value}
    </p>
  </div>
);

export default AdminStores;
