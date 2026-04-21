import React, { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminApi } from "@/lib/api/admin";
import { useQuery } from "@tanstack/react-query";
import { Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type StoreRow = {
  store: string;
  queryCount: number;
  lastSeen: string;
  avgRank: number | null;
};

const AdminStores: React.FC = () => {
  const [q, setQ] = useState("");
  const [health, setHealth] = useState("All");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["stores"],
    queryFn: () => adminApi.stores({ page: 1, limit: 200 }),
    staleTime: 2 * 60 * 1000,
  });

  const rows: StoreRow[] = data?.rows ?? [];
  const totalDomains = rows.length;
  const avgRank =
    rows.filter((r) => r.avgRank != null).length > 0
      ? Math.round(
          rows
            .filter((r) => r.avgRank != null)
            .reduce((acc, r) => acc + (r.avgRank ?? 0), 0) /
            rows.filter((r) => r.avgRank != null).length
        )
      : null;
  const opportunities = rows.filter((r) => r.avgRank == null).length;

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => b.queryCount - a.queryCount);
  }, [rows]);

  const visible = useMemo(() => {
    return sorted.filter((r) => {
      if (q && !r.store.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [sorted, q]);

  const renderLastSeen = (iso: string) => {
    if (!iso) return <span className="text-muted-foreground">—</span>;
    try {
      return (
        <span className="text-xs">
          {new Date(iso).toLocaleString()}
        </span>
      );
    } catch {
      return <span className="text-muted-foreground">—</span>;
    }
  };

  return (
    <AdminShell eyebrow="Catalog" title="Scanned stores">
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-surface border hairline relative overflow-hidden">
          <div
            aria-hidden
            className="absolute top-0 right-0 size-24 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: `hsl(var(--prism-1))` }}
          />
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Total Scanned Domains
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1.5">
            {totalDomains.toLocaleString()}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-surface border hairline relative overflow-hidden">
          <div
            aria-hidden
            className="absolute top-0 right-0 size-24 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: `hsl(var(--prism-2))` }}
          />
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Avg Rank
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1.5">
            {avgRank != null ? `#${avgRank}` : "—"}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-surface border hairline relative overflow-hidden">
          <div
            aria-hidden
            className="absolute top-0 right-0 size-24 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: `hsl(var(--prism-4))` }}
          />
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Opportunities
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1.5">
            {opportunities}
          </p>
        </div>
      </section>

      <section className="p-3 bg-surface border hairline rounded-3xl flex flex-col lg:flex-row gap-2">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-muted/60">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by domain…"
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
            <option>All</option>
            <option>healthy</option>
            <option>watch</option>
            <option>critical</option>
          </select>
        </label>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Loading stores…
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-sm text-red-600">
          Error: {(error as any)?.message ?? "Failed to load stores"}
        </div>
      ) : (
        <section className="rounded-3xl bg-surface border hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b hairline bg-surface-muted/40">
                  <th className="text-left py-3.5 px-5 font-normal">Store</th>
                  <th className="text-right py-3.5 px-5 font-normal">Queries</th>
                  <th className="text-right py-3.5 px-5 font-normal">Avg Rank</th>
                  <th className="text-left py-3.5 px-5 font-normal">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s, idx) => (
                  <tr
                    key={`${s.store}-${idx}`}
                    className={cn(
                      "border-b hairline last:border-0 hover:bg-surface-muted/40 transition-colors"
                    )}
                  >
                    <td className="py-3.5 px-5 font-medium">
                      <div className="flex items-center gap-2">
                        {s.store}
                        <a
                          href={`https://${s.store}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground/60 hover:text-foreground"
                          aria-label={`Open ${s.store}`}
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                      {s.queryCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                      {s.avgRank != null ? `#${s.avgRank}` : "—"}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-muted-foreground">
                      {renderLastSeen(s.lastSeen)}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-sm text-muted-foreground">
                      No stores match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AdminShell>
  );
};

export default AdminStores;
