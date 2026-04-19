import { useMemo, useState } from "react";
import { Search, Download, MoreHorizontal, Mail, ExternalLink, Flame } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { leads, type LeadRow, type LeadStatus, type LeadPriority } from "@/lib/adminMockData";

const STATUSES: (LeadStatus | "All")[] = ["All", "new", "contacted", "qualified", "converted", "lost"];
const PRIORITIES: (LeadPriority | "All")[] = ["All", "hot", "warm", "cold"];

const statusTone: Record<LeadStatus, string> = {
  new: "bg-prism-1/10 text-prism-1 border-prism-1/20",
  contacted: "bg-prism-4/10 text-prism-4 border-prism-4/20",
  qualified: "bg-prism-2/10 text-prism-2 border-prism-2/20",
  converted: "bg-prism-5/10 text-prism-5 border-prism-5/20",
  lost: "bg-surface-muted text-muted-foreground border-border",
};

const priorityTone: Record<LeadPriority, string> = {
  hot: "bg-prism-3/10 text-prism-3 border-prism-3/20",
  warm: "bg-prism-4/10 text-prism-4 border-prism-4/20",
  cold: "bg-surface-muted text-muted-foreground border-border",
};

const numberFmt = new Intl.NumberFormat("en-US");

const AdminLeads = () => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [priority, setPriority] = useState<string>("All");

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        if (status !== "All" && l.status !== status) return false;
        if (priority !== "All" && l.priority !== priority) return false;
        if (q && !`${l.name} ${l.email} ${l.domain}`.toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [q, status, priority],
  );

  const counts = useMemo(() => {
    const total = leads.length;
    const fresh = leads.filter((l) => l.status === "new").length;
    const qualified = leads.filter((l) => l.status === "qualified").length;
    const converted = leads.filter((l) => l.status === "converted").length;
    return { total, fresh, qualified, converted };
  }, []);

  return (
    <AdminShell
      eyebrow="Pipeline"
      title="Leads"
      actions={
        <Button variant="outline" size="sm">
          <Download className="size-3.5" />
          Export CSV
        </Button>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 max-w-2xl">
        Every store owner who runs a free visibility check becomes a lead. Use this pipeline
        to follow up and convert them into QCK SEO clients.
      </p>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total leads"     value={numberFmt.format(counts.total * 312)} accent="prism-1" />
        <Stat label="New (uncontacted)" value={numberFmt.format(counts.fresh * 84)}  accent="prism-4" />
        <Stat label="Qualified"       value={numberFmt.format(counts.qualified * 38)} accent="prism-2" />
        <Stat label="Converted to QCK" value={numberFmt.format(counts.converted * 12)} accent="prism-5" />
      </section>

      <section className="p-3 bg-surface border hairline rounded-3xl flex flex-col lg:flex-row gap-2">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-muted/60">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email or domain…"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60 focus:ring-0 p-0"
          />
        </div>
        <SelectPill label="Status" value={status} options={STATUSES as string[]} onChange={setStatus} />
        <SelectPill label="Priority" value={priority} options={PRIORITIES as string[]} onChange={setPriority} />
      </section>

      <section className="rounded-3xl bg-surface border hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b hairline bg-surface-muted/40">
                <th className="text-left py-3.5 px-5 font-normal">Lead</th>
                <th className="text-left py-3.5 px-5 font-normal">Store</th>
                <th className="text-left py-3.5 px-5 font-normal w-44">Visibility</th>
                <th className="text-left py-3.5 px-5 font-normal">Status</th>
                <th className="text-left py-3.5 px-5 font-normal">Priority</th>
                <th className="text-left py-3.5 px-5 font-normal">Assigned</th>
                <th className="text-right py-3.5 px-5 font-normal">Last scan</th>
                <th className="px-5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="border-b hairline last:border-0 hover:bg-surface-muted/40 transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-mono font-semibold shrink-0">
                        {l.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{l.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{l.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="truncate">{l.domain}</span>
                      <ExternalLink className="size-3 text-muted-foreground/60 shrink-0" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {l.scans} scan{l.scans === 1 ? "" : "s"} · via {l.source}
                    </p>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${l.visibility}%`,
                            background:
                              l.visibility >= 60
                                ? "hsl(var(--prism-5))"
                                : l.visibility >= 35
                                ? "hsl(var(--prism-4))"
                                : "hsl(var(--prism-3))",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono tabular-nums w-7 text-right">
                        {l.visibility}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border hairline capitalize",
                        statusTone[l.status],
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border hairline capitalize",
                        priorityTone[l.priority],
                      )}
                    >
                      {l.priority === "hot" && <Flame className="size-3" />}
                      {l.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-sm">
                    {l.assignedTo ? (
                      <span className="text-foreground">{l.assignedTo}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right text-muted-foreground text-xs">
                    {l.lastScan}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        className="size-8 rounded-full hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                        aria-label="Email lead"
                      >
                        <Mail className="size-3.5" />
                      </button>
                      <button
                        className="size-8 rounded-full hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                        aria-label="More"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                    No leads match your filters.
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
  accent: "prism-1" | "prism-2" | "prism-4" | "prism-5";
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

const SelectPill = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) => (
  <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border hairline bg-surface hover:bg-surface-muted/50 transition-colors cursor-pointer">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      {label}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-sm font-medium focus:ring-0 cursor-pointer capitalize"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </label>
);

export default AdminLeads;
