import { useMemo, useState } from "react";
import { Search, Filter, Download, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { recentQueries } from "@/lib/adminMockData";

const MODELS = ["All models", "GPT-4o", "Claude 3.5", "Gemini Pro", "Perplexity"];
const STATUSES: Array<"All" | "found" | "missing"> = ["All", "found", "missing"];

const AdminQueries = () => {
  const [q, setQ] = useState("");
  const [model, setModel] = useState("All models");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");

  const filtered = useMemo(() => {
    return recentQueries.filter((row) => {
      if (model !== "All models" && row.model !== model) return false;
      if (status !== "All" && row.status !== status) return false;
      if (q && !`${row.query} ${row.store}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [q, model, status]);

  const found = filtered.filter((r) => r.status === "found").length;
  const missing = filtered.length - found;

  return (
    <AdminShell
      eyebrow="Operations"
      title="Queries"
      actions={
        <Button variant="outline" size="sm">
          <Download className="size-3.5" />
          Export
        </Button>
      }
    >
      {/* Filter bar */}
      <section className="p-3 bg-surface border hairline rounded-3xl flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-muted/60">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by query or store…"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60 focus:ring-0 p-0"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        <Pill label="Model" value={model} options={MODELS} onChange={setModel} />
        <Pill
          label="Status"
          value={status}
          options={STATUSES as unknown as string[]}
          onChange={(v) => setStatus(v as (typeof STATUSES)[number])}
        />
      </section>

      {/* Summary chips */}
      <section className="flex flex-wrap gap-2 -mt-3">
        <Chip>
          <span className="font-mono tabular-nums">{filtered.length}</span> results
        </Chip>
        <Chip tone="ok">
          <CheckCircle2 className="size-3" />
          <span className="font-mono tabular-nums">{found}</span> found
        </Chip>
        <Chip tone="warn">
          <AlertCircle className="size-3" />
          <span className="font-mono tabular-nums">{missing}</span> missing
        </Chip>
      </section>

      {/* Table */}
      <section className="rounded-3xl bg-surface border hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b hairline bg-surface-muted/40">
                <th className="text-left py-3.5 px-5 font-normal">Query</th>
                <th className="text-left py-3.5 px-5 font-normal">Store</th>
                <th className="text-left py-3.5 px-5 font-normal">Model</th>
                <th className="text-left py-3.5 px-5 font-normal">Category</th>
                <th className="text-right py-3.5 px-5 font-normal">Rank</th>
                <th className="text-right py-3.5 px-5 font-normal">When</th>
                <th className="px-5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="group border-b hairline last:border-0 hover:bg-surface-muted/40 transition-colors"
                >
                  <td className="py-4 px-5 font-medium max-w-md">
                    <div className="flex items-center gap-2">
                      {r.status === "found" ? (
                        <span className="size-1.5 rounded-full bg-prism-5 shrink-0" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-prism-3 shrink-0" />
                      )}
                      <span className="truncate">{r.query}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-muted-foreground">{r.store}</td>
                  <td className="py-4 px-5">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-mono bg-surface-muted text-foreground">
                      {r.model}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-muted-foreground">{r.category}</td>
                  <td className="py-4 px-5 text-right font-mono tabular-nums">
                    {r.rank ? `#${r.rank}` : <span className="text-prism-3">—</span>}
                  </td>
                  <td className="py-4 px-5 text-right text-xs text-muted-foreground">
                    {r.time}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <ArrowUpRight className="size-3.5 text-muted-foreground/40 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                    No queries match your filters.
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

const Pill = ({
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
    <Filter className="size-3.5 text-muted-foreground" />
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      {label}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-sm font-medium focus:ring-0 cursor-pointer"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </label>
);

const Chip = ({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn";
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border hairline",
      tone === "ok" && "bg-prism-5/10 text-prism-5 border-prism-5/20",
      tone === "warn" && "bg-prism-3/10 text-prism-3 border-prism-3/20",
      tone === "neutral" && "bg-surface text-muted-foreground",
    )}
  >
    {children}
  </span>
);

export default AdminQueries;
